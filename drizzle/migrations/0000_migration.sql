CREATE TABLE public.daily_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  solve_time integer NOT NULL CHECK (solve_time > 0 AND solve_time < 86400),
  player_name text NOT NULL DEFAULT 'Player' CHECK (char_length(player_name) BETWEEN 1 AND 40),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX daily_scores_date_time_idx ON public.daily_scores (date, solve_time);
GRANT SELECT, INSERT ON public.daily_scores TO anon, authenticated;
GRANT ALL ON public.daily_scores TO service_role;
ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read daily scores" ON public.daily_scores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can submit a daily score" ON public.daily_scores FOR INSERT TO anon, authenticated
  WITH CHECK (date ~ '^\d{4}-\d{2}-\d{2}$');