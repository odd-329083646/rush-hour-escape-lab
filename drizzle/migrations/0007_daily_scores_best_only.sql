DROP POLICY IF EXISTS "Anyone can read daily scores" ON public.daily_scores;
REVOKE SELECT ON public.daily_scores FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.daily_best_time(p_date text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT min(solve_time) FROM public.daily_scores WHERE date = p_date;
$$;

REVOKE ALL ON FUNCTION public.daily_best_time(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.daily_best_time(text) TO anon, authenticated;