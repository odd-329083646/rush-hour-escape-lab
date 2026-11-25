import { useSettings } from "@/hooks/useSettings";
import { useStandardGame } from "@/hooks/useStandardGame";
import { useExitAnimation } from "@/hooks/useExitAnimation";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Home,
  Layers,
  Lock,
  RotateCcw,
  Send,
  Shuffle,
  Star,
  Timer,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { LEVELS, IS_OFFLINE_MODE, TIERS, type Level, type Move } from "@/engine/game";
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
import { BoardWarning, GameArena } from "@/components/game-board";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/game/$level")({
  beforeLoad: ({ params }) => {
    if (!(params.level in LEVELS)) throw notFound();
  },
  head: ({ params }) => {
    const t = `${LEVELS[params.level as Level]?.title ?? "Game"} — Rush Hour Vanishing Cars`;
    return {
      meta: [
        { title: t },
        { name: "description", content: "Pick a car, choose a direction and steps, and execute." },
        { property: "og:title", content: t },
        {
          property: "og:description",
          content: "Pick a car, choose a direction and steps, and execute.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Game,
});

const ARROW: Record<Move, string> = { up: "↑", down: "↓", left: "←", right: "→" };

function Game() {
  const { panelsVisible } = useSettings();
  const { level } = Route.useParams() as { level: Level };
  const {
    openHints,
    tiers,
    drawRandom,
    t,
    murderer,
    idx,
    puzzle,
    cars,
    initialCars,
    moves,
    sel,
    setSel,
    move,
    setMove,
    steps,
    setSteps,
    msg,
    warn,
    started,
    hidden,
    plan,
    setPlan,
    levelsOpen,
    setLevelsOpen,
    failed,
    failReason,
    simulating,
    wonStars,
    isRecord,
    coins,
    hints,
    boardRevealed,
    boardCars,
    murdererBoard,
    setMurdererBoard,
    collapsedTiers,
    won,
    wonAt,
    clock,
    progress,
    toggleTier,
    formatTime,
    loadPuzzle,
    jumpTo,
    start,
    useHint,
    execute,
    submitPlan,
    isLast,
    showBoard,
    dragStart,
    drag,
    setDrag,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useStandardGame(level);

  const victoryReady = useExitAnimation(wonAt);
  const planEndRef = useRef<HTMLDivElement | null>(null);
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const requestReset = () => {
    const boardChanged =
      cars.length !== initialCars.length ||
      cars.some((car, index) => {
        const initialCar = initialCars[index];
        return (
          !initialCar ||
          car.id !== initialCar.id ||
          car.row !== initialCar.row ||
          car.col !== initialCar.col ||
          car.dir !== initialCar.dir
        );
      });

    if (moves > 0 || plan.length > 0 || boardChanged) setResetConfirmationOpen(true);
    else loadPuzzle(idx);
  };

  useEffect(() => {
    if (murderer && plan.length > 0) {
      planEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [plan, murderer]);

  return (
    <main className="lot-bg flex h-dvh flex-col gap-2 overflow-hidden px-2 py-2 sm:px-4">
      {IS_OFFLINE_MODE && (
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 sm:text-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>{t("offline")}</span>
          </div>
          <Button size="sm" variant="outline" onClick={drawRandom} className="h-7 gap-1 text-xs">
            <Shuffle className="h-3 w-3" /> {t("randomLevel")}
          </Button>
        </div>
      )}

      <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-2 overflow-x-auto">
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="ghost" className="chip px-2 sm:px-2.5" disabled={simulating}>
            <Link to="/" aria-label={t("backHome")} title={t("backHome")}>
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            aria-label={t("back")}
            title={t("back")}
            className="chip gap-1.5 px-2 sm:px-3.5"
            disabled={simulating}
          >
            <ArrowRight className="h-4 w-4" />
            <span className="hidden sm:inline">{t("back")}</span>
          </Button>
        </div>

        <h1 className="min-w-0 truncate font-display text-sm font-bold md:text-xl">
          {t(`level.${level}`)}{" "}
          <span className="text-muted-foreground">· {t("level", { n: idx + 1 })}</span>
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <CoinsBadge />

          <Button
            variant="ghost"
            onClick={() => setLevelsOpen(true)}
            aria-label={t("chooseLevel")}
            title={t("chooseLevel")}
            className="chip px-2 sm:px-3.5"
            disabled={simulating}
          >
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">{t("levels")}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={requestReset}
            aria-label={t("reset")}
            title={t("reset")}
            className="chip px-2 sm:px-3.5"
            disabled={simulating}
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
        level={level}
        cars={cars}
        hidden={hidden}
        plan={plan}
        coins={coins}
        onUse={useHint}
      />

      <GameArena
        t={t}
        plannedMovesLayout={murderer && started && !showBoard}
        showControlsPanel={!started || panelsVisible || murderer}
        showCarsPanel={panelsVisible || murderer}
        controls={{
          started,
          onStart: start,
          move,
          onMoveChange: setMove,
          steps,
          onStepsChange: setSteps,
          controlsDisabled: simulating,
          showHint: true,
          hintDisabled: simulating || won || failed || hints.peek,
          onHintClick: openHints,
          executeLabel: murderer ? t("addMove") : t("execute"),
          executeIcon: murderer ? "plus" : "play",
          executeDisabled: won || simulating,
          onExecute: execute,
        }}
        boardHeader={
          murderer && started && !won && !failed && !hints.peek && hidden.size < cars.length ? (
            <Button
              variant="ghost"
              className="chip"
              onClick={() => setMurdererBoard((value) => !value)}
            >
              {murdererBoard ? <Layers className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {t(murdererBoard ? "plannedMoves" : "hintRevealedBoard")}
            </Button>
          ) : null
        }
        board={{
          cars: boardCars,
          selectedId: sel,
          hiddenIds: hidden,
          revealed: boardRevealed,
          won,
          warn,
          drag,
          getCarLabel: (c, isHidden) => (isHidden ? t("hiddenCar") : c.name),
          onPointerDown: handlePointerDown,
          onPointerMove: handlePointerMove,
          onPointerUp: handlePointerUp,
          onPointerCancel: () => {
            dragStart.current = null;
            setDrag(null);
          },
          children: failed ? (
            <FailureOverlay reason={failReason} onRetry={() => loadPuzzle(idx)} />
          ) : null,
        }}
        customCenter={
          !showBoard ? (
            <div
              className="planned-moves-panel panel relative flex min-h-0 w-full flex-1 flex-col gap-2 self-start max-h-[var(--board)]"
              style={{ width: "var(--board)" }}
            >
              <BoardWarning warn={warn} />
              <h2 className="panel-title mb-0">{t("plannedMoves")}</h2>
              {plan.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{t("planEmpty")}</p>
              ) : (
                <ol className="planned-moves-list flex min-h-0 max-h-[35vh] flex-1 flex-col gap-2 overflow-y-auto pr-1 sm:max-h-[50vh]">
                  {plan.map((p, i) => {
                    const c = cars.find((x) => x.id === p.id);
                    if (!c) return null;
                    return (
                      <li
                        key={i}
                        className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        <span className="w-6 font-display text-muted-foreground">{i + 1}.</span>
                        <span className="h-3 w-5 rounded-sm" style={{ background: c.color }} />
                        <span className="flex-1">
                          {c.id} · {c.name}
                        </span>
                        <span className="font-display">
                          {ARROW[p.move]} {p.steps}
                        </span>
                        <Button
                          variant="ghost"
                          aria-label={t("removeMove")}
                          onClick={() => setPlan((q) => q.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-foreground"
                          disabled={simulating}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                  <div ref={planEndRef} />
                </ol>
              )}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setPlan([])}
                  disabled={!plan.length || simulating}
                  className="chip"
                >
                  {t("clear")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={submitPlan}
                  disabled={simulating}
                  className="execute flex flex-1 items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" /> {t("submitSolution")}
                </Button>
              </div>
            </div>
          ) : undefined
        }
        boardFooter={
          <div
            className="game-stats flex w-full shrink-0 items-center justify-between gap-3 text-sm text-muted-foreground"
            style={{ width: "var(--board)" }}
          >
            <span>
              {t("movesLabel")}:{" "}
              <b className="font-display text-foreground">
                {murderer && !won ? plan.length : moves}
              </b>
            </span>
            <span className="min-w-0 flex-1 truncate text-center">{msg}</span>
            <span className="flex items-center gap-1">
              <Timer className="h-4 w-4" />
              <span className="font-display text-foreground">{clock}</span>
            </span>
          </div>
        }
        paletteCars={cars}
        paletteDisabled={simulating}
        onSelectCar={setSel}
      />

      {won && victoryReady && (
        <VictoryOverlay label={t("victory")} stars={wonStars} confetti={isRecord}>
          <h2 className="font-display">{t("victory")}</h2>
          {isLast && <p className="mt-2">{t("allDone")}</p>}
          <div className="mt-3 flex flex-col items-center gap-1 text-lg">
            <span>{t("statMoves", { n: moves })}</span>
            <span>{t("statTime", { t: clock })}</span>
            <span>{t("statPar", { n: puzzle.par })}</span>
          </div>
          <div className="victory-actions">
            <Button
              variant="ghost"
              className="chip"
              onClick={() => loadPuzzle(idx)}
              aria-label={t("playAgain")}
              title={t("playAgain")}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              className="victory-next"
              onClick={() => (isLast ? loadPuzzle(idx) : jumpTo(idx + 1))}
            >
              {t(isLast ? "playAgain" : "nextLevel")}
            </Button>
            <Button asChild variant="secondary" className="victory-home">
              <Link to="/">
                <Home />
                {t("home")}
              </Link>
            </Button>
          </div>
        </VictoryOverlay>
      )}

      {levelsOpen && (
        <div
          className="toy-dialog-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setLevelsOpen(false)}
        >
          <div
            className={`panel level-picker difficulty-${level} flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden p-0`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
              <h2 className="font-display text-xl font-bold">{t("chooseLevel")}</h2>
              <Button
                variant="ghost"
                aria-label={t("close")}
                onClick={() => setLevelsOpen(false)}
                className="chip"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
              {tiers.map(({ tier, tierIdx, unlocked, solvedCount, tierItems, remaining }) => {
                if (tierItems.length === 0) return null;
                const isCollapsed = !!collapsedTiers[tier.id];

                return (
                  <div key={tier.id} className="rounded-lg border bg-card p-3">
                    <Button
                      variant="ghost"
                      onClick={() => toggleTier(tier.id)}
                      className="flex w-full items-center justify-between text-start transition-colors hover:opacity-80"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold sm:text-base">
                        {!unlocked ? (
                          <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        )}
                        <span>
                          {t(tierIdx === TIERS.length - 1 ? "tierTitleLast" : "tierTitle", {
                            n: tierIdx + 1,
                            min: tier.minPar,
                            max: tier.maxPar,
                          })}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {unlocked
                          ? t("tierSolved", { a: solvedCount, b: tierItems.length })
                          : t("tierLocked", { n: remaining })}
                      </span>
                    </Button>

                    {!isCollapsed && (
                      <div className="mt-3 grid grid-cols-5 gap-2 border-t border-border/50 pt-2">
                        {tierItems.map(({ originalIdx, tierLevelNum }) => {
                          const done = (progress[originalIdx]?.stars ?? 0) > 0;
                          const starCount = progress[originalIdx]?.stars ?? 0;
                          const bestSecs = progress[originalIdx]?.bestTime;

                          return (
                            <Button
                              variant="ghost"
                              key={`${tier.id}_${tierLevelNum}`}
                              disabled={!unlocked}
                              onClick={() => jumpTo(originalIdx)}
                              data-active={originalIdx === idx}
                              className="ctrl level-tile relative flex min-h-[4rem] flex-col items-center justify-center p-2 font-display disabled:opacity-40"
                            >
                              {tierLevelNum}
                              {!unlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                              {done && (
                                <CheckCircle2 className="absolute -right-1 -top-1 h-4 w-4 text-primary" />
                              )}

                              {unlocked && starCount > 0 && (
                                <div className="mt-1 flex gap-0.5">
                                  {[1, 2, 3].map((s) => (
                                    <Star
                                      key={s}
                                      className={`h-2.5 w-2.5 ${s <= starCount ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
                                    />
                                  ))}
                                </div>
                              )}

                              {unlocked && done && bestSecs !== undefined && (
                                <span className="mt-0.5 font-display text-[10px] font-semibold text-muted-foreground">
                                  {formatTime(bestSecs)}
                                </span>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <AlertDialog open={resetConfirmationOpen} onOpenChange={setResetConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resetConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => loadPuzzle(idx)}>{t("reset")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
