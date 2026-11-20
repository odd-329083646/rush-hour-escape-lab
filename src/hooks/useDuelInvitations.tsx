import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { duelInvitations, registerTournamentGuest } from "@/lib/tournament.functions";
import { ensureGuestCredential, subscribeDuelInvitations } from "@/services/supabaseService";
import type { GuestCredential } from "@/engine/tournament";
import { toast } from "sonner";
import { getLang, translate } from "@/lib/i18n";
import type { DuelInbox, DuelSendResult } from "@/engine/duelInvitations";

const Context = createContext<{
  inbox: DuelInbox;
  send: (code: string) => Promise<DuelSendResult>;
  dismiss: (id: string) => Promise<void>;
  accept: (id: string) => Promise<void>;
}>({
  inbox: { playerCode: "", invitations: [] },
  send: async () => ({ sent: false }),
  dismiss: async () => {},
  accept: async () => {},
});
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
        if (alive && result.playerCode && result.invitations)
          setInbox({ playerCode: result.playerCode, invitations: result.invitations });
        if (alive && "responses" in result)
          for (const r of result.responses ?? []) {
            if (r.status === "accepted")
              toast.success(translate(getLang(), "raceInviteAccepted", { name: r.name }));
            else toast.error(translate(getLang(), "raceInviteDeclined", { name: r.name }));
          }
      } catch {
        /* Polling recovers disconnected notifications. */
      } finally {
        pending = false;
      }
    };
    void ensureGuestCredential(register)
      .then((guest) => {
        if (!alive) return;
        credential.current = guest;
        unsubscribe = subscribeDuelInvitations(guest.id, () => {
          void refresh();
        });
        void refresh();
      })
      .catch(() => {});
    const timer = window.setInterval(() => {
      void refresh();
    }, 3000);
    return () => {
      alive = false;
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [invoke, register]);
  const send = async (code: string) => {
    if (!credential.current) return { sent: false };
    try {
      const result = await invoke({
        data: { credential: credential.current, action: "send", recipientCode: code.trim() },
      });
      return "sent" in result
        ? { sent: Boolean(result.sent), error: result.error }
        : { sent: false };
    } catch {
      return { sent: false };
    }
  };
  const respond = async (id: string, action: "dismiss" | "accept") => {
    setInbox((current) => ({
      ...current,
      invitations: current.invitations.filter((invitation) => invitation.id !== id),
    }));
    if (!credential.current) return;
    try {
      await invoke({ data: { credential: credential.current, action, invitationId: id } });
    } catch {
      /* Expires with room. */
    }
  };
  const dismiss = (id: string) => respond(id, "dismiss");
  const accept = (id: string) => respond(id, "accept");
  return <Context.Provider value={{ inbox, send, dismiss, accept }}>{children}</Context.Provider>;
}
export function useDuelInvitations() {
  return useContext(Context);
}
