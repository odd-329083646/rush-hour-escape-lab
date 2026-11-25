import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useDailyGame } from "@/hooks/useDailyGame";
import { useExitAnimation } from "@/hooks/useExitAnimation";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Coins, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SettingsButton } from "@/components/settings-dialog";
import { HintSelection } from "@/components/hint-selection";
import { VictoryOverlay, FailureOverlay } from "@/components/victory-overlay";
import { CoinsBadge } from "@/components/coins-badge";
import { GameArena } from "@/components/game-board";
import { DailyCalendar } from "./daily-calendar";
import { blApi } from "@/engine/blApi";

export function DailyGame({
  date,
  openCalendar = false,
}: {
  date: string;
  openCalendar?: boolean;
}) {
  const storage = blApi.ports.storage;
  const {
    t,
    start,
    par,
    cars,
    moves,
    setStartedAt,
    setNow,
    wonAt,
    loading,
    sel,
    setSel,
    steps,
    setSteps,
    move,
    setMove,
    hidden,
    setHidden,
    bumps,
    warn,
    coins,
    setCoins,
    result,
    hints,
    boardCars,
    calOpen,
    setCalOpen,
    dragStart,
    drag,
    setDrag,
    failed,
    failReason,
    reset,
    elapsed,
    started,
    useHint,
    execute,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    label,
  } = useDailyGame({ date, openCalendar });

  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const victoryReady = useExitAnimation(wonAt);
  const { panelsVisible } = useSettings();
  const requestReset = () => {
    const boardChanged =
      cars.length !== start.length ||
      cars.some((car, index) => {
        const initialCar = start[index];
        return (
          !initialCar ||
          car.id !== initialCar.id ||
          car.row !== initialCar.row ||
          car.col !== initialCar.col ||
          car.dir !== initialCar.dir
        );
      });

    if (moves > 0 || bumps > 0 || boardChanged) setResetConfirmationOpen(true);
    else reset(start);
  };

  return (
    <main className="lot-bg flex h-dvh flex-col gap-2 overflow-hidden px-2 py-2 sm:px-4">
      <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-2">
        <Button asChild variant="ghost" className="chip px-2 sm:px-3.5">
          <Link to="/" aria-label={t("backHome")}>
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">{t("backHome")}</span>
          </Link>
        </Button>
        <h1 className="min-w-0 truncate font-display text-sm font-bold md:text-xl">
          {t("daily")} <span className="text-muted-foreground">· {label}</span>
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <CoinsBadge />

          <Button
            variant="ghost"
            className="chip px-2 sm:px-3.5"
            onClick={() => setCalOpen(true)}
            aria-label={t("calendar")}
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">{t("calendar")}</span>
          </Button>
          <Button
            variant="ghost"
            className="chip px-2 sm:px-3.5"
            onClick={requestReset}
            aria-label={t("reset")}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">{t("reset")}</span>
          </Button>
          <SettingsButton />
        </div>
      </header>

      <HintSelection
        open={hints.open}
        onOpenChange={hints.setOpen}
        level="medium"
        cars={cars}
        hidden={hidden}
        coins={coins}
        onUse={useHint}
      />

      <GameArena
        t={t}
        showControlsPanel={!started || panelsVisible}
        showCarsPanel={panelsVisible}
        controls={{
          started,
          startDisabled: loading,
          onStart: () => {
            setHidden(blApi.game.pickHidden(cars, "medium"));
            setStartedAt(Date.now());
            setNow(Date.now());
          },
          move,
          onMoveChange: setMove,
          steps,
          onStepsChange: setSteps,
          showHint: true,
          hintDisabled: !started || !!result || failed || hints.peek,
          onHintClick: () => {
            setCoins(blApi.rewards.getCoins(storage));
            hints.setOpen(true);
          },
          executeDisabled: !started || !!result || failed,
          onExecute: execute,
        }}
        board={{
          cars: boardCars,
          selectedId: sel,
          hiddenIds: hidden,
          revealed: hints.peek,
          won: wonAt !== null,
          warn,
          drag,
          getCarLabel: (c, isHidden) => (isHidden ? t("hiddenCar") : c.name),
          onCarClick: (c) => {
            if (started && !result) setSel(c.id);
          },
          onPointerDown: handlePointerDown,
          onPointerMove: handlePointerMove,
          onPointerUp: handlePointerUp,
          onPointerCancel: () => {
            dragStart.current = null;
            setDrag(null);
          },
          children: <FailureOverlay reason={failReason} onRetry={() => reset(start)} isDaily />,
        }}
        boardFooter={
          <div
            className="game-stats flex w-full items-center justify-between gap-3 text-sm"
            style={{ maxWidth: "var(--board)" }}
          >
            <span>
              {t("movesLabel")} <b className="font-display">{moves}</b>{" "}
              <span className="text-muted-foreground">/ {t("par", { n: par })}</span>
            </span>
            <span className="font-display">{blApi.dailyScores.fmtTime(elapsed)}</span>
            <span>
              {t("bumps")} <b className="font-display">{bumps}</b>
            </span>
          </div>
        }
        paletteCars={cars}
        paletteDisabled={!started || !!result}
        getPaletteCarLabel={(c) => `Select ${c.id} · ${c.name}`}
        onSelectCar={setSel}
      />

      {result && victoryReady && (
        <VictoryOverlay label={t("solved")} confetti={result.isRecord}>
          <div>
            <h2 className="font-display text-2xl font-bold">
              {result.isRecord ? t("newRecord") : t("solved")}
            </h2>
            <div className="mt-2 flex flex-col items-center text-muted-foreground">
              <span>{t("statMoves", { n: moves })}</span>
              <span>{t("statTime", { t: blApi.dailyScores.fmtTime(result.time) })}</span>
              <span>{t("statPar", { n: par })}</span>
            </div>
            {!result.isRecord && (
              <p className="mt-1 text-sm">
                {t("yourVsBest", {
                  time: blApi.dailyScores.fmtTime(result.time),
                  best: result.best != null ? blApi.dailyScores.fmtTime(result.best) : "—",
                })}
              </p>
            )}

            <div className="mt-3 flex justify-center">
              {result.coinsEarned > 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-400">
                  <Coins className="h-4 w-4 fill-amber-400" />
                  <span>
                    {t("coinsEarned", { n: result.coinsEarned })}{" "}
                    {result.isRecord ? t("recordBonus") : ""}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">{t("replayNoCoins")}</span>
              )}
            </div>

            <div className="victory-actions">
              <Button
                variant="ghost"
                className="victory-next"
                onClick={() => {
                  setCalOpen(false);
                  reset(start);
                }}
                aria-label={t("playAgain")}
                title={t("playAgain")}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="chip" onClick={() => setCalOpen(true)}>
                <CalendarDays className="h-4 w-4" /> {t("calendar")}
              </Button>
              <Button asChild variant="secondary" className="victory-home">
                <Link to="/">
                  <Home className="h-4 w-4" /> {t("home")}
                </Link>
              </Button>
            </div>
          </div>
        </VictoryOverlay>
      )}
      <DailyCalendar open={calOpen} onClose={() => setCalOpen(false)} current={date} />
      <AlertDialog open={resetConfirmationOpen} onOpenChange={setResetConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resetConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => reset(start)}>{t("reset")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}