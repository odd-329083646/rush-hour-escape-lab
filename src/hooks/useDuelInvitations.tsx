import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { duelInvitations, registerTournamentGuest } from "@/lib/tournament.functions";
import { ensureGuestCredential, subscribeDuelInvitations } from "@/services/supabaseService";
import type { GuestCredential } from "@/engine/tournament";
import type { DuelInbox } from "@/engine/duelInvitations";

const Context = createContext<{ inbox: DuelInbox; send: (code: string) => Promise<boolean>; dismiss: (id: string) => Promise<void> }>({ inbox: { playerCode: "", invitations: [] }, send: async () => false, dismiss: async () => {} });
export function DuelInvitationsProvider({ children }: { children: ReactNode }) {
  const invoke = useServerFn(duelInvitations);
  const register = useServerFn(registerTournamentGuest);
  const [inbox, setInbox] = useState<DuelInbox>({ playerCode: "", invitations: [] });
  const credential = useRef<GuestCredential | null>(null);
  useEffect(() => {
    let alive = true;
    let pending = false;
    let unsubscribe = () => {};
    const refresh = async () => {
      if (!credential.current || pending) return;
      pending = true;
      try {
        const result = await invoke({ data: { credential: credential.current, action: "inbox" } });
        if (alive && result.playerCode && result.invitations) setInbox({ playerCode: result.playerCode, invitations: result.invitations });
      } catch { /* Polling recovers disconnected notifications. */ }
      finally { pending = false; }
    };
    void ensureGuestCredential(register).then(guest => {
      if (!alive) return;
      credential.current = guest;
      unsubscribe = subscribeDuelInvitations(guest.id, () => { void refresh(); });
      void refresh();
    }).catch(() => {});
    const timer = window.setInterval(() => { void refresh(); }, 3000);
    return () => { alive = false; unsubscribe(); window.clearInterval(timer); };
  }, [invoke, register]);
  const send = async (code: string) => {
    if (!credential.current) return false;
    try { const result = await invoke({ data: { credential: credential.current, action: "send", recipientCode: code.trim() } }); return "sent" in result && result.sent; }
    catch { return false; }
  };
  const dismiss = async (id: string) => {
    setInbox(current => ({ ...current, invitations: current.invitations.filter(invitation => invitation.id !== id) }));
    if (!credential.current) return;
    try { await invoke({ data: { credential: credential.current, action: "dismiss", invitationId: id } }); } catch { /* Expires with room. */ }
  };
  return <Context.Provider value={{ inbox, send, dismiss }}>{children}</Context.Provider>;
}
export function useDuelInvitations() { return useContext(Context); }