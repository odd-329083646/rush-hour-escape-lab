import { useEffect, useState, useMemo, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useTournament } from "@/hooks/use-tournament";
import { blApi } from "@/engine/blApi";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useDuelInvitations } from "@/hooks/useDuelInvitations";

export function useCompetitions() {
  const { t } = useI18n();
  const storage = blApi.ports.storage;
  const { snapshot, ready, busy, connected, clockOffset, action, commitMove } = useTournament({
    resetResultsOnEntry: true,
  });
  const { profile } = useProfile();
  const [joinOpen, setJoinOpen] = useState(false);
  const [friendOpen, setFriendOpen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [recipientCode, setRecipientCode] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const { inbox, send } = useDuelInvitations();
  const [forfeitOpen, setForfeitOpen] = useState(false);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [coins, setCoins] = useState(0);

  // טעינה ראשונית וסנכרון מטבעות רק כשיש שינוי
  useEffect(() => {
    setCoins(blApi.rewards.getCoins(storage));
  }, [storage]);

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

  const mine = useMemo(
    () => (match ? (isHost ? match.a_state : match.b_state) : null),
    [match, isHost],
  );
  const opponent = useMemo(
    () => (match ? (isHost ? match.b_state : match.a_state) : null),
    [match, isHost],
  );
  const opponentName = match ? (isHost ? match.b_name : match.a_name) : null;
  const opponentCountry = match ? (isHost ? match.b_country : match.a_country) : null;
  const opponentAvatarId = match ? (isHost ? match.b_avatar_id : match.a_avatar_id) : undefined;

  const start = useMemo(
    () => (match?.started_at ? Date.parse(match.started_at) : 0),
    [match?.started_at],
  );
  const serverNow = now + clockOffset;
  const countdown = match?.status === "playing" ? Math.ceil((start - serverNow) / 1000) : 0;
  const elapsed = Math.max(0, Math.floor((serverNow - start) / 1000)) || 0;

  const waitRemaining = useMemo(() => {
    if (!match?.created_at) return 0;
    return blApi.tournament.raceWaitRemaining(match, serverNow);
  }, [match?.created_at, match?.private, serverNow]);

  const winner = match?.winner === guestId;
  const resultElapsed = useMemo(() => {
    if (!match?.started_at || !match?.updated_at) return 0;
    return Math.max(
      0,
      Math.floor((Date.parse(match.updated_at) - Date.parse(match.started_at)) / 1000),
    );
  }, [match?.started_at, match?.updated_at]);

  const begin = useCallback(
    async (kind: "random" | "create" | "join", room?: string) => {
      const currentCoins = blApi.rewards.getCoins(storage);
      if (currentCoins < blApi.constants.entryFee) {
        toast.error(t("raceNeedCoins"));
        return;
      }
      setUnavailable(false);
      setFriendOpen(false);
      const result = await action(kind, room ? { code: room } : undefined);
      if (kind === "join" && result?.error === "unavailable") setUnavailable(true);
    },
    [action, t, storage],
  );

  const dismiss = useCallback(async () => {
    setUnavailable(false);
    await action("leave");
    setCoins(blApi.rewards.getCoins(storage)); // עדכון המטבעות לאחר סיום המשחק
  }, [action, storage]);

  const sendInvite = async () => {
    setSendingInvite(true);
    const result = await send(recipientCode);
    setSendingInvite(false);
    if (result.sent) {
      toast.success(t("raceInviteSent"));
      setRecipientCode("");
    } else
      toast.error(
        t(
          result.error === "not_found"
            ? "raceInviteNotFound"
            : result.error === "ambiguous"
              ? "raceInviteAmbiguous"
              : "raceInviteUnavailable",
        ),
      );
  };

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
    friendOpen,
    setFriendOpen,
    unavailable,
    recipientCode,
    setRecipientCode,
    sendingInvite,
    sendInvite,
    playerCode: inbox.playerCode,
    phase: blApi.tournament.raceIntroPhase(match?.started_at ?? null, serverNow),
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
    opponentAvatarId,
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