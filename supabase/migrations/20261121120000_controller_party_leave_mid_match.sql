-- A guest must always be able to leave a party, also in the middle of a match.
-- Until now `leave` was refused for a participant of the running match
-- ("Wait for the host to finish or abort the current match"). The phone then
-- stayed locked in the party until the host finished, aborted or the party
-- expired 24 h later. Leaving now drops the seat from the match exactly like a
-- 'match_only' kick does; the match goes on without it.
-- Only the `leave` branch changes; the rest is the function from 20261001120000.

CREATE OR REPLACE FUNCTION public.controller_party_request(action text, code text DEFAULT NULL, payload jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
#variable_conflict use_variable
DECLARE
  caller uuid := auth.uid();
  party public.controller_parties%ROWTYPE;
  member public.controller_party_members%ROWTYPE;
  target public.controller_party_members%ROWTYPE;
  limits public.controller_game_limits%ROWTYPE;
  has_member boolean := false;
  is_active boolean := false;
  requested_player text;
  requested_name text;
  requested_avatar text;
  requested_color text;
  requested_game text;
  kick_mode text;
  claim_player text;
  used_avatars text[];
  used_colors text[];
  match_id uuid;
  participants text[];
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
  IF action IS NULL OR action NOT IN ('create','join','read','start','finish','playlist','end','leave','abort',
      'add_guest','remove_guest','claim','release','profile','kick','unban') THEN
    RAISE EXCEPTION 'Unknown party action' USING ERRCODE='22023';
  END IF;
  IF payload IS NULL OR jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>32768 THEN
    RAISE EXCEPTION 'Invalid party payload' USING ERRCODE='22023';
  END IF;
  requested_avatar := payload->>'avatar';
  requested_color := lower(payload->>'color');
  IF requested_avatar IS NOT NULL AND NOT (requested_avatar = ANY(public.controller_party_avatars())) THEN
    RAISE EXCEPTION 'invalid_avatar' USING ERRCODE='22023';
  END IF;
  IF requested_color IS NOT NULL AND NOT (requested_color = ANY(public.controller_party_colors())) THEN
    RAISE EXCEPTION 'invalid_color' USING ERRCODE='22023';
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
    INSERT INTO public.controller_party_members(party_id,user_id,player_id,name,avatar,color)
    VALUES(party.id,caller,requested_player,requested_name,
      public.controller_party_pick(public.controller_party_avatars(),requested_avatar,'{}','invalid_avatar'),
      public.controller_party_pick(public.controller_party_colors(),requested_color,'{}','invalid_color'));
    RETURN public.controller_party_snapshot(party.id);
  END IF;

  IF code IS NULL OR upper(btrim(code)) !~ '^[A-HJ-NP-Z2-9]{6}$' THEN
    RAISE EXCEPTION 'Party unavailable' USING ERRCODE='22023';
  END IF;
  -- The party row lock serializes every mutation of one party, including concurrent claims.
  SELECT p.* INTO party FROM public.controller_parties p WHERE p.code=upper(btrim(code)) FOR UPDATE;
  IF NOT FOUND OR party.expires_at<=now() THEN
    RAISE EXCEPTION 'Party unavailable or expired' USING ERRCODE='22023';
  END IF;
  -- An account may own one active seat plus archived seats; prefer the active one.
  SELECT m.* INTO member FROM public.controller_party_members m WHERE m.party_id=party.id AND m.user_id=caller
    ORDER BY (m.left_at IS NULL) DESC, m.joined_at DESC, m.player_id LIMIT 1;
  has_member := FOUND;
  is_active := has_member AND member.left_at IS NULL;
  SELECT array_agg(m.avatar),array_agg(m.color) INTO used_avatars,used_colors
    FROM public.controller_party_members m WHERE m.party_id=party.id AND m.left_at IS NULL;

  IF action='join' THEN
    IF EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id AND m.user_id=caller AND m.banned) THEN
      RAISE EXCEPTION 'banned' USING ERRCODE='42501';
    END IF;
    IF party.status='finished' THEN
      IF is_active AND member.player_id=requested_player THEN
        RETURN public.controller_party_snapshot(party.id);
      END IF;
      RAISE EXCEPTION 'Party has ended' USING ERRCODE='22023';
    END IF;
    IF NOT is_active THEN
      IF (SELECT count(*) FROM public.controller_party_members m WHERE m.party_id=party.id
          AND m.left_at IS NULL AND (party.host_plays OR m.user_id IS DISTINCT FROM party.host_user_id))>=12 THEN
        -- A full party with a free guest seat still lets the phone pick it ("Wer bist du?");
        -- the caller then claims with controller_id instead of an interim seat.
        IF EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id
            AND m.left_at IS NULL AND m.user_id IS NULL AND m.pending_claim_user IS NULL) THEN
          RETURN public.controller_party_snapshot(party.id) || jsonb_build_object('seated',false);
        END IF;
        RAISE EXCEPTION 'Party is full' USING ERRCODE='22023';
      END IF;
    END IF;
    IF NOT has_member THEN
      IF EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id AND m.player_id=requested_player)
        OR EXISTS (SELECT 1 FROM public.controller_party_results r WHERE r.party_id=party.id AND r.scores ? requested_player) THEN
        RAISE EXCEPTION 'Controller already belongs to another account' USING ERRCODE='42501';
      END IF;
      INSERT INTO public.controller_party_members(party_id,user_id,player_id,name,avatar,color)
      VALUES(party.id,caller,requested_player,requested_name,
        public.controller_party_pick(public.controller_party_avatars(),requested_avatar,used_avatars,'invalid_avatar'),
        public.controller_party_pick(public.controller_party_colors(),requested_color,used_colors,'invalid_color'));
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
      UPDATE public.controller_party_members m SET player_id=requested_player,name=requested_name,left_at=NULL,
        avatar=COALESCE(requested_avatar,m.avatar),color=COALESCE(requested_color,m.color)
      WHERE m.party_id=party.id AND m.player_id=member.player_id;
      IF caller=party.host_user_id AND member.player_id<>requested_player THEN
        UPDATE public.controller_parties p SET host_player_id=requested_player WHERE p.id=party.id;
        -- Guests follow the host's new controller.
        UPDATE public.controller_party_members m SET controlled_by=requested_player
          WHERE m.party_id=party.id AND m.controlled_by=member.player_id;
      END IF;
    END IF;
    UPDATE public.controller_party_members m SET released_from_user=NULL WHERE m.party_id=party.id AND m.released_from_user=caller;
    UPDATE public.controller_parties p SET revision=p.revision+1 WHERE p.id=party.id;
    RETURN public.controller_party_snapshot(party.id);
  END IF;

  IF action='claim' THEN
    IF party.status='finished' THEN RAISE EXCEPTION 'Party has ended' USING ERRCODE='22023'; END IF;
    IF EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id AND m.user_id=caller AND m.banned) THEN
      RAISE EXCEPTION 'banned' USING ERRCODE='42501';
    END IF;
    SELECT m.* INTO target FROM public.controller_party_members m
      WHERE m.party_id=party.id AND m.player_id=payload->>'player_id' AND m.left_at IS NULL FOR UPDATE;
    IF NOT FOUND AND EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id
        AND m.left_at IS NULL AND (payload->>'player_id')=ANY(m.previous_player_ids)) THEN
      -- The seat moved to another controller meanwhile (lost a concurrent claim).
      RAISE EXCEPTION 'seat_taken' USING ERRCODE='55000';
    END IF;
    IF NOT FOUND OR target.user_id=party.host_user_id THEN RAISE EXCEPTION 'not_guest' USING ERRCODE='22023'; END IF;
    IF target.user_id=caller OR target.pending_claim_user=caller THEN
      RETURN public.controller_party_snapshot(party.id);
    END IF;
    IF target.user_id IS NOT NULL OR target.pending_claim_user IS NOT NULL THEN
      RAISE EXCEPTION 'seat_taken' USING ERRCODE='55000';
    END IF;
    -- A fresh seat from joining (no results, not playing, not the host) is swapped for the
    -- guest seat; any seat with history keeps the caller from taking a second one.
    IF EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id
        AND m.pending_claim_user=caller AND m.left_at IS NULL)
      OR (is_active AND (caller=party.host_user_id
        OR member.player_id=ANY(party.participant_ids)
        OR EXISTS (SELECT 1 FROM public.controller_party_results r WHERE r.party_id=party.id AND r.scores ? member.player_id))) THEN
      RAISE EXCEPTION 'already_seated' USING ERRCODE='55000';
    END IF;
    IF payload ? 'name' THEN requested_name := public.controller_party_name(payload->>'name'); END IF;
    -- Phone seats are keyed by the account's controller identity: the interim seat's id,
    -- else the optional controller_id. Without either the guest id is kept.
    IF is_active THEN
      claim_player := member.player_id;
    ELSIF payload->>'controller_id' IS NOT NULL THEN
      claim_player := payload->>'controller_id';
      IF claim_player !~ '^player-[0-9a-f]{64}$' THEN RAISE EXCEPTION 'invalid_controller' USING ERRCODE='22023'; END IF;
      IF claim_player<>target.player_id AND (
          EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id AND m.player_id=claim_player)
          OR EXISTS (SELECT 1 FROM public.controller_party_results r WHERE r.party_id=party.id AND r.scores ? claim_player)
          OR EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id
            AND m.pending_claim_player=claim_player AND m.left_at IS NULL)) THEN
        RAISE EXCEPTION 'controller_taken' USING ERRCODE='42501';
      END IF;
    END IF;
    IF party.status='playing' AND target.player_id=ANY(party.participant_ids) THEN
      -- The guest keeps playing at the host's phone; the seat moves after the match.
      UPDATE public.controller_party_members m SET pending_claim_user=caller,
        pending_claim_player=CASE WHEN is_active THEN NULL ELSE claim_player END
        WHERE m.party_id=party.id AND m.player_id=target.player_id;
    ELSE
      IF is_active THEN
        DELETE FROM public.controller_party_members m WHERE m.party_id=party.id AND m.player_id=member.player_id;
      END IF;
      UPDATE public.controller_party_members m SET user_id=caller,controlled_by=NULL,released_from_user=NULL,
        name=COALESCE(requested_name,m.name),avatar=COALESCE(requested_avatar,m.avatar),color=COALESCE(requested_color,m.color)
        WHERE m.party_id=party.id AND m.player_id=target.player_id;
      IF claim_player IS NOT NULL THEN
        PERFORM public.controller_party_rekey(party.id,target.player_id,claim_player);
      END IF;
    END IF;
    UPDATE public.controller_party_members m SET released_from_user=NULL WHERE m.party_id=party.id AND m.released_from_user=caller;
    UPDATE public.controller_parties p SET revision=p.revision+1 WHERE p.id=party.id;
    RETURN public.controller_party_snapshot(party.id);
  END IF;

  IF NOT is_active AND NOT EXISTS (SELECT 1 FROM public.controller_party_members m
      WHERE m.party_id=party.id AND m.pending_claim_user=caller AND m.left_at IS NULL) THEN
    -- A recalled phone learns it now plays at the host's phone (not removed from the party).
    IF EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id
        AND m.released_from_user=caller AND m.left_at IS NULL) THEN
      RAISE EXCEPTION 'recalled' USING ERRCODE='42501';
    END IF;
    RAISE EXCEPTION 'Party membership required' USING ERRCODE='42501';
  END IF;
  IF action='read' THEN RETURN public.controller_party_snapshot(party.id); END IF;
  IF action='leave' THEN
    IF is_active THEN
      IF caller=party.host_user_id THEN
        RAISE EXCEPTION 'The host must end the party' USING ERRCODE='22023';
      END IF;
      -- Leaving is always possible: the running match continues without this seat (like a match_only kick).
      IF party.status='playing' AND member.player_id=ANY(party.participant_ids) THEN
        UPDATE public.controller_parties p SET participant_ids=array_remove(p.participant_ids,member.player_id),
          dropped_participant_ids=array_append(p.dropped_participant_ids,member.player_id) WHERE p.id=party.id;
      END IF;
      UPDATE public.controller_party_members m SET left_at=now() WHERE m.party_id=party.id AND m.player_id=member.player_id;
    END IF;
    UPDATE public.controller_party_members m SET pending_claim_user=NULL,pending_claim_player=NULL WHERE m.party_id=party.id AND m.pending_claim_user=caller;
    UPDATE public.controller_parties p SET revision=p.revision+1 WHERE p.id=party.id;
    RETURN public.controller_party_snapshot(party.id);
  END IF;
  IF action IN ('release','profile') THEN
    SELECT m.* INTO target FROM public.controller_party_members m
      WHERE m.party_id=party.id AND m.player_id=payload->>'player_id' AND m.left_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'not_member' USING ERRCODE='22023'; END IF;
  END IF;
  IF action='release' THEN
    IF target.user_id=party.host_user_id THEN RAISE EXCEPTION 'cannot_release_host' USING ERRCODE='22023'; END IF;
    IF target.user_id IS NULL THEN
      -- A guest seat can only lose its pending claim (claimer or host withdraws it).
      IF target.pending_claim_user IS NULL THEN RAISE EXCEPTION 'not_claimed' USING ERRCODE='22023'; END IF;
      IF caller<>target.pending_claim_user AND caller<>party.host_user_id THEN
        RAISE EXCEPTION 'not_allowed' USING ERRCODE='42501';
      END IF;
      UPDATE public.controller_party_members m SET pending_claim_user=NULL,pending_claim_player=NULL WHERE m.party_id=party.id AND m.player_id=target.player_id;
    ELSE
      IF caller<>target.user_id AND caller<>party.host_user_id THEN RAISE EXCEPTION 'not_allowed' USING ERRCODE='42501'; END IF;
      IF party.status='playing' AND target.player_id=ANY(party.participant_ids) THEN
        RAISE EXCEPTION 'locked_in_game' USING ERRCODE='55000';
      END IF;
      UPDATE public.controller_party_members m SET user_id=NULL,controlled_by=party.host_player_id,
        released_from_user=CASE WHEN caller<>target.user_id THEN target.user_id END
        WHERE m.party_id=party.id AND m.player_id=target.player_id;
      -- The guest seat gets a fresh server id so the account can rejoin with its own identity.
      PERFORM public.controller_party_rekey(party.id,target.player_id,
        'player-'||replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''));
    END IF;
    UPDATE public.controller_parties p SET revision=p.revision+1 WHERE p.id=party.id;
    RETURN public.controller_party_snapshot(party.id);
  END IF;
  IF action='profile' THEN
    IF NOT (target.user_id IS NOT DISTINCT FROM caller OR (target.user_id IS NULL AND caller=party.host_user_id)) THEN
      RAISE EXCEPTION 'not_allowed' USING ERRCODE='42501';
    END IF;
    IF party.status='playing' THEN RAISE EXCEPTION 'locked_in_game' USING ERRCODE='55000'; END IF;
    IF payload ? 'name' THEN requested_name := public.controller_party_name(payload->>'name'); END IF;
    UPDATE public.controller_party_members m SET name=COALESCE(requested_name,m.name),
      avatar=COALESCE(requested_avatar,m.avatar),color=COALESCE(requested_color,m.color)
      WHERE m.party_id=party.id AND m.player_id=target.player_id;
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
    -- Players removed during the match do not count, even if the host device still reports them.
    scores := COALESCE((SELECT jsonb_object_agg(s.key,s.value) FROM jsonb_each(scores) s
      WHERE NOT (s.key=ANY(party.dropped_participant_ids))),'{}'::jsonb);
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
    -- account participants receive a played game; moderator and guests never do.
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
    WHERE m.party_id=party.id AND m.user_id IS NOT NULL AND m.player_id=ANY(party.participant_ids)
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
    UPDATE public.controller_parties p SET revision=p.revision+1,status='lobby',current_match_id=NULL,current_game_id=NULL,
      participant_ids='{}',dropped_participant_ids='{}' WHERE p.id=party.id;
    PERFORM public.controller_party_apply_claims(party.id);
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
    -- Every account seat plays; guests at the host's phone may sit a game out.
    IF participants IS NULL
      OR cardinality(participants)<>(SELECT count(DISTINCT v) FROM unnest(participants) v)
      OR EXISTS (SELECT 1 FROM unnest(participants) v WHERE NOT EXISTS (
        SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id AND m.left_at IS NULL
          AND m.player_id=v AND (party.host_plays OR m.user_id IS DISTINCT FROM party.host_user_id)))
      OR EXISTS (SELECT 1 FROM public.controller_party_members m WHERE m.party_id=party.id AND m.left_at IS NULL
          AND m.user_id IS NOT NULL AND (party.host_plays OR m.user_id<>party.host_user_id)
          AND NOT (m.player_id=ANY(participants)))
      OR cardinality(participants)<greatest(2,limits.min_players)
      OR cardinality(participants)>least(12,limits.max_players) THEN
      RAISE EXCEPTION 'Choose a game compatible with all party players' USING ERRCODE='22023';
    END IF;
    UPDATE public.controller_parties p SET revision=p.revision+1,status='playing',current_match_id=gen_random_uuid(),
      current_game_id=requested_game,participant_ids=participants,dropped_participant_ids='{}' WHERE p.id=party.id;
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
      UPDATE public.controller_parties p SET revision=p.revision+1,status='lobby',current_match_id=NULL,current_game_id=NULL,
        participant_ids='{}',dropped_participant_ids='{}' WHERE p.id=party.id;
      PERFORM public.controller_party_apply_claims(party.id);
    END IF;
  ELSIF action='end' THEN
    UPDATE public.controller_parties p SET revision=p.revision+1,status='finished',current_match_id=NULL,current_game_id=NULL,
      participant_ids='{}',dropped_participant_ids='{}' WHERE p.id=party.id;
    PERFORM public.controller_party_apply_claims(party.id);
  ELSIF action='add_guest' THEN
    IF party.status='finished' THEN RAISE EXCEPTION 'Party has ended' USING ERRCODE='22023'; END IF;
    requested_name := public.controller_party_name(payload->>'name');
    IF (SELECT count(*) FROM public.controller_party_members m WHERE m.party_id=party.id
        AND m.left_at IS NULL AND (party.host_plays OR m.user_id IS DISTINCT FROM party.host_user_id))>=12 THEN
      RAISE EXCEPTION 'party_full' USING ERRCODE='54000';
    END IF;
    -- Guests join the next match; a running match keeps its frozen participants.
    INSERT INTO public.controller_party_members(party_id,user_id,controlled_by,player_id,name,avatar,color)
    VALUES(party.id,NULL,party.host_player_id,
      'player-'||replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),requested_name,
      public.controller_party_pick(public.controller_party_avatars(),requested_avatar,used_avatars,'invalid_avatar'),
      public.controller_party_pick(public.controller_party_colors(),requested_color,used_colors,'invalid_color'));
    UPDATE public.controller_parties p SET revision=p.revision+1,min_client=greatest(p.min_client,2) WHERE p.id=party.id;
  ELSIF action='remove_guest' THEN
    SELECT m.* INTO target FROM public.controller_party_members m
      WHERE m.party_id=party.id AND m.player_id=payload->>'player_id' AND m.left_at IS NULL FOR UPDATE;
    IF NOT FOUND OR target.user_id IS NOT NULL THEN RAISE EXCEPTION 'not_guest' USING ERRCODE='22023'; END IF;
    IF party.status='playing' AND target.player_id=ANY(party.participant_ids) THEN
      UPDATE public.controller_parties p SET participant_ids=array_remove(p.participant_ids,target.player_id),
        dropped_participant_ids=array_append(p.dropped_participant_ids,target.player_id) WHERE p.id=party.id;
    END IF;
    IF EXISTS (SELECT 1 FROM public.controller_party_results r WHERE r.party_id=party.id AND r.scores ? target.player_id) THEN
      UPDATE public.controller_party_members m SET left_at=now(),pending_claim_user=NULL,pending_claim_player=NULL
        WHERE m.party_id=party.id AND m.player_id=target.player_id;
    ELSE
      DELETE FROM public.controller_party_members m WHERE m.party_id=party.id AND m.player_id=target.player_id;
    END IF;
    UPDATE public.controller_parties p SET revision=p.revision+1 WHERE p.id=party.id;
  ELSIF action='kick' THEN
    kick_mode := payload->>'mode';
    IF kick_mode IS NULL OR kick_mode NOT IN ('match_only','party','ban') THEN
      RAISE EXCEPTION 'invalid_mode' USING ERRCODE='22023';
    END IF;
    SELECT m.* INTO target FROM public.controller_party_members m
      WHERE m.party_id=party.id AND m.player_id=payload->>'player_id' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'not_member' USING ERRCODE='22023'; END IF;
    IF target.player_id=party.host_player_id OR target.user_id=party.host_user_id THEN
      RAISE EXCEPTION 'cannot_kick_host' USING ERRCODE='42501';
    END IF;
    IF kick_mode='match_only' AND party.status<>'playing' THEN
      RAISE EXCEPTION 'not_playing' USING ERRCODE='55000';
    END IF;
    IF party.status='playing' AND target.player_id=ANY(party.participant_ids) THEN
      UPDATE public.controller_parties p SET participant_ids=array_remove(p.participant_ids,target.player_id),
        dropped_participant_ids=array_append(p.dropped_participant_ids,target.player_id) WHERE p.id=party.id;
    END IF;
    IF kick_mode IN ('party','ban') THEN
      UPDATE public.controller_party_members m SET left_at=COALESCE(m.left_at,now()),pending_claim_user=NULL,pending_claim_player=NULL,
        banned=(m.banned OR kick_mode='ban')
        WHERE m.party_id=party.id AND m.player_id=target.player_id;
    END IF;
    UPDATE public.controller_parties p SET revision=p.revision+1 WHERE p.id=party.id;
  ELSIF action='unban' THEN
    SELECT m.* INTO target FROM public.controller_party_members m
      WHERE m.party_id=party.id AND m.player_id=payload->>'player_id' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'not_member' USING ERRCODE='22023'; END IF;
    -- Unbanned accounts may join again; the seat itself stays archived until they do.
    UPDATE public.controller_party_members m SET banned=false
      WHERE m.party_id=party.id AND (m.player_id=target.player_id OR (target.user_id IS NOT NULL AND m.user_id=target.user_id));
    UPDATE public.controller_parties p SET revision=p.revision+1 WHERE p.id=party.id;
  END IF;
  RETURN public.controller_party_snapshot(party.id);
END
$$;
