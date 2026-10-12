-- Hochstapler supports one impostor and two other players.
-- Keep the controller-party server limit aligned with the client registry.
UPDATE public.controller_game_limits
SET min_players = 3
WHERE game_id = 'hochstapler';
