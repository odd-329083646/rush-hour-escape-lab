import { useCompetitions } from "@/hooks/useCompetitions";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Copy, DoorOpen, Home, LoaderCircle, Shuffle, Trophy, Users, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SettingsButton } from "@/components/settings-dialog";
import { TournamentBoard } from "@/components/tournament-board";
import { flag } from "@/lib/profile";
import { fmtTime } from "@/lib/daily-scores";
import { formatRoomCode, normalizeRoomCode } from "@/lib/tournament";
import { toast } from "sonner";
import { CoinsBadge } from "@/components/coins-badge";

export const Route = createFileRoute("/competitions")({
  head: () => ({
    meta: [
      { title: "Live 1v1 Tournament - Rush Hour Vanishing Cars" },
      {
        name: "description",
        content:
          "Race a guest opponent through three shared Rush Hour puzzles. Find a random rival or join a friend's private room.",
      },
      { property: "og:title", content: "Competitions - Rush Hour Vanishing Cars" },
      {
        property: "og:description",
        content: "Live guest competitions, private room codes, and three-puzzle head-to-head races.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Competitions,
});

function Competitions() {
  const { t, ready, busy, connected, action, profile, joinOpen, setJoinOpen, forfeitOpen, setForfeitOpen, code, setCode, match, mine, opponent, opponentName, opponentCountry, start, serverNow, countdown, elapsed, waitRemaining, winner, resultElapsed, begin, commit, dismiss } = useCompetitions();
  return <main className="tournament lot-bg flex h-dvh flex-col gap-3 overflow-hidden px-3 py-3" dir="ltr">
    <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-2">
      {match?.status === "playing" ? <Button variant="ghost" size="icon" className="chip" aria-label={t("raceForfeit")} title={t("raceForfeit")} onClick={() => setForfeitOpen(true)}><Home className="h-4 w-4" /></Button> : match?.status === "waiting" ? <Button variant="ghost" size="icon" className="chip" aria-label={t("raceCancel")} onClick={() => { void action("cancel"); }}><Home className="h-4 w-4" /></Button> : <Button asChild variant="ghost" size="icon" className="chip"><Link to="/" aria-label={t("backMenu")}><Home className="h-4 w-4" /></Link></Button>}
      <h1 className="font-display text-base font-bold sm:text-xl">{t("raceTitle")}</h1>
      
      {/* סרגל עליון - תג מטבעות והגדרות */}
      <div className="flex items-center gap-2">
        <CoinsBadge />
        <SettingsButton />
      </div>
    </header>
    {match?.status === "playing" && mine ? <>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 border-y border-border py-2 text-sm">
        <div className="min-w-0"><p className="truncate font-semibold">{profile?.country ? flag(profile.country) : ""} {profile?.username}</p><p className="text-xs text-muted-foreground">{t("raceProgress", { n: Math.min(mine.index + 1, 3), moves: mine.moves })} · {fmtTime(elapsed)}</p></div>
        <div className="min-w-0 text-right"><p className="truncate font-semibold">{opponentCountry ? flag(opponentCountry) : ""} {opponentName} {match.bot && <span className="text-xs text-muted-foreground">· {t("raceBot")}</span>}</p><p className="text-xs text-muted-foreground">{opponent?.index === 3 ? t("raceFinished") : t("raceProgress", { n: Math.min((opponent?.index ?? 0) + 1, 3), moves: opponent?.moves ?? 0 })}</p></div>
      </div>
      <TournamentBoard key={mine.index} state={mine} blocked={countdown > 0 || forfeitOpen || mine.index >= 3} onMove={commit} />
      <p className="mx-auto flex items-center gap-1 text-[10px] text-muted-foreground"><Wifi className="h-3 w-3" />{connected ? t("raceLive") : t("raceReconnecting")}</p>
      {countdown >= 0 && serverNow < start + 700 && <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 backdrop-blur-sm"><span className="font-display text-6xl font-bold text-primary">{countdown > 0 ? countdown : t("raceGo")}</span></div>}
    </> : !match ? <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6">
      <Trophy className="h-14 w-14 text-primary" />
      <p className="text-center font-display text-xl">{t("raceDescription")}</p>
      <div className="flex gap-5 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Coins className="h-4 w-4" />{t("raceEntry")}</span><span className="flex items-center gap-2 text-primary"><Trophy className="h-4 w-4" />{t("racePrize")}</span></div>
      <div className="grid w-full gap-3"><Button className="execute h-auto py-4" disabled={!ready || busy} onClick={() => begin("random")}><Shuffle className="h-5 w-5" />{t("raceRandom")}</Button><div className="grid grid-cols-2 gap-3"><Button variant="outline" className="h-auto whitespace-normal py-4" disabled={!ready || busy} onClick={() => begin("create")}><Users className="h-4 w-4 shrink-0" />{t("raceCreate")}</Button><Button variant="outline" className="h-auto whitespace-normal py-4" disabled={!ready || busy} onClick={() => setJoinOpen(true)}><DoorOpen className="h-4 w-4 shrink-0" />{t("raceJoin")}</Button></div></div>
      {!ready && <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />{t("raceConnecting")}</p>}
    </section> : null}
    <Dialog open={match?.status === "waiting" || match?.status === "finished" || match?.status === "cancelled"}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-lg bg-card text-center [&>button:last-child]:hidden" onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()}>
        {match?.status === "waiting" ? <>
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-primary" />
          <DialogTitle className="font-display text-xl">{t(match.private ? "raceWaiting" : "raceSearching")}</DialogTitle>
          <DialogDescription>{t("raceWaitRemaining", { n: waitRemaining })}</DialogDescription>
          {match.room_code && <div className="flex items-center justify-center gap-2"><strong className="font-display text-4xl text-primary">{formatRoomCode(match.room_code)}</strong><Button variant="ghost" size="icon" aria-label={t("raceCopy")} title={t("raceCopy")} onClick={async () => { try { await navigator.clipboard.writeText(formatRoomCode(match.room_code ?? "")); toast.success(t("raceCopied")); } catch { toast.error(t("raceConnectionError")); } }}><Copy className="h-4 w-4" /></Button></div>}
          <Button variant="outline" disabled={busy} onClick={() => { void action("cancel"); }}>{t("raceCancel")}</Button>
        </> : match?.status === "finished" ? <>
          <Trophy className="mx-auto h-12 w-12 text-primary" /><DialogTitle className="font-display text-2xl">{t(winner ? "raceWon" : "raceLost")}</DialogTitle><DialogDescription>{t(winner ? "raceReward" : "raceNoReward")}</DialogDescription>
          <div className="grid grid-cols-2 divide-x divide-border border-y border-border py-4 text-sm">
            <div className="flex min-w-0 flex-col gap-2 px-2"><strong className="truncate">{t("raceYou")}</strong><span>{t("statTime", { t: fmtTime(mine?.index === 3 ? mine.elapsed : resultElapsed) })}</span><span>{t("statMoves", { n: mine?.totalMoves ?? 0 })}</span><span className="text-xs text-muted-foreground">{mine?.index === 3 ? t("raceFinished") : t("raceIncomplete")}</span></div>
            <div className="flex min-w-0 flex-col gap-2 px-2"><strong className="truncate">{opponentName}</strong><span>{t("statTime", { t: fmtTime(opponent?.index === 3 ? opponent.elapsed : resultElapsed) })}</span><span>{t("statMoves", { n: opponent?.totalMoves ?? 0 })}</span><span className="text-xs text-muted-foreground">{opponent?.index === 3 ? t("raceFinished") : t("raceIncomplete")}</span></div>
          </div><div className="flex justify-center gap-3"><Button className="execute" disabled={busy} onClick={() => { void dismiss(); }}>{t("playAgain")}</Button><Button asChild variant="outline"><Link to="/">{t("backHome")}</Link></Button></div>
        </> : <><DialogTitle>{t("raceRoomExpired")}</DialogTitle><DialogDescription>{t("raceUnavailable")}</DialogDescription><Button className="execute" disabled={busy} onClick={() => { void dismiss(); }}>{t("tryAgain")}</Button></>}
      </DialogContent>
    </Dialog>
    <Dialog open={joinOpen} onOpenChange={setJoinOpen}><DialogContent className="w-[calc(100%-2rem)] rounded-lg bg-card [&>button:last-child]:hidden"><DialogTitle>{t("raceJoin")}</DialogTitle><DialogDescription>{t("raceEntry")}</DialogDescription><form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); const room = normalizeRoomCode(code); if (!room) { toast.error(t("raceInvalidCode")); return; } setJoinOpen(false); begin("join", room); }}><label className="flex flex-col gap-2 text-sm">{t("raceRoomCode")}<input aria-label={t("raceRoomCode")} autoFocus inputMode="numeric" maxLength={7} placeholder="000-000" value={code} onChange={(event) => setCode(event.target.value)} className="rounded-md border border-input bg-background px-3 py-3 text-center font-display text-2xl text-foreground" /></label><Button className="execute" type="submit" disabled={busy}>{t("raceJoin")}</Button><Button variant="outline" type="button" onClick={() => setJoinOpen(false)}>{t("close")}</Button></form></DialogContent></Dialog>
    <Dialog open={forfeitOpen} onOpenChange={setForfeitOpen}><DialogContent className="w-[calc(100%-2rem)] rounded-lg bg-card [&>button:last-child]:hidden"><DialogTitle>{t("raceForfeit")}</DialogTitle><DialogDescription>{t("raceForfeitBody")}</DialogDescription><div className="flex gap-3"><Button variant="destructive" disabled={busy} onClick={async () => { await action("forfeit"); setForfeitOpen(false); }}>{t("raceForfeit")}</Button><Button variant="outline" onClick={() => setForfeitOpen(false)}>{t("close")}</Button></div></DialogContent></Dialog>
  </main>;
}
