CREATE TABLE public.tournament_guests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), token_hash text NOT NULL, username text NOT NULL, country text NOT NULL DEFAULT '', coins integer NOT NULL DEFAULT 0 CHECK (coins >= 0), wins integer NOT NULL DEFAULT 0, losses integer NOT NULL DEFAULT 0, active_match uuid, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tournament_guests TO service_role;
ALTER TABLE public.tournament_guests ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tournament_matches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), a uuid NOT NULL REFERENCES public.tournament_guests(id), b uuid REFERENCES public.tournament_guests(id), private boolean NOT NULL DEFAULT false, room_code text UNIQUE, status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','playing','finished','cancelled')), puzzles jsonb NOT NULL, a_state jsonb NOT NULL, b_state jsonb, a_name text NOT NULL, a_country text NOT NULL DEFAULT '', b_name text, b_country text, bot boolean NOT NULL DEFAULT false, bot_seconds integer NOT NULL DEFAULT 90, started_at timestamptz, winner uuid, bot_won boolean NOT NULL DEFAULT false, settled boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tournament_matches TO service_role;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
CREATE INDEX tournament_waiting ON public.tournament_matches(status, private, created_at);
CREATE OR REPLACE FUNCTION public.tournament_action(p_guest uuid, p_hash text, p_action text, p_code text DEFAULT NULL, p_puzzles jsonb DEFAULT NULL, p_state jsonb DEFAULT NULL, p_expected integer DEFAULT NULL, p_delta integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.tournament_guests; m public.tournament_matches; rival public.tournament_guests; current_state jsonb; seconds_elapsed integer; bot_index integer; winning_guest uuid;
BEGIN
 -- One global transaction lock keeps queue pairing, wallet settlement and joins atomic.
 PERFORM pg_advisory_xact_lock(71349025);
 SELECT * INTO g FROM public.tournament_guests WHERE id=p_guest AND token_hash=p_hash FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid guest'; END IF;
 IF p_delta <> 0 THEN
  IF abs(p_delta)>100000 THEN RAISE EXCEPTION 'Invalid coin adjustment'; END IF;
  UPDATE public.tournament_guests SET coins=greatest(0,coins+p_delta) WHERE id=g.id RETURNING * INTO g;
 END IF;
 IF g.active_match IS NOT NULL THEN SELECT * INTO m FROM public.tournament_matches WHERE id=g.active_match FOR UPDATE; END IF;
 IF m.id IS NOT NULL AND m.status='waiting' THEN
  IF m.private AND now()>=m.created_at+interval '30 seconds' THEN
   UPDATE public.tournament_matches SET status='cancelled',settled=true,updated_at=now() WHERE id=m.id RETURNING * INTO m;
   UPDATE public.tournament_guests SET coins=coins+50 WHERE id=m.a;
  ELSIF NOT m.private AND now()>=m.created_at+interval '15 seconds' AND p_action<>'cancel' THEN
   UPDATE public.tournament_matches SET status='playing',bot=true,b_name='Player_Speedy',b_country='US',started_at=now()+interval '3 seconds',b_state=jsonb_build_object('index',0,'moves',0,'totalMoves',0,'elapsed',0,'cars',puzzles->0->'cars'),updated_at=now() WHERE id=m.id RETURNING * INTO m;
  END IF;
 END IF;
 IF m.id IS NOT NULL AND m.status='playing' AND m.bot AND now()>=m.started_at THEN
  seconds_elapsed:=floor(extract(epoch FROM now()-m.started_at));
  bot_index:=least(3,floor(seconds_elapsed::numeric/(m.bot_seconds::numeric/3))::integer);
  UPDATE public.tournament_matches SET b_state=jsonb_build_object('index',bot_index,'moves',floor((seconds_elapsed % greatest(1,m.bot_seconds/3))/2.0),'totalMoves',least(seconds_elapsed/2,m.bot_seconds/2),'elapsed',least(seconds_elapsed,m.bot_seconds)),updated_at=now() WHERE id=m.id RETURNING * INTO m;
  IF seconds_elapsed>=m.bot_seconds THEN
   UPDATE public.tournament_matches SET status='finished',bot_won=true,settled=true,updated_at=now() WHERE id=m.id RETURNING * INTO m;
   UPDATE public.tournament_guests SET losses=losses+1 WHERE id=m.a;
  END IF;
 END IF;
 IF p_action IN ('random','create','join') THEN
  IF m.id IS NOT NULL AND m.status IN ('waiting','playing') THEN RAISE EXCEPTION 'Already in a match'; END IF;
  SELECT * INTO g FROM public.tournament_guests WHERE id=p_guest FOR UPDATE;
  IF g.coins<50 THEN RETURN jsonb_build_object('error','coins'); END IF;
  IF p_action='join' THEN
   SELECT * INTO m FROM public.tournament_matches WHERE room_code=p_code AND private AND status='waiting' AND a<>g.id AND created_at>now()-interval '30 seconds' FOR UPDATE;
   IF NOT FOUND THEN RETURN jsonb_build_object('error','unavailable'); END IF;
  ELSIF p_action='random' THEN
   SELECT * INTO m FROM public.tournament_matches WHERE NOT private AND status='waiting' AND a<>g.id AND created_at>now()-interval '15 seconds' ORDER BY created_at LIMIT 1 FOR UPDATE;
  ELSE m:=NULL;
  END IF;
  UPDATE public.tournament_guests SET coins=coins-50 WHERE id=g.id;
  IF m.id IS NOT NULL AND p_action<>'create' THEN
   UPDATE public.tournament_matches SET b=g.id,b_name=g.username,b_country=g.country,b_state=jsonb_build_object('index',0,'moves',0,'totalMoves',0,'elapsed',0,'cars',puzzles->0->'cars'),status='playing',started_at=now()+interval '3 seconds',updated_at=now() WHERE id=m.id RETURNING * INTO m;
  ELSE
   IF jsonb_array_length(p_puzzles)<>3 THEN RAISE EXCEPTION 'Three puzzles required'; END IF;
   INSERT INTO public.tournament_matches(a,private,room_code,puzzles,a_state,a_name,a_country,bot_seconds) VALUES(g.id,p_action='create',CASE WHEN p_action='create' THEN p_code ELSE NULL END,p_puzzles,jsonb_build_object('index',0,'moves',0,'totalMoves',0,'elapsed',0,'cars',p_puzzles->0->'cars'),g.username,g.country,75+floor(random()*46)::integer) RETURNING * INTO m;
  END IF;
  UPDATE public.tournament_guests SET active_match=m.id WHERE id=g.id;
 ELSIF p_action='cancel' AND m.status='waiting' AND m.a=g.id THEN
  UPDATE public.tournament_matches SET status='cancelled',settled=true,updated_at=now() WHERE id=m.id RETURNING * INTO m;
  UPDATE public.tournament_guests SET coins=coins+50 WHERE id=g.id;
 ELSIF p_action='forfeit' AND m.status='playing' THEN
  winning_guest:=CASE WHEN m.a=g.id THEN m.b ELSE m.a END;
  UPDATE public.tournament_matches SET status='finished',winner=winning_guest,bot_won=(bot AND g.id=a),settled=true,updated_at=now() WHERE id=m.id RETURNING * INTO m;
  UPDATE public.tournament_guests SET losses=losses+1 WHERE id=g.id;
  UPDATE public.tournament_guests SET wins=wins+1,coins=coins+90 WHERE id=winning_guest;
 ELSIF p_action='move' AND m.status='playing' AND now()>=m.started_at THEN
  current_state:=CASE WHEN g.id=m.a THEN m.a_state ELSE m.b_state END;
  IF (current_state->>'totalMoves')::integer=p_expected THEN
   IF g.id=m.a THEN UPDATE public.tournament_matches SET a_state=p_state,updated_at=now() WHERE id=m.id RETURNING * INTO m;
   ELSE UPDATE public.tournament_matches SET b_state=p_state,updated_at=now() WHERE id=m.id RETURNING * INTO m; END IF;
   IF (p_state->>'index')::integer=3 THEN
    UPDATE public.tournament_matches SET status='finished',winner=g.id,settled=true,updated_at=now() WHERE id=m.id RETURNING * INTO m;
    UPDATE public.tournament_guests SET coins=coins+90,wins=wins+1 WHERE id=g.id;
    UPDATE public.tournament_guests SET losses=losses+1 WHERE id=CASE WHEN g.id=m.a THEN m.b ELSE m.a END;
   END IF;
  END IF;
 ELSIF p_action='leave' AND (m.id IS NULL OR m.status IN ('finished','cancelled')) THEN
  UPDATE public.tournament_guests SET active_match=NULL WHERE id=g.id;
  m:=NULL;
 END IF;
 SELECT * INTO g FROM public.tournament_guests WHERE id=p_guest;
 RETURN jsonb_build_object('guest',jsonb_build_object('id',g.id,'coins',g.coins,'wins',g.wins,'losses',g.losses),'match',CASE WHEN m.id IS NULL THEN NULL ELSE to_jsonb(m) END,'serverNow',now());
END $$;
REVOKE ALL ON FUNCTION public.tournament_action(uuid,text,text,text,jsonb,jsonb,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tournament_action(uuid,text,text,text,jsonb,jsonb,integer,integer) TO service_role;