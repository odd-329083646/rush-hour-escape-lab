import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useTournament } from "@/hooks/use-tournament";
import { getProfile, flag, type Profile } from "@/lib/profile";
import { getCoins, type Move } from "@/lib/puzzles";
import { fmtTime } from "@/lib/daily-scores";
import { ENTRY_FEE, formatRoomCode, normalizeRoomCode } from "@/lib/tournament";
import { toast } from "sonner";

export function useCompetitions() {
  const { t } = useI18n();
  const { snapshot, ready, busy, connected, clockOffset, action, commitMove } = useTournament();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [forfeitOpen, setForfeitOpen] = useState(false);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(0);
  const [coins, setCoins] = useState(0);
  useEffect(() => {
    setProfile(getProfile()); setCoins(getCoins()); setNow(Date.now());
    const timer = window.setInterval(() => { setNow(Date.now()); setCoins(getCoins()); }, 200);
    return () => window.clearInterval(timer);
  }, []);
  const match = snapshot?.match;
  const mine = match ? match.a === snapshot?.guest.id ? match.a_state : match.b_state : null;
  const opponent = match ? match.a === snapshot?.guest.id ? match.b_state : match.a_state : null;
  const opponentName = match ? match.a === snapshot?.guest.id ? match.b_name : match.a_name : null;
  const opponentCountry = match ? match.a === snapshot?.guest.id ? match.b_country : match.a_country : null;
  const start = Date.parse(match?.started_at ?? "");
  const serverNow = now + clockOffset;
  const countdown = match?.status === "playing" ? Math.ceil((start - serverNow) / 1000) : 0;
  const elapsed = Math.max(0, Math.floor((serverNow - start) / 1000)) || 0;
  const waitRemaining = match ? Math.max(0, Math.ceil(((match.private ? 30000 : 15000) - serverNow + Date.parse(match.created_at)) / 1000)) : 0;
  const winner = match?.winner === snapshot?.guest.id;
  const resultElapsed = match?.started_at ? Math.max(0, Math.floor((Date.parse(match.updated_at) - Date.parse(match.started_at)) / 1000)) : 0;
  const begin = (kind: "random" | "create" | "join", room?: string) => {
    if (coins < ENTRY_FEE) { toast.error(t("raceNeedCoins")); return; }
    void action(kind, room ? { code: room } : undefined);
  };
  const commit = commitMove;
  const dismiss = async () => { await action("leave"); };
  return { t, snapshot, ready, busy, connected, clockOffset, action, profile, joinOpen, setJoinOpen, forfeitOpen, setForfeitOpen, code, setCode, now, coins, match, mine, opponent, opponentName, opponentCountry, start, serverNow, countdown, elapsed, waitRemaining, winner, resultElapsed, begin, commit, dismiss };
}
