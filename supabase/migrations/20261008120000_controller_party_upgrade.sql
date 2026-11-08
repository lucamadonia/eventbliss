-- Enable phone controllers inside an existing one-phone evening. The Host's
-- current TV pairing code stays valid; the join code is a separate room key.
ALTER TABLE public.controller_parties
  ADD COLUMN tv_code text CHECK (tv_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  ADD COLUMN local_started_at timestamptz;

CREATE OR REPLACE FUNCTION public.controller_party_snapshot(party_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT jsonb_build_object(
  'server_now', clock_timestamp(),
  'party', jsonb_build_object('id',p.id,'code',p.code,'tv_code',COALESCE(p.tv_code,p.code),
    'host_user_id',p.host_user_id,'host_player_id',p.host_player_id,'host_plays',p.host_plays,
    'created_at',p.created_at,'local_started_at',p.local_started_at,
    'premium',public.is_premium(p.host_user_id),'status',p.status,'playlist',p.playlist,'revision',p.revision,
    'current_match_id',p.current_match_id,'current_game_id',p.current_game_id,'min_client',p.min_client,
    'participant_ids',to_jsonb(p.participant_ids)),
  'members',COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id',m.user_id,
    'player_id',m.player_id,'name',m.name,'is_host',COALESCE(m.user_id=p.host_user_id,false),
    'avatar',m.avatar,'color',m.color,'controlled_by',m.controlled_by,
    'pending_claim',m.pending_claim_user IS NOT NULL,
    'pending_claim_mine',COALESCE(m.pending_claim_user=auth.uid(),false),'banned',m.banned)
    ORDER BY m.joined_at,m.player_id)
    FROM public.controller_party_members m WHERE m.party_id=p.id AND m.left_at IS NULL AND NOT m.banned),'[]'::jsonb),
  'past_members',COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id',m.user_id,
    'player_id',m.player_id,'name',m.name,'is_host',false,
    'avatar',m.avatar,'color',m.color,'controlled_by',m.controlled_by,
    'pending_claim',false,'pending_claim_mine',false,'banned',m.banned)
    ORDER BY m.joined_at,m.player_id)
    FROM public.controller_party_members m WHERE m.party_id=p.id AND (m.left_at IS NOT NULL OR m.banned)),'[]'::jsonb),
  'results',COALESCE((SELECT jsonb_agg(jsonb_build_object('match_id',r.match_id,
    'game_id',r.game_id,'scores',r.scores,'scored',r.scored,'created_at',r.created_at) ORDER BY r.created_at,r.match_id)
    FROM public.controller_party_results r WHERE r.party_id=p.id),'[]'::jsonb))
 FROM public.controller_parties p WHERE p.id=party_id
$$;
REVOKE ALL ON FUNCTION public.controller_party_snapshot(uuid) FROM PUBLIC, anon, authenticated;

-- One transaction: either profiles, history, playlist and TV code are all
-- carried over, or the new controller party does not exist.
CREATE FUNCTION public.controller_party_upgrade(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
#variable_conflict use_variable
DECLARE
  party_data jsonb;
  new_party uuid;
  host_player text;
  current_tv_code text;
  active_players jsonb;
  archived_players jsonb;
  planned_games jsonb;
  played_games jsonb;
  guest jsonb;
  game jsonb;
  entry jsonb;
  old_id text;
  new_id text;
  id_map jsonb := '{}'::jsonb;
  mapped_scores jsonb;
  score_key text;
  score_value jsonb;
  item_count integer := 0;
  game_id text;
  played_ms numeric;
  started_ms numeric;
  played_at timestamptz;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>262144 THEN
    RAISE EXCEPTION 'Invalid upgrade payload' USING ERRCODE='22023';
  END IF;
  active_players := COALESCE(payload->'players','[]'::jsonb);
  archived_players := COALESCE(payload->'archived_players','[]'::jsonb);
  planned_games := COALESCE(payload->'playlist','[]'::jsonb);
  played_games := COALESCE(payload->'history','[]'::jsonb);
  IF jsonb_typeof(active_players)<>'array' OR jsonb_typeof(archived_players)<>'array'
      OR jsonb_typeof(planned_games)<>'array' OR jsonb_typeof(played_games)<>'array'
      OR jsonb_array_length(active_players)>12 OR jsonb_array_length(archived_players)>50
      OR jsonb_array_length(played_games)>200
      OR jsonb_array_length(planned_games)>jsonb_array_length(played_games)+30 THEN
    RAISE EXCEPTION 'Invalid upgrade lists' USING ERRCODE='22023';
  END IF;
  current_tv_code := upper(payload->>'tv_code');
  IF current_tv_code IS NULL OR current_tv_code !~ '^[A-HJ-NP-Z2-9]{6}$' THEN
    RAISE EXCEPTION 'Invalid TV code' USING ERRCODE='22023';
  END IF;
  FOR game IN SELECT value FROM jsonb_array_elements(planned_games) LOOP
    game_id := game #>> '{}';
    IF jsonb_typeof(game)<>'string' OR NOT EXISTS
      (SELECT 1 FROM public.controller_game_limits g WHERE g.game_id=game_id) THEN
      RAISE EXCEPTION 'Unknown game in playlist' USING ERRCODE='22023';
    END IF;
  END LOOP;
  host_player := payload->>'player_id';
  -- The existing create RPC retains its account, rate-limit and identity checks.
  party_data := public.controller_party_request('create',NULL,jsonb_build_object(
    'player_id',host_player,'name',payload->>'name','host_plays',false));
  new_party := (party_data->'party'->>'id')::uuid;

  FOR guest IN SELECT value FROM jsonb_array_elements(active_players || archived_players) LOOP
    item_count := item_count+1;
    old_id := guest->>'id';
    IF jsonb_typeof(guest)<>'object' OR old_id IS NULL OR length(old_id) NOT BETWEEN 1 AND 128
        OR id_map ? old_id THEN
      RAISE EXCEPTION 'Invalid player in upgrade' USING ERRCODE='22023';
    END IF;
    new_id := 'player-' || replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
    INSERT INTO public.controller_party_members
      (party_id,user_id,player_id,name,avatar,color,controlled_by,left_at,joined_at)
    VALUES (new_party,NULL,new_id,public.controller_party_name(guest->>'name'),
      public.controller_party_pick(public.controller_party_avatars(),guest->>'avatar','{}','invalid_avatar'),
      public.controller_party_pick(public.controller_party_colors(),lower(guest->>'color'),'{}','invalid_color'),
      host_player,CASE WHEN item_count>jsonb_array_length(active_players) THEN now() ELSE NULL END,
      now()+item_count*interval '1 millisecond');
    id_map := id_map || jsonb_build_object(old_id,new_id);
  END LOOP;

  FOR entry IN SELECT value FROM jsonb_array_elements(played_games) LOOP
    IF jsonb_typeof(entry)<>'object' OR jsonb_typeof(entry->'scores')<>'object'
        OR jsonb_typeof(entry->'scored')<>'boolean' THEN
      RAISE EXCEPTION 'Invalid game history' USING ERRCODE='22023';
    END IF;
    game_id := entry->>'game_id';
    IF NOT EXISTS (SELECT 1 FROM public.controller_game_limits g WHERE g.game_id=game_id) THEN
      RAISE EXCEPTION 'Unknown game in history' USING ERRCODE='22023';
    END IF;
    mapped_scores := '{}'::jsonb;
    FOR score_key,score_value IN SELECT key,value FROM jsonb_each(entry->'scores') LOOP
      IF NOT id_map ? score_key OR jsonb_typeof(score_value)<>'number'
          OR abs((score_value::text)::numeric)>1000000000 THEN
        RAISE EXCEPTION 'Invalid score in history' USING ERRCODE='22023';
      END IF;
      mapped_scores := mapped_scores || jsonb_build_object(id_map->>score_key,score_value);
    END LOOP;
    played_ms := CASE WHEN jsonb_typeof(entry->'played_at')='number'
      THEN (entry->>'played_at')::numeric ELSE NULL END;
    played_at := CASE WHEN played_ms BETWEEN 946684800000 AND extract(epoch FROM clock_timestamp())*1000+86400000
      THEN to_timestamp(played_ms/1000) ELSE clock_timestamp() END;
    INSERT INTO public.controller_party_results(party_id,match_id,game_id,scores,scored,created_at)
    VALUES(new_party,gen_random_uuid(),game_id,mapped_scores,(entry->>'scored')::boolean,
      played_at + (SELECT count(*) FROM public.controller_party_results r WHERE r.party_id=new_party)*interval '1 millisecond');
  END LOOP;
  started_ms := CASE WHEN jsonb_typeof(payload->'local_started_at')='number'
    THEN (payload->>'local_started_at')::numeric ELSE NULL END;
  UPDATE public.controller_parties p SET tv_code=current_tv_code, playlist=planned_games,
    local_started_at=CASE WHEN started_ms BETWEEN 946684800000 AND extract(epoch FROM clock_timestamp())*1000+86400000
      THEN to_timestamp(started_ms/1000) ELSE NULL END,
    min_client=greatest(p.min_client,2),revision=p.revision+1
    WHERE p.id=new_party;
  RETURN public.controller_party_snapshot(new_party);
END
$$;
REVOKE ALL ON FUNCTION public.controller_party_upgrade(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.controller_party_upgrade(jsonb) TO authenticated, service_role;
