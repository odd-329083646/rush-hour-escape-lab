import { useEffect, useState, useMemo, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useTournament } from "@/hooks/use-tournament";
import { getProfile, type Profile } from "@/lib/profile";
import { getCoins } from "@/lib/puzzles";
import { ENTRY_FEE } from "@/lib/tournament";
import { toast } from "sonner";

export function useCompetitions() {
  const { t } = useI18n();
  const { snapshot, ready, busy, connected, clockOffset, action, commitMove } = useTournament();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [forfeitOpen, setForfeitOpen] = useState(false);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [coins, setCoins] = useState(0);

  // טעינה ראשונית וסנכרון מטבעות רק כשיש שינוי
  useEffect(() => {
    setProfile(getProfile());
    setCoins(getCoins());
  }, []);

  const match = snapshot?.match;
  const isMatchActive = match?.status === "playing" || match?.status === "waiting";

  // הפעלת טיימר סנכרון זמנים **אך ורק** כשיש משחק פעיל
  useEffect(() => {
    if (!isMatchActive) return;
    setNow(Date.now());
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => window.clearInterval(timer);
  }, [isMatchActive]);

  const guestId = snapshot?.guest.id;
  const isHost = match?.a === guestId;

  const mine = useMemo(() => (match ? (isHost ? match.a_state : match.b_state) : null), [match, isHost]);
  const opponent = useMemo(() => (match ? (isHost ? match.b_state : match.a_state) : null), [match, isHost]);
  const opponentName = match ? (isHost ? match.b_name : match.a_name) : null;
  const opponentCountry = match ? (isHost ? match.b_country : match.a_country) : null;

  const start = useMemo(() => (match?.started_at ? Date.parse(match.started_at) : 0), [match?.started_at]);
  const serverNow = now + clockOffset;
  const countdown = match?.status === "playing" ? Math.ceil((start - serverNow) / 1000) : 0;
  const elapsed = Math.max(0, Math.floor((serverNow - start) / 1000)) || 0;

  const waitRemaining = useMemo(() => {
    if (!match?.created_at) return 0;
    if (!match.private) return 0;
    const limit = 30000;
    return Math.max(0, Math.ceil((limit - serverNow + Date.parse(match.created_at)) / 1000));
  }, [match?.created_at, match?.private, serverNow]);

  const winner = match?.winner === guestId;
  const resultElapsed = useMemo(() => {
    if (!match?.started_at || !match?.updated_at) return 0;
    return Math.max(0, Math.floor((Date.parse(match.updated_at) - Date.parse(match.started_at)) / 1000));
  }, [match?.started_at, match?.updated_at]);

  const begin = useCallback(
    (kind: "random" | "create" | "join", room?: string) => {
      const currentCoins = getCoins();
      if (currentCoins < ENTRY_FEE) {
        toast.error(t("raceNeedCoins"));
        return;
      }
      void action(kind, room ? { code: room } : undefined);
    },
    [action, t]
  );

  const dismiss = useCallback(async () => {
    await action("leave");
    setCoins(getCoins()); // עדכון המטבעות לאחר סיום המשחק
  }, [action]);

  return {
    t,
    snapshot,
    ready,
    busy,
    connected,
    clockOffset,
    action,
    profile,
    joinOpen,
    setJoinOpen,
    forfeitOpen,
    setForfeitOpen,
    code,
    setCode,
    now,
    coins,
    match,
    mine,
    opponent,
    opponentName,
    opponentCountry,
    start,
    serverNow,
    countdown,
    elapsed,
    waitRemaining,
    winner,
    resultElapsed,
    begin,
    commit: commitMove,
    dismiss,
  };
}
