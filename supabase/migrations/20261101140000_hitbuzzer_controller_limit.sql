-- Keep the server-side Party Play allowlist aligned with the client game registry.
INSERT INTO public.controller_game_limits (game_id, min_players, max_players, premium)
VALUES ('hitbuzzer', 2, 20, false)
ON CONFLICT (game_id) DO UPDATE SET
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  premium = EXCLUDED.premium;
