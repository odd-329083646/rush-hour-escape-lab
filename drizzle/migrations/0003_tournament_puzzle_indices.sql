ALTER TABLE public.tournament_matches ADD COLUMN IF NOT EXISTS puzzle_indices integer[];
COMMENT ON COLUMN public.tournament_matches.puzzles IS 'DEPRECATED: replaced by puzzle_indices; legacy matches only';
CREATE OR REPLACE FUNCTION public.tournament_action(p_guest uuid, p_hash text, p_action text, p_code text DEFAULT NULL, p_puzzles jsonb DEFAULT NULL, p_state jsonb DEFAULT NULL, p_expected integer DEFAULT NULL, p_delta integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.tournament_guests; m public.tournament_matches; winning_guest uuid; side_a boolean;
BEGIN
 SELECT * INTO g FROM public.tournament_guests WHERE id=p_guest AND token_hash=p_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid guest'; END IF;
 IF abs(p_delta)>100000 THEN RAISE EXCEPTION 'Invalid coin adjustment'; END IF;
 IF p_delta <> 0 THEN
  UPDATE public.tournament_guests SET coins=greatest(0,coins+p_delta) WHERE id=g.id RETURNING * INTO g;
 END IF;
 IF p_action='move' THEN
  IF g.active_match IS NOT NULL AND p_state IS NOT NULL THEN
   UPDATE public.tournament_matches SET
     a_state=CASE WHEN a=g.id THEN p_state ELSE a_state END,
     b_state=CASE WHEN b=g.id THEN p_state ELSE b_state END,
     status=CASE WHEN (p_state->>'index')::integer>=3 THEN 'finished' ELSE status END,
     winner=CASE WHEN (p_state->>'index')::integer>=3 THEN g.id ELSE winner END,
     settled=settled OR (p_state->>'index')::integer>=3,
     updated_at=now()
   WHERE id=g.active_match AND status='playing' AND now()>=started_at AND (a=g.id OR b=g.id)
     AND ((CASE WHEN a=g.id THEN a_state ELSE b_state END)->>'totalMoves')::integer=p_expected
   RETURNING * INTO m;
   IF m.id IS NOT NULL AND m.status='finished' AND m.winner=g.id THEN
    UPDATE public.tournament_guests SET coins=coins+90,wins=wins+1 WHERE id=g.id RETURNING * INTO g;
    UPDATE public.tournament_guests SET losses=losses+1 WHERE id=CASE WHEN g.id=m.a THEN m.b ELSE m.a END;
   END IF;
   IF m.id IS NULL THEN SELECT * INTO m FROM public.tournament_matches WHERE id=g.active_match; END IF;
  END IF;
  RETURN jsonb_build_object('guest',jsonb_build_object('id',g.id,'coins',g.coins,'wins',g.wins,'losses',g.losses),'match',CASE WHEN m.id IS NULL THEN NULL ELSE to_jsonb(m) END,'serverNow',now());
 END IF;
 IF g.active_match IS NOT NULL THEN SELECT * INTO m FROM public.tournament_matches WHERE id=g.active_match; END IF;
 IF p_action='status' AND NOT (m.id IS NOT NULL AND m.status='waiting' AND m.private AND now()>=m.created_at+interval '30 seconds') THEN
  RETURN jsonb_build_object('guest',jsonb_build_object('id',g.id,'coins',g.coins,'wins',g.wins,'losses',g.losses),'match',CASE WHEN m.id IS NULL THEN NULL ELSE to_jsonb(m) END,'serverNow',now());
 END IF;
 PERFORM pg_advisory_xact_lock(71349025);
 SELECT * INTO g FROM public.tournament_guests WHERE id=p_guest FOR UPDATE;
 m:=NULL;
 IF g.active_match IS NOT NULL THEN SELECT * INTO m FROM public.tournament_matches WHERE id=g.active_match FOR UPDATE; END IF;
 IF m.id IS NOT NULL AND m.status='waiting' AND m.private AND now()>=m.created_at+interval '30 seconds' THEN
  UPDATE public.tournament_matches SET status='cancelled',settled=true,updated_at=now() WHERE id=m.id RETURNING * INTO m;
  UPDATE public.tournament_guests SET coins=coins+50 WHERE id=m.a;
 END IF;
 IF p_action IN ('random','create','join') THEN
  IF m.id IS NOT NULL AND m.status IN ('waiting','playing') THEN RAISE EXCEPTION 'Already in a match'; END IF;
  SELECT * INTO g FROM public.tournament_guests WHERE id=p_guest;
  IF g.coins<50 THEN RETURN jsonb_build_object('error','coins'); END IF;
  m:=NULL;
  IF p_action='join' THEN
   SELECT * INTO m FROM public.tournament_matches WHERE room_code=p_code AND private AND status='waiting' AND a<>g.id AND created_at>now()-interval '30 seconds' FOR UPDATE;
   IF NOT FOUND THEN RETURN jsonb_build_object('error','unavailable'); END IF;
  ELSIF p_action='random' THEN
   SELECT * INTO m FROM public.tournament_matches WHERE NOT private AND status='waiting' AND a<>g.id ORDER BY created_at LIMIT 1 FOR UPDATE;
  END IF;
  UPDATE public.tournament_guests SET coins=coins-50 WHERE id=g.id;
  IF m.id IS NOT NULL AND p_action<>'create' THEN
   UPDATE public.tournament_matches SET b=g.id,b_name=g.username,b_country=g.country,b_state=a_state,status='playing',started_at=now()+interval '3 seconds',updated_at=now() WHERE id=m.id RETURNING * INTO m;
  ELSE
   IF p_puzzles IS NULL OR jsonb_typeof(p_puzzles)<>'array' OR jsonb_array_length(p_puzzles)<>3 OR p_state IS NULL OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_puzzles) v WHERE jsonb_typeof(v)<>'number' OR (v#>>'{}')::numeric<0 OR (v#>>'{}')::numeric<>floor((v#>>'{}')::numeric)) THEN RAISE EXCEPTION 'Three puzzle indices required'; END IF;
   INSERT INTO public.tournament_matches(a,private,room_code,puzzles,puzzle_indices,a_state,a_name,a_country) VALUES(g.id,p_action='create',CASE WHEN p_action='create' THEN p_code ELSE NULL END,'[]'::jsonb,ARRAY(SELECT (v#>>'{}')::integer FROM jsonb_array_elements(p_puzzles) v),p_state,g.username,g.country) RETURNING * INTO m;
  END IF;
  UPDATE public.tournament_guests SET active_match=m.id WHERE id=g.id;
 ELSIF p_action='cancel' AND m.status='waiting' AND m.a=g.id THEN
  UPDATE public.tournament_matches SET status='cancelled',settled=true,updated_at=now() WHERE id=m.id RETURNING * INTO m;
  UPDATE public.tournament_guests SET coins=coins+50 WHERE id=g.id;
 ELSIF p_action='forfeit' AND m.status='playing' AND m.b IS NOT NULL THEN
  winning_guest:=CASE WHEN m.a=g.id THEN m.b ELSE m.a END;
  UPDATE public.tournament_matches SET status='finished',winner=winning_guest,settled=true,updated_at=now() WHERE id=m.id RETURNING * INTO m;
  UPDATE public.tournament_guests SET losses=losses+1 WHERE id=g.id;
  UPDATE public.tournament_guests SET wins=wins+1,coins=coins+90 WHERE id=winning_guest;
 ELSIF p_action='leave' AND (m.id IS NULL OR m.status IN ('finished','cancelled')) THEN
  UPDATE public.tournament_guests SET active_match=NULL WHERE id=g.id;
  m:=NULL;
 END IF;
 SELECT * INTO g FROM public.tournament_guests WHERE id=p_guest;
 RETURN jsonb_build_object('guest',jsonb_build_object('id',g.id,'coins',g.coins,'wins',g.wins,'losses',g.losses),'match',CASE WHEN m.id IS NULL THEN NULL ELSE to_jsonb(m) END,'serverNow',now());
END $$;
REVOKE ALL ON FUNCTION public.tournament_action(uuid,text,text,text,jsonb,jsonb,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tournament_action(uuid,text,text,text,jsonb,jsonb,integer,integer) TO service_role;