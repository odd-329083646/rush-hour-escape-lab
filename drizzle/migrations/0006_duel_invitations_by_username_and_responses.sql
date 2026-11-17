ALTER TABLE public.duel_invitations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.duel_invitations ADD COLUMN IF NOT EXISTS responded_at timestamptz;
ALTER TABLE public.duel_invitations ADD COLUMN IF NOT EXISTS sender_seen boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.send_duel_invitation_to(p_guest uuid,p_hash text,p_recipient text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE g public.tournament_guests; m public.tournament_matches; recipient_id uuid; hits int;
BEGIN
 SELECT * INTO g FROM public.tournament_guests WHERE id=p_guest AND token_hash=p_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid guest'; END IF;
 SELECT * INTO m FROM public.tournament_matches WHERE id=g.active_match FOR UPDATE;
 IF m.id IS NULL OR m.a<>g.id OR NOT m.private OR m.status<>'waiting' OR now()>=m.created_at+interval '30 seconds' THEN RETURN jsonb_build_object('error','expired'); END IF;
 IF p_recipient ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
   SELECT id INTO recipient_id FROM public.tournament_guests WHERE invitation_code=p_recipient::uuid AND id<>g.id;
 ELSE
   SELECT count(*) INTO hits FROM public.tournament_guests WHERE lower(username)=lower(btrim(p_recipient)) AND id<>g.id;
   IF hits>1 THEN RETURN jsonb_build_object('error','ambiguous'); END IF;
   SELECT id INTO recipient_id FROM public.tournament_guests WHERE lower(username)=lower(btrim(p_recipient)) AND id<>g.id;
 END IF;
 IF recipient_id IS NULL THEN RETURN jsonb_build_object('error','not_found'); END IF;
 IF (SELECT count(*) FROM public.duel_invitations WHERE sender=g.id AND created_at>now()-interval '1 minute')>=5 THEN RETURN jsonb_build_object('error','rate'); END IF;
 INSERT INTO public.duel_invitations(sender,recipient,match_id) VALUES(g.id,recipient_id,m.id) ON CONFLICT(match_id,recipient) DO UPDATE SET dismissed=false,status='pending',created_at=now(),sender_seen=false;
 RETURN jsonb_build_object('sent',true,'topic',recipient_id);
END $function$;
REVOKE ALL ON FUNCTION public.send_duel_invitation_to(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.send_duel_invitation_to(uuid,text,text) TO service_role;