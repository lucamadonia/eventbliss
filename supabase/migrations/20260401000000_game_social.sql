-- ============================================================
-- Game Social Features: Stats, Achievements, Leaderboard
-- ============================================================

-- Game stats per user
CREATE TABLE IF NOT EXISTS public.game_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  games_played integer DEFAULT 0,
  games_won integer DEFAULT 0,
  total_score bigint DEFAULT 0,
  best_score integer DEFAULT 0,
  total_time_played integer DEFAULT 0,
  streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  last_played_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Achievements definitions
CREATE TABLE IF NOT EXISTS public.achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  points integer DEFAULT 10,
  rarity text DEFAULT 'common'
);

-- User achievements (unlocked)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text REFERENCES public.achievements(id),
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Leaderboard view
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  gs.user_id,
  p.full_name,
  gs.game_id,
  gs.total_score,
  gs.games_won,
  gs.best_score,
  gs.best_streak,
  RANK() OVER (PARTITION BY gs.game_id ORDER BY gs.total_score DESC) as rank
FROM public.game_stats gs
JOIN public.profiles p ON p.id = gs.user_id;

-- RLS policies
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all game stats" ON public.game_stats FOR SELECT USING (true);
CREATE POLICY "Users can update own stats" ON public.game_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view all achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Seed 50+ achievements
-- ============================================================
INSERT INTO public.achievements (id, name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
-- General achievements
('first-game', 'Erstes Spiel', 'Spiele dein erstes Spiel', '🎮', 'general', 'games_played', 1, 10, 'common'),
('five-games', 'Anfaenger', 'Spiele 5 Spiele', '🎯', 'general', 'games_played', 5, 15, 'common'),
('ten-games', 'Veteran', 'Spiele 10 Spiele', '⭐', 'general', 'games_played', 10, 25, 'common'),
('twenty-five-games', 'Stammspieler', 'Spiele 25 Spiele', '🏅', 'general', 'games_played', 25, 40, 'rare'),
('fifty-games', 'Suechtig', 'Spiele 50 Spiele', '🔥', 'general', 'games_played', 50, 50, 'rare'),
('hundred-games', 'Centurion', 'Spiele 100 Spiele', '💯', 'general', 'games_played', 100, 100, 'epic'),
('first-win', 'Erster Sieg', 'Gewinne dein erstes Spiel', '🏆', 'general', 'games_won', 1, 15, 'common'),
('five-wins', 'Gewinner', 'Gewinne 5 Spiele', '🥇', 'general', 'games_won', 5, 30, 'common'),
('ten-wins', 'Champion', 'Gewinne 10 Spiele', '👑', 'general', 'games_won', 10, 50, 'rare'),
('twenty-five-wins', 'Dominator', 'Gewinne 25 Spiele', '💪', 'general', 'games_won', 25, 75, 'epic'),
('fifty-wins', 'Unbesiegbar', 'Gewinne 50 Spiele', '⚔️', 'general', 'games_won', 50, 100, 'legendary'),
('streak-3', 'Auf einer Welle', '3 Siege in Folge', '🌊', 'general', 'streak', 3, 30, 'rare'),
('streak-5', 'Unaufhaltbar', '5 Siege in Folge', '💫', 'general', 'streak', 5, 75, 'epic'),
('streak-10', 'Goettlich', '10 Siege in Folge', '👼', 'general', 'streak', 10, 150, 'legendary'),
('score-500', 'Punktesammler', 'Erreiche 500 Gesamtpunkte', '📊', 'general', 'score', 500, 20, 'common'),
('score-2000', 'Punktejaeger', 'Erreiche 2000 Gesamtpunkte', '📈', 'general', 'score', 2000, 50, 'rare'),
('score-5000', 'Legende', 'Erreiche 5000 Gesamtpunkte', '✨', 'general', 'score', 5000, 100, 'legendary'),
('party-animal', 'Party-Tier', 'Spiele 20 verschiedene Spiele', '🎉', 'general', 'games_played', 20, 75, 'epic'),
('social-butterfly', 'Schmetterling', 'Spiele mit 10+ Spielern', '🦋', 'general', 'games_played', 1, 30, 'rare'),
('speedster', 'Blitz', 'Gewinne ein Speed-Spiel', '⚡', 'general', 'games_won', 1, 20, 'common'),
-- Bomb game
('bomb-survivor', 'Bomben-Ueberlebender', 'Ueberlebe 5 Bombenrunden', '💣', 'bomb', 'games_played', 5, 20, 'common'),
('bomb-expert', 'Bomben-Experte', 'Spiele 15 Bombenrunden', '🧨', 'bomb', 'games_played', 15, 35, 'rare'),
('bomb-master', 'Bomben-Meister', 'Gewinne 10 Bombenspiele', '🔥', 'bomb', 'games_won', 10, 50, 'rare'),
('bomb-legend', 'Bomben-Legende', 'Gewinne 25 Bombenspiele', '🏆', 'bomb', 'games_won', 25, 100, 'epic'),
('bomb-high-score', 'Bomben-Rekord', 'Erreiche 500 Bombenpunkte', '💥', 'bomb', 'score', 500, 60, 'epic'),
-- Taboo game
('taboo-talker', 'Wortakrobat', 'Spiele 5 Tabu-Runden', '🗣️', 'taboo', 'games_played', 5, 20, 'common'),
('taboo-pro', 'Tabu-Profi', 'Gewinne 10 Tabu-Spiele', '🚫', 'taboo', 'games_won', 10, 50, 'rare'),
('taboo-master', 'Tabu-Meister', 'Gewinne 25 Tabu-Spiele', '🏅', 'taboo', 'games_won', 25, 100, 'epic'),
('taboo-streak', 'Tabu-Serie', '5 Tabu-Siege in Folge', '🔗', 'taboo', 'streak', 5, 75, 'epic'),
('taboo-high-score', 'Tabu-Rekord', 'Erreiche 500 Tabu-Punkte', '📝', 'taboo', 'score', 500, 60, 'epic'),
-- Head-up game
('headup-beginner', 'Stirnraten-Anfaenger', 'Spiele 5 Stirnraten-Runden', '🤔', 'headup', 'games_played', 5, 20, 'common'),
('headup-king', 'Stirnraten-Koenig', 'Errate 50 Begriffe', '👑', 'headup', 'score', 50, 40, 'rare'),
('headup-master', 'Stirnraten-Meister', 'Gewinne 15 Stirnraten-Spiele', '🧠', 'headup', 'games_won', 15, 75, 'epic'),
('headup-legend', 'Stirnraten-Legende', 'Erreiche 200 Stirnraten-Punkte', '🌟', 'headup', 'score', 200, 100, 'legendary'),
-- Quiz games
('quiz-starter', 'Quiz-Anfaenger', 'Spiele 5 Quiz-Runden', '❓', 'splitquiz', 'games_played', 5, 20, 'common'),
('quiz-genius', 'Quiz-Genie', 'Erreiche 1000 Quiz-Punkte', '🧠', 'splitquiz', 'score', 1000, 60, 'epic'),
('quiz-champion', 'Quiz-Champion', 'Gewinne 20 Quiz-Spiele', '🎓', 'splitquiz', 'games_won', 20, 75, 'epic'),
('quiz-legend', 'Quiz-Legende', 'Erreiche 3000 Quiz-Punkte', '🏛️', 'splitquiz', 'score', 3000, 150, 'legendary'),
-- QuickDraw game
('artist', 'Kuenstler', 'Spiele 5 Schnellzeichner-Runden', '🎨', 'quickdraw', 'games_played', 5, 20, 'common'),
('painter', 'Maler', 'Gewinne 10 Schnellzeichner-Spiele', '🖌️', 'quickdraw', 'games_won', 10, 50, 'rare'),
('picasso', 'Picasso', 'Erreiche 500 Schnellzeichner-Punkte', '🖼️', 'quickdraw', 'score', 500, 100, 'epic'),
-- Impostor game
('detective', 'Detektiv', 'Entlarve 10 Hochstapler', '🔍', 'hochstapler', 'games_won', 10, 50, 'rare'),
('sherlock', 'Sherlock', 'Entlarve 25 Hochstapler', '🕵️', 'hochstapler', 'games_won', 25, 100, 'epic'),
('impostor-starter', 'Hochstapler-Anfaenger', 'Spiele 5 Hochstapler-Runden', '🎭', 'hochstapler', 'games_played', 5, 20, 'common'),
-- Wo ist was game
('explorer', 'Weltenbummler', 'Spiele 10 Karten-Runden', '🗺️', 'wo-ist-was', 'games_played', 10, 30, 'rare'),
('navigator', 'Navigator', 'Gewinne 10 Karten-Spiele', '🧭', 'wo-ist-was', 'games_won', 10, 50, 'rare'),
('cartographer', 'Kartograph', 'Erreiche 500 Karten-Punkte', '📍', 'wo-ist-was', 'score', 500, 75, 'epic'),
-- Category game
('category-starter', 'Kategorie-Anfaenger', 'Spiele 5 Kategorie-Runden', '📋', 'category', 'games_played', 5, 20, 'common'),
('category-pro', 'Kategorie-Profi', 'Gewinne 10 Kategorie-Spiele', '🏷️', 'category', 'games_won', 10, 50, 'rare'),
('category-master', 'Kategorie-Meister', 'Erreiche 500 Kategorie-Punkte', '📚', 'category', 'score', 500, 75, 'epic'),
-- Truth or Dare
('truthdare-starter', 'Wahrheit-oder-Pflicht-Fan', 'Spiele 5 WoP-Runden', '🤭', 'truthdare', 'games_played', 5, 20, 'common'),
('truthdare-brave', 'Mutig', 'Spiele 20 WoP-Runden', '💪', 'truthdare', 'games_played', 20, 50, 'rare'),
-- Emoji Guess
('emoji-beginner', 'Emoji-Anfaenger', 'Spiele 5 Emoji-Runden', '😀', 'emojiguess', 'games_played', 5, 20, 'common'),
('emoji-decoder', 'Emoji-Entschluessler', 'Erreiche 200 Emoji-Punkte', '🔓', 'emojiguess', 'score', 200, 50, 'rare');
