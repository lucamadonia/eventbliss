-- Ohrwurm can now split up to 20 people into 2-4 teams.
-- Controller parties remain capped at 12 members by the party RPC.
UPDATE public.controller_game_limits
SET max_players = 20
WHERE game_id = 'ohrwurm';
