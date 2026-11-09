import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { registerTournamentGuest, tournamentAction } from "@/lib/tournament.functions";
import { applyTournamentSnapshot, getGuestCredential, saveGuestCredential, walletDelta } from "@/lib/tournament-device";
import { getProfile } from "@/lib/profile";
import { getCoins, type Move } from "@/lib/puzzles";
import { useI18n } from "@/lib/i18n";
import type { GuestCredential, RaceSnapshot } from "@/lib/tournament";

type Action = "status" | "random" | "create" | "join" | "cancel" | "move" | "forfeit" | "leave";
export function useTournament() {
  const register = useServerFn(registerTournamentGuest);
  const invoke = useServerFn(tournamentAction);
  const { t, te } = useI18n();
  const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const credential = useRef<GuestCredential | null>(null);
  const locked = useRef(false);
  const alive = useRef(true);
  const initialization = useRef<Promise<GuestCredential> | null>(null);
  const action = useCallback(async (kind: Action, options?: { code?: string; move?: { id: string; direction: Move; steps: number } }) => {
    if (!credential.current) return;
    if (locked.current) {
      if (kind === "status") return;
      while (locked.current && alive.current) await new Promise((resolve) => window.setTimeout(resolve, 25));
      if (!alive.current) return;
    }
    locked.current = true;
    if (kind !== "status") setBusy(true);
    const balance = getCoins();
    try {
      const profile = getProfile();
      const result = await invoke({ data: { credential: credential.current, action: kind, delta: walletDelta(), username: profile.username, country: profile.country, ...options } });
      if ("guest" in result && result.guest) {
        const data = result as RaceSnapshot;
        applyTournamentSnapshot(data, balance);
        if (alive.current) {
          setClockOffset(Date.parse(data.serverNow) - Date.now());
          setSnapshot(data);
        }
        if (data.error) toast.error(data.error === "coins" ? t("raceNeedCoins") : t("raceUnavailable"));
      } else if (result.error) {
        toast.error(result.error === "coins" ? t("raceNeedCoins") : result.error === "unavailable" ? t("raceUnavailable") : te(result.error));
      }
    } catch {
      if (kind !== "status") toast.error(t("raceConnectionError"));
    } finally {
      locked.current = false;
      if (alive.current) { setBusy(false); setReady(true); }
    }
  }, [invoke, t, te]);
  const actionRef = useRef(action);
  actionRef.current = action;
  useEffect(() => {
    alive.current = true;
    if (!initialization.current) initialization.current = (async () => {
      const existing = getGuestCredential();
      if (existing) return existing;
      const profile = getProfile();
      const guest = await register({ data: { ...profile, coins: Math.min(100000, Math.max(0, getCoins())) } });
      saveGuestCredential(guest);
      return guest;
    })();
    void initialization.current.then(async (guest) => {
      credential.current = guest;
      if (alive.current) await actionRef.current("status");
    }).catch(() => { if (alive.current) { setReady(true); toast.error(t("raceConnectionError")); } });
    const poll = window.setInterval(() => { if (alive.current) void actionRef.current("status"); }, 1000);
    return () => { alive.current = false; window.clearInterval(poll); };
  }, [register]);
  const matchId = snapshot?.match?.id;
  useEffect(() => {
    if (!matchId) { setConnected(false); return; }
    const channel = supabase.channel(`race-${matchId}`)
      .on("broadcast", { event: "refresh" }, () => { void actionRef.current("status"); })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));
    return () => { void supabase.removeChannel(channel); };
  }, [matchId]);
  return { snapshot, busy, ready, connected, clockOffset, action };
}