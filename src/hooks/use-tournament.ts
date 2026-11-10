import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { subscribeRace } from "@/services/supabaseService";
import { registerTournamentGuest, tournamentAction } from "@/lib/tournament.functions";
import { applyTournamentSnapshot, getGuestCredential, saveGuestCredential, walletDelta } from "@/lib/tournament-device";
import { getProfile } from "@/lib/profile";
import { getCoins, type Move } from "@/lib/puzzles";
import { useI18n } from "@/lib/i18n";
import { advanceRace, resolveRacePuzzles, type GuestCredential, type RaceSnapshot } from "@/lib/tournament";

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
  const authoritative = useRef<RaceSnapshot | null>(null);
  const optimistic = useRef<RaceSnapshot | null>(null);
  const queued = useRef<{ id: string; direction: Move; steps: number }[]>([]);
  const recovering = useRef(false);
  // Match id the player has finished locally; slower server snapshots may not revert it to playing.
  const localWin = useRef<string | null>(null);

  const publish = useCallback((data: RaceSnapshot) => {
    authoritative.current = data;
    let visible = data;
    const match = data.match;

    // אם המשחק עדיין פעיל בשרת, נסנכרן מהלכים עומדים בתור
    if (match?.status === "playing") {
      const side = match.a === data.guest.id ? "a_state" : "b_state";
      let state = match[side];
      for (const move of queued.current) {
        if (!state) break;
        const next = advanceRace(resolveRacePuzzles(match), state, move.id, move.direction, move.steps, state.elapsed);
        if (next.error) break;
        state = next.state;
      }

      // בדיקה: אם בעקבות המהלכים המקומיים הגענו ל-3 שלבים - נעדכן אופטימית לניצחון!
      const isFinishedOptimistically = state && state.index >= 3;
      visible = {
        ...data,
        match: {
          ...match,
          [side]: state,
          status: isFinishedOptimistically ? "finished" : match.status,
          winner: isFinishedOptimistically ? data.guest.id : match.winner,
        },
      };
    }

    const won = localWin.current;
    if (won && visible.match?.id === won && visible.match.status === "playing") {
      const side = visible.match.a === data.guest.id ? "a_state" : "b_state";
      const kept = optimistic.current?.match?.id === won ? optimistic.current.match[side] : visible.match[side];
      visible = { ...visible, match: { ...visible.match, [side]: kept, status: "finished", winner: data.guest.id } };
    }
    // Once the server settles the match (or it is gone), its result is authoritative again.
    if (won && data.match?.id !== won) localWin.current = null;
    else if (won && data.match?.status !== "playing") localWin.current = null;
    optimistic.current = visible;
    if (alive.current) setSnapshot(visible);
  }, []);

  const action = useCallback(
    async (kind: Action, options?: { code?: string; moves?: { id: string; direction: Move; steps: number }[] }) => {
      if (!credential.current) return;
      if (kind === "status" && queued.current.length > 0) return;
      if (locked.current) {
        if (kind === "status") return;
        while (locked.current && alive.current) await new Promise((resolve) => window.setTimeout(resolve, 15));
        if (!alive.current) return;
      }
      locked.current = true;
      if (kind !== "status") setBusy(true);
      const balance = getCoins();
      try {
        const profile = getProfile();
        const result = await invoke({
          data: {
            credential: credential.current,
            action: kind,
            delta: walletDelta(),
            username: profile.username,
            country: profile.country,
            ...options,
          },
        });
        if ("guest" in result && result.guest) {
          const data = result as RaceSnapshot;
          applyTournamentSnapshot(data, balance);
          if (alive.current) {
            setClockOffset(Date.parse(data.serverNow) - Date.now());
            if (kind === "move") queued.current.splice(0, options?.moves?.length ?? 0);
            if (recovering.current || data.match?.status !== "playing") {
              queued.current = [];
              recovering.current = false;
            }
            publish(data);
          }
          if (data.error) toast.error(data.error === "coins" ? t("raceNeedCoins") : t("raceUnavailable"));
        } else if (result.error) {
          if (kind === "move") {
            queued.current = [];
            localWin.current = null;
            if (authoritative.current) publish(authoritative.current);
          }
          toast.error(
            result.error === "coins"
              ? t("raceNeedCoins")
              : result.error === "unavailable"
              ? t("raceUnavailable")
              : te(result.error)
          );
        }
      } catch {
        if (kind === "move") {
          queued.current = [];
          localWin.current = null;
          recovering.current = true;
          if (authoritative.current) publish(authoritative.current);
        }
        if (kind !== "status") toast.error(t("raceConnectionError"));
      } finally {
        locked.current = false;
        if (alive.current) {
          setBusy(false);
          setReady(true);
        }
      }
    },
    [invoke, t, te, publish]
  );

  const actionRef = useRef(action);
  actionRef.current = action;
  const sending = useRef(false);
  // One request in flight at a time; every move queued meanwhile is sent together in the next batch,
  // so the winning move never waits behind a chain of per-move round trips.
  const flushMoves = useCallback(async () => {
    if (sending.current) return;
    sending.current = true;
    try {
      while (alive.current && queued.current.length > 0) {
        const batch = queued.current.slice(0, 40);
        await actionRef.current("move", { moves: batch });
        if (queued.current[0] === batch[0]) break; // failed batch was not consumed; stop retry spam
      }
    } finally {
      sending.current = false;
    }
  }, []);

  const commitMove = useCallback(
    (id: string, direction: Move, steps: number) => {
      const data = optimistic.current;
      const match = data?.match;
      if (!data || !match || match.status !== "playing" || recovering.current) return;
      const side = match.a === data.guest.id ? "a_state" : "b_state";
      const current = match[side];
      if (!current || Date.now() + clockOffset < Date.parse(match.started_at ?? "")) return;

      const next = advanceRace(
        resolveRacePuzzles(match),
        current,
        id,
        direction,
        steps,
        Math.max(0, Math.floor((Date.now() + clockOffset - Date.parse(match.started_at ?? "")) / 1000))
      );
      if (next.error) {
        toast.error(te(next.error));
        return;
      }

      const move = { id, direction, steps };
      queued.current.push(move);

      // זיהוי אופטימי מיידי: אם הגענו לשלב 3 - מקפיצים מנצח בלייב!
      const isWinningMove = next.state.index >= 3;
      if (isWinningMove) localWin.current = match.id;
      const visible: RaceSnapshot = {
        ...data,
        match: {
          ...match,
          [side]: next.state,
          status: isWinningMove ? "finished" : match.status,
          winner: isWinningMove ? data.guest.id : match.winner,
        },
      };

      optimistic.current = visible;
      setSnapshot(visible);

      void flushMoves();
    },
    [clockOffset, te, flushMoves]
  );

  useEffect(() => {
    alive.current = true;
    if (!initialization.current)
      initialization.current = (async () => {
        const existing = getGuestCredential();
        if (existing) return existing;
        const profile = getProfile();
        const guest = await register({ data: { ...profile, coins: Math.min(100000, Math.max(0, getCoins())) } });
        saveGuestCredential(guest);
        return guest;
      })();
    void initialization.current
      .then(async (guest) => {
        credential.current = guest;
        if (alive.current) await actionRef.current("status");
      })
      .catch(() => {
        if (alive.current) {
          setReady(true);
          toast.error(t("raceConnectionError"));
        }
      });
    const poll = window.setInterval(() => {
      if (alive.current) void actionRef.current("status");
    }, 1000);
    return () => {
      alive.current = false;
      window.clearInterval(poll);
    };
  }, [register]);

  const matchId = snapshot?.match?.id;
  useEffect(() => {
    if (!matchId) {
      setConnected(false);
      return;
    }
    return subscribeRace(
      matchId,
      () => {
        void actionRef.current("status");
      },
      setConnected
    );
  }, [matchId]);

  return { snapshot, busy, ready, connected, clockOffset, action, commitMove };
}
