ALTER TABLE public.tournament_matches ADD COLUMN IF NOT EXISTS close_reason text;
ALTER TABLE public.tournament_guests ADD COLUMN IF NOT EXISTS invitation_code uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS tournament_guest_invitation_code ON public.tournament_guests(invitation_code);
CREATE TABLE public.duel_invitations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender uuid NOT NULL REFERENCES public.tournament_guests(id), recipient uuid NOT NULL REFERENCES public.tournament_guests(id), match_id uuid NOT NULL REFERENCES public.tournament_matches(id), created_at timestamptz NOT NULL DEFAULT now(), dismissed boolean NOT NULL DEFAULT false, UNIQUE(match_id,recipient));
GRANT ALL ON public.duel_invitations TO service_role;
ALTER TABLE public.duel_invitations ENABLE ROW LEVEL SECURITY;
CREATE INDEX duel_invitations_recipient ON public.duel_invitations(recipient,created_at);
DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.tournament_action(uuid,text,text,text,jsonb,jsonb,integer,integer)'::regprocedure) INTO definition;
 definition := replace(definition, 'm.status=''waiting'' AND m.private AND now()>=m.created_at+interval ''30 seconds''', 'm.status=''waiting'' AND now()>=m.created_at+(CASE WHEN m.private THEN interval ''30 seconds'' ELSE interval ''60 seconds'' END)');
 definition := replace(definition, 'SET status=''cancelled'',settled=true,updated_at=now()', 'SET status=''cancelled'',close_reason=CASE WHEN private THEN ''expired'' ELSE ''timeout'' END,settled=true,updated_at=now()');
 definition := replace(definition, 'NOT private AND status=''waiting'' AND a<>g.id ORDER BY', 'NOT private AND status=''waiting'' AND a<>g.id AND created_at>now()-interval ''60 seconds'' ORDER BY');
 definition := replace(definition, 'started_at=now()+interval ''3 seconds''', 'started_at=now()+interval ''6 seconds''');
 definition := replace(definition, 'UPDATE public.tournament_guests SET coins=coins+50 WHERE id=g.id;', 'UPDATE public.tournament_guests SET coins=coins+50,active_match=NULL WHERE id=g.id; m:=NULL;');
 EXECUTE definition;
END $migration$;
CREATE OR REPLACE FUNCTION public.send_duel_invitation(p_guest uuid,p_hash text,p_recipient_code uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE g public.tournament_guests; m public.tournament_matches; recipient_id uuid;
BEGIN
 SELECT * INTO g FROM public.tournament_guests WHERE id=p_guest AND token_hash=p_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid guest'; END IF;
 SELECT * INTO m FROM public.tournament_matches WHERE id=g.active_match FOR UPDATE;
 IF m.id IS NULL OR m.a<>g.id OR NOT m.private OR m.status<>'waiting' OR now()>=m.created_at+interval '30 seconds' THEN RETURN jsonb_build_object('error','unavailable'); END IF;
 SELECT id INTO recipient_id FROM public.tournament_guests WHERE invitation_code=p_recipient_code AND id<>g.id;
 IF recipient_id IS NULL THEN RETURN jsonb_build_object('error','unavailable'); END IF;
 IF (SELECT count(*) FROM public.duel_invitations WHERE sender=g.id AND created_at>now()-interval '1 minute')>=5 THEN RETURN jsonb_build_object('error','unavailable'); END IF;
 INSERT INTO public.duel_invitations(sender,recipient,match_id) VALUES(g.id,recipient_id,m.id) ON CONFLICT(match_id,recipient) DO NOTHING;
 RETURN jsonb_build_object('sent',true,'topic',recipient_id);
END $function$;
REVOKE ALL ON FUNCTION public.send_duel_invitation(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.send_duel_invitation(uuid,text,uuid) TO service_role;