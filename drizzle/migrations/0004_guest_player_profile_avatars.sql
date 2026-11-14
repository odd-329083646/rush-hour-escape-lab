ALTER TABLE public.tournament_guests ADD COLUMN avatar_id text NOT NULL DEFAULT 'car';
ALTER TABLE public.tournament_guests ADD COLUMN player_records jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.tournament_guests.player_records IS 'Device-reported standard and daily achievement summaries only; never authoritative for coins or tournament rewards';