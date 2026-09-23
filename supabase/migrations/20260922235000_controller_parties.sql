-- Account-bound controller parties. Game secrets remain in encrypted RoomSession traffic.
-- Tables deliberately have no direct client policies: all access uses the validated RPC.
CREATE TABLE public.controller_game_limits (
  game_id text PRIMARY KEY,
  min_players integer NOT NULL CHECK (min_players > 0),
  max_players integer NOT NULL CHECK (max_players >= min_players),
  premium boolean NOT NULL
);
INSERT INTO public.controller_game_limits VALUES
 ('bomb',2,20,false), ('headup',2,12,false), ('taboo',4,20,false),
 ('category',2,15,false), ('this-or-that',2,20,false), ('hochstapler',4,15,true),
 ('wahrheit-pflicht',2,20,true), ('wer-bin-ich',2,10,true), ('flaschendrehen',2,12,true),
 ('emoji-raten',2,20,true), ('fake-or-fact',2,20,true), ('schnellzeichner',2,10,true),
 ('split-quiz',4,30,true), ('geteilt-gequizzt',3,10,true), ('story-builder',2,20,true),
 ('wo-ist-was',1,10,true), ('drueck-das-wort',1,8,true), ('ohrwurm',2,4,false),
 ('pixeljagd',2,8,false), ('closeenough',2,8,false), ('pantomime',4,16,false), ('brew',2,8,false);

CREATE TABLE public.controller_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_player_id text NOT NULL CHECK (host_player_id ~ '^player-[0-9a-f]{64}$'),
  host_plays boolean NOT NULL DEFAULT true,
  revision bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','playing','finished')),
  playlist jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(playlist) = 'array'),
  current_match_id uuid,
  current_game_id text REFERENCES public.controller_game_limits(game_id),
  participant_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);
CREATE INDEX controller_parties_host_idx ON public.controller_parties(host_user_id, created_at);
CREATE TABLE public.controller_party_members (
  party_id uuid NOT NULL REFERENCES public.controller_parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id text NOT NULL CHECK (player_id ~ '^player-[0-9a-f]{64}$'),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 40),
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (party_id,user_id),
  UNIQUE (party_id,player_id)
);
CREATE INDEX controller_members_user_idx ON public.controller_party_members(user_id,joined_at);
CREATE TABLE public.controller_party_results (
  party_id uuid NOT NULL REFERENCES public.controller_parties(id) ON DELETE CASCADE,
  match_id uuid NOT NULL,
  game_id text NOT NULL REFERENCES public.controller_game_limits(game_id),
  scores jsonb NOT NULL CHECK (jsonb_typeof(scores) = 'object'),
  scored boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (party_id,match_id)
);
ALTER TABLE public.controller_game_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controller_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controller_party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controller_party_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.controller_game_limits, public.controller_parties,
 public.controller_party_members, public.controller_party_results FROM anon, authenticated;
GRANT ALL ON public.controller_game_limits, public.controller_parties,
 public.controller_party_members, public.controller_party_results TO service_role;

CREATE FUNCTION public.controller_party_snapshot(party_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT jsonb_build_object(
  'party', jsonb_build_object('id',p.id,'code',p.code,'host_user_id',p.host_user_id,
    'host_player_id',p.host_player_id,'host_plays',p.host_plays,'created_at',p.created_at,
    'premium',public.is_premium(p.host_user_id),'status',p.status,'playlist',p.playlist,'revision',p.revision,
    'current_match_id',p.current_match_id,'current_game_id',p.current_game_id),
  'members',COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id',m.user_id,
    'player_id',m.player_id,'name',m.name,'is_host',m.user_id=p.host_user_id) ORDER BY m.joined_at,m.user_id)
    FROM public.controller_party_members m WHERE m.party_id=p.id AND m.left_at IS NULL),'[]'::jsonb),
  'past_members',COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id',m.user_id,
    'player_id',m.player_id,'name',m.name,'is_host',false) ORDER BY m.joined_at,m.user_id)
    FROM public.controller_party_members m WHERE m.party_id=p.id AND m.left_at IS NOT NULL),'[]'::jsonb),
  'results',COALESCE((SELECT jsonb_agg(jsonb_build_object('match_id',r.match_id,
    'game_id',r.game_id,'scores',r.scores,'scored',r.scored,'created_at',r.created_at) ORDER BY r.created_at,r.match_id)
    FROM public.controller_party_results r WHERE r.party_id=p.id),'[]'::jsonb))
 FROM public.controller_parties p WHERE p.id=party_id
$$;
REVOKE ALL ON FUNCTION public.controller_party_snapshot(uuid) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.controller_party_request(action text, code text DEFAULT NULL, payload jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
#variable_conflict use_variable
DECLARE
  caller uuid := auth.uid();
  party public.controller_parties%ROWTYPE;
  member public.controller_party_members%ROWTYPE;
  limits public.controller_game_limits%ROWTYPE;
  requested_player text;
  requested_name text;
  requested_game text;
  match_id uuid;
  participants text[];
  expected_players text[];
  scores jsonb;
  is_scored boolean;
  generated_code text;
  seed bigint;
  attempts integer := 0;
  i integer;
BEGIN
  IF caller IS NULL OR COALESCE((auth.jwt()->>'is_anonymous')::boolean,false) THEN
    RAISE EXCEPTION 'Account sign-in required' USING ERRCODE='42501';
  END IF;
  IF action IS NULL OR action NOT IN ('create','join','read','start','finish','playlist','end','leave','abort') THEN
    RAISE EXCEPTION 'Unknown party action' USING ERRCODE='22023';
  END IF;
  IF payload IS NULL OR jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>32768 THEN
    RAISE EXCEPTION 'Invalid party payload' USING ERRCODE='22023';
  END IF;
  IF action IN ('create','join') THEN
    requested_player := payload->>'player_id';
    requested_name := btrim(payload->>'name');
    IF requested_player IS NULL OR requested_player !~ '^player-[0-9a-f]{64}$'
       OR requested_name IS NULL OR length(requested_name) NOT BETWEEN 1 AND 40 THEN
      RAISE EXCEPTION 'Invalid player identity or name' USING ERRCODE='22023';
    END IF;
    -- Serialize account-level creation limits, including concurrent requests.
    PERFORM pg_advisory_xact_lock(hashtextextended(caller::text,0));
  END IF;
  IF action='create' THEN
    IF payload ? 'host_plays' AND jsonb_typeof(payload->'host_plays')<>'boolean' THEN
      RAISE EXCEPTION 'Invalid host role' USING ERRCODE='22023';
    END IF;
    IF (SELECT count(*) FROM public.controller_parties p WHERE p.host_user_id=caller
        AND p.expires_at>now() AND p.status<>'finished')>=3
       OR (SELECT count(*) FROM public.controller_parties p WHERE p.host_user_id=caller
        AND p.created_at>now()-interval '24 hours')>=20 THEN
      RAISE EXCEPTION 'Too many parties. Finish an existing party first.' USING ERRCODE='54000';
    END IF;
    LOOP
      attempts := attempts+1;
      seed := ('x'||substr(replace(gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint;
      generated_code := '';
      FOR i IN 0..5 LOOP
        generated_code := generated_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',((seed >> (i*5)) & 31)::integer+1,1);
      END LOOP;
      BEGIN
        INSERT INTO public.controller_parties(code,host_user_id,host_player_id,host_plays)
        VALUES(generated_code,caller,requested_player,COALESCE((payload->>'host_plays')::boolean,true)) RETURNING * INTO party;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        IF attempts>=8 THEN RAISE EXCEPTION 'Unable to allocate party code'; END IF;
      END;
    END LOOP;
    INSERT INTO public.controller_party_members(party_id,user_id,player_id,name)
    VALUES(party.id,caller,requested_player,requested_name);
    RETURN public.controller_party_snapshot(party.id);
  END IF;

  IF code IS NULL OR upper(btrim(code)) !~ '^[A-HJ-NP-Z2-9]{6}$' THEN
    RAISE EXCEPTION 'Party unavailable' USING ERRCODE='22023';
  END IF;
  SELECT p.* INTO party FROM public.controller_parties p WHERE p.code=upper(btrim(code)) FOR UPDATE;
  IF NOT FOUND OR party.expires_at<=now() THEN
    RAISE EXCEPTION 'Party unavailable or expired' USING ERRCODE='22023';
  END IF;
  SELECT m.* INTO member FROM public.controller_party_members m WHERE m.party_id=party.id AND m.user_id=caller;
  IF action='join' THEN
    IF party.status='finished' THEN
      IF member.user_id IS NOT NULL AND member.left_at IS NULL AND member.player_id=requested_player THEN
        RETURN public.controller_party_snapshot(party.id);
      END IF;
      RAISE EXCEPTION 'Party has ended' USING ERRCODE='22023';
    END IF;
    IF member.user_id IS NULL OR member.left_at IS NOT NULL THEN
      IF party.status='finished' THEN RAISE EXCEPTION 'Party has ended' USING ERRCODE='22023'; END IF;
      IF (SELECT count(*) FROM public.controller_party_members m WHERE m.party_id=party.id
          AND m.left_at IS NULL AND (party.host_plays OR m.user_id<>party.host_user_id))>=12 THEN
        RAISE EXCEPTION 'Party is full' USING ERRCODE='22023';
      END IF;
    END IF;
    IF member.user_id IS NULL THEN
      IF EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id AND m.player_id=requested_player)
        OR EXISTS (SELECT 1 FROM public.controller_party_results r WHERE r.party_id=party.id AND r.scores ? requested_player) THEN
        RAISE EXCEPTION 'Controller already belongs to another account' USING ERRCODE='42501';
      END IF;
      INSERT INTO public.controller_party_members(party_id,user_id,player_id,name)
      VALUES(party.id,caller,requested_player,requested_name);
    ELSE
      IF party.status='playing' AND member.player_id<>requested_player THEN
        RAISE EXCEPTION 'Reconnect using the same controller until the match ends' USING ERRCODE='42501';
      END IF;
      IF member.player_id<>requested_player THEN
        IF EXISTS(SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id AND m.player_id=requested_player)
          OR EXISTS(SELECT 1 FROM public.controller_party_results r WHERE r.party_id=party.id AND r.scores ? requested_player) THEN
          RAISE EXCEPTION 'Controller already belongs to another participant' USING ERRCODE='42501';
        END IF;
        -- Account identity remains stable when a phone changes between matches.
        -- Rewrite historical score keys atomically with the controller binding.
        UPDATE public.controller_party_results r
          SET scores=(r.scores-member.player_id) || jsonb_build_object(requested_player,r.scores->member.player_id)
          WHERE r.party_id=party.id AND r.scores ? member.player_id;
      END IF;
      UPDATE public.controller_party_members m SET player_id=requested_player,name=requested_name,left_at=NULL
      WHERE m.party_id=party.id AND m.user_id=caller;
      IF caller=party.host_user_id THEN
        UPDATE public.controller_parties p SET host_player_id=requested_player WHERE p.id=party.id;
      END IF;
    END IF;
    UPDATE public.controller_parties p SET revision=p.revision+1 WHERE p.id=party.id;
    RETURN public.controller_party_snapshot(party.id);
  END IF;
  IF member.user_id IS NULL OR member.left_at IS NOT NULL THEN RAISE EXCEPTION 'Party membership required' USING ERRCODE='42501'; END IF;
  IF action='read' THEN RETURN public.controller_party_snapshot(party.id); END IF;
  IF action='leave' THEN
    IF caller=party.host_user_id THEN
      RAISE EXCEPTION 'The host must end the party' USING ERRCODE='22023';
    END IF;
    IF party.status='playing' AND member.player_id=ANY(party.participant_ids) THEN
      RAISE EXCEPTION 'Wait for the host to finish or abort the current match' USING ERRCODE='22023';
    END IF;
    UPDATE public.controller_party_members m SET left_at=now() WHERE m.party_id=party.id AND m.user_id=caller;
    UPDATE public.controller_parties p SET revision=p.revision+1 WHERE p.id=party.id;
    RETURN public.controller_party_snapshot(party.id);
  END IF;
  IF caller<>party.host_user_id THEN RAISE EXCEPTION 'Host action required' USING ERRCODE='42501'; END IF;
  IF action='finish' THEN
    BEGIN match_id := (payload->>'match_id')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Invalid match' USING ERRCODE='22023'; END;
    -- Repeated delivery never creates a second result, even after the next game starts.
    IF EXISTS (SELECT 1 FROM public.controller_party_results r WHERE r.party_id=party.id AND r.match_id=match_id) THEN
      RETURN public.controller_party_snapshot(party.id);
    END IF;
    IF party.status<>'playing' OR match_id IS NULL OR match_id<>party.current_match_id
       OR (payload->>'game_id') IS DISTINCT FROM party.current_game_id THEN
      RAISE EXCEPTION 'Match is no longer active' USING ERRCODE='22023';
    END IF;
    scores := payload->'scores';
    IF scores IS NULL OR jsonb_typeof(scores)<>'object' OR jsonb_typeof(payload->'scored') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'Invalid match scores' USING ERRCODE='22023';
    END IF;
    IF EXISTS (SELECT 1 FROM jsonb_each(scores) s WHERE NOT (s.key=ANY(party.participant_ids)) OR jsonb_typeof(s.value)<>'number')
      OR (SELECT count(*) FROM jsonb_object_keys(scores))<>cardinality(party.participant_ids) THEN
      RAISE EXCEPTION 'Scores must match the active participants' USING ERRCODE='22023';
    END IF;
    IF EXISTS (SELECT 1 FROM jsonb_each_text(scores) s WHERE abs(s.value::numeric)>1000000000) THEN
      RAISE EXCEPTION 'Score outside supported range' USING ERRCODE='22023';
    END IF;
    is_scored := (payload->>'scored')::boolean;
    INSERT INTO public.controller_party_results(party_id,match_id,game_id,scores,scored)
      VALUES(party.id,match_id,party.current_game_id,scores,is_scored);
    -- One transaction records the result and personal statistics. Only frozen
    -- participants receive a played game; the non-playing moderator never does.
    INSERT INTO public.game_stats AS stats(user_id,game_id,games_played,games_won,
      total_score,best_score,streak,best_streak,last_played_at,updated_at)
    SELECT m.user_id,party.current_game_id,1,
      CASE WHEN result.won THEN 1 ELSE 0 END,
      result.score,greatest(0,result.score),
      CASE WHEN result.won THEN 1 ELSE 0 END,CASE WHEN result.won THEN 1 ELSE 0 END,now(),now()
    FROM public.controller_party_members m
    CROSS JOIN LATERAL (SELECT
      CASE WHEN is_scored THEN round((scores->>m.player_id)::numeric)::integer ELSE 0 END AS score,
      is_scored AND (scores->>m.player_id)::numeric=(SELECT max(s.value::numeric) FROM jsonb_each_text(scores) s) AS won
    ) result
    WHERE m.party_id=party.id AND m.player_id=ANY(party.participant_ids)
    ORDER BY m.user_id
    ON CONFLICT(user_id,game_id) DO UPDATE SET
      games_played=COALESCE(stats.games_played,0)+1,
      games_won=COALESCE(stats.games_won,0)+EXCLUDED.games_won,
      total_score=COALESCE(stats.total_score,0)+EXCLUDED.total_score,
      best_score=greatest(COALESCE(stats.best_score,0),EXCLUDED.best_score),
      streak=CASE WHEN NOT is_scored THEN COALESCE(stats.streak,0)
        WHEN EXCLUDED.games_won=1 THEN COALESCE(stats.streak,0)+1 ELSE 0 END,
      best_streak=greatest(COALESCE(stats.best_streak,0),CASE WHEN EXCLUDED.games_won=1 THEN COALESCE(stats.streak,0)+1 ELSE 0 END),
      last_played_at=now(),updated_at=now();
    UPDATE public.controller_parties p SET revision=p.revision+1,status='lobby',current_match_id=NULL,current_game_id=NULL,participant_ids='{}' WHERE p.id=party.id;
  ELSIF action='start' THEN
    IF party.status<>'lobby' THEN RAISE EXCEPTION 'Party is not ready for a new match' USING ERRCODE='22023'; END IF;
    requested_game := payload->>'game_id';
    SELECT g.* INTO limits FROM public.controller_game_limits g WHERE g.game_id=requested_game;
    IF NOT FOUND THEN RAISE EXCEPTION 'Unknown game' USING ERRCODE='22023'; END IF;
    IF limits.premium AND NOT public.is_premium(party.host_user_id) THEN
      RAISE EXCEPTION 'Host premium subscription required' USING ERRCODE='42501';
    END IF;
    IF jsonb_typeof(payload->'participant_ids') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Invalid participants' USING ERRCODE='22023';
    END IF;
    SELECT array_agg(v ORDER BY v) INTO participants FROM jsonb_array_elements_text(payload->'participant_ids') v;
    SELECT array_agg(m.player_id ORDER BY m.player_id) INTO expected_players FROM public.controller_party_members m
      WHERE m.party_id=party.id AND m.left_at IS NULL AND (party.host_plays OR m.user_id<>party.host_user_id);
    IF participants IS NULL OR participants IS DISTINCT FROM expected_players
      OR cardinality(participants)<greatest(2,limits.min_players)
      OR cardinality(participants)>least(12,limits.max_players) THEN
      RAISE EXCEPTION 'Choose a game compatible with all party players' USING ERRCODE='22023';
    END IF;
    UPDATE public.controller_parties p SET revision=p.revision+1,status='playing',current_match_id=gen_random_uuid(),
      current_game_id=requested_game,participant_ids=participants WHERE p.id=party.id;
  ELSIF action='playlist' THEN
    IF party.status<>'lobby' THEN RAISE EXCEPTION 'Change the setlist between games' USING ERRCODE='22023'; END IF;
    IF jsonb_typeof(payload->'playlist') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Invalid setlist' USING ERRCODE='22023';
    END IF;
    IF jsonb_array_length(payload->'playlist')>30 OR EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(payload->'playlist') v
      WHERE NOT EXISTS(SELECT 1 FROM public.controller_game_limits g WHERE g.game_id=v)
    ) THEN RAISE EXCEPTION 'Invalid setlist' USING ERRCODE='22023'; END IF;
    UPDATE public.controller_parties p SET revision=p.revision+1,playlist=payload->'playlist' WHERE p.id=party.id;
  ELSIF action='abort' THEN
    IF party.status='playing' THEN
      UPDATE public.controller_parties p SET revision=p.revision+1,status='lobby',current_match_id=NULL,current_game_id=NULL,participant_ids='{}' WHERE p.id=party.id;
    END IF;
  ELSIF action='end' THEN
    UPDATE public.controller_parties p SET revision=p.revision+1,status='finished',current_match_id=NULL,current_game_id=NULL,participant_ids='{}' WHERE p.id=party.id;
  END IF;
  RETURN public.controller_party_snapshot(party.id);
END
$$;
REVOKE ALL ON FUNCTION public.controller_party_request(text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.controller_party_request(text,text,jsonb) TO authenticated;
