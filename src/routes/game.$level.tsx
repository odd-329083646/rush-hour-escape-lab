import { useStandardGame } from "@/hooks/useStandardGame";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, ChevronDown, ChevronUp, Coins, Eye, Home, Layers, Lightbulb, Lock, Play, Plus, RotateCcw, Send, Star, Timer, Trash2, Trophy, WifiOff, Shuffle, X } from "lucide-react";
import { applyMove, isSolved, LEVELS, pickHidden, runPlan, DEFAULT_PUZZLES, IS_OFFLINE_MODE, getRandomPuzzle, saveLevelProgress, getSavedProgress, getCoins, addCoins, getNextBestMove, TIERS, isTierUnlocked, getSolvesCountInTier, getPuzzlesForTier, type Car, type Level, type Move } from "@/lib/puzzles";
import { Button } from "@/components/ui/button";
import { SettingsButton } from "@/components/settings-dialog";
import { useI18n } from "@/lib/i18n";
import { HintSelection } from "@/components/hint-selection";
import { useHints } from "@/hooks/use-hints";
import { HINT_COSTS, hintAvailable, peekBoardCars, validateHintPlan, type HintType } from "@/lib/hints";

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
        { property: "og:description", content: "Pick a car, choose a direction and steps, and execute." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Game,
});

const DIRS: { m: Move; Icon: typeof ArrowUp; cls: string }[] = [
  { m: "up", Icon: ArrowUp, cls: "col-start-2 row-start-1" },
  { m: "left", Icon: ArrowLeft, cls: "col-start-1 row-start-2" },
  { m: "right", Icon: ArrowRight, cls: "col-start-3 row-start-2" },
  { m: "down", Icon: ArrowDown, cls: "col-start-2 row-start-3" },
];
const ARROW: Record<Move, string> = { up: "↑", down: "↓", left: "←", right: "→" };
type Planned = { id: string; move: Move; steps: number };

function Game() {
  const { level } = Route.useParams() as { level: Level };
  const { t, te, lang, murderer, idxKey, maxKey, puzzles, setPuzzles, idx, setIdx, maxSolved, setMaxSolved, puzzle, cars, setCars, moves, setMoves, startedAt, setStartedAt, now, setNow, wonAt, setWonAt, commitMove, initialCars, setInitialCars, sel, setSel, move, setMove, steps, setSteps, msg, setMsg, warn, setWarn, started, setStarted, hidden, setHidden, plan, setPlan, levelsOpen, setLevelsOpen, failed, setFailed, simulating, setSimulating, invisibleBumps, setInvisibleBumps, wonStars, setWonStars, coins, setCoinsState, hints, boardRevealed, boardCars, murdererBoard, setMurdererBoard, collapsedTiers, setCollapsedTiers, won, elapsed, clock, progress, toggleTier, formatTime, loadPuzzle, markWon, jumpTo, start, flash, useHint, checkInvisibleBump, execute, submitPlan, isLast, standard, trucks, showBoard, dragStart, drag, setDrag, freeRange, handlePointerDown, handlePointerMove, handlePointerUp } = useStandardGame(level);
  const carBtn = (c: Car) => (
    <button key={c.id} onClick={() => setSel(c.id)} data-active={sel === c.id} title={c.name} className="palette-cell" disabled={simulating}>
      <span className="h-3 rounded-sm" style={{ background: c.color, width: c.len === 3 ? "2.5rem" : "1.5rem" }} />
      <span className="text-xs">{c.id} {c.dir === "h" ? "↔" : "↕"}</span>
    </button>
  );

  return (
    <main className="lot-bg flex h-dvh flex-col gap-2 overflow-hidden px-2 py-2 sm:px-4">
      {/* באנר התראה למצב אופליין */}
      {IS_OFFLINE_MODE && (
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 sm:text-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>{t("offline")}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const randPuz = getRandomPuzzle();
              setCars(randPuz.cars);
              setInitialCars(randPuz.cars);
              setMsg(t("randomDrawn"));
            }}
            className="h-7 gap-1 text-xs"
          >
            <Shuffle className="h-3 w-3" /> {t("randomLevel")}
          </Button>
        </div>
      )}

      <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-2 overflow-x-auto">
        <Button asChild variant="ghost" className="chip shrink-0 px-2 sm:px-3.5" disabled={simulating}><Link to="/" aria-label={t("backHome")} title={t("backHome")}><Home className="h-4 w-4" /><span className="hidden sm:inline">{t("backHome")}</span></Link></Button>
        <h1 className="min-w-0 truncate font-display text-sm font-bold md:text-xl">{t(`level.${level}`)} <span className="text-muted-foreground">· {t("level", { n: idx + 1 })}</span></h1>
        
        <div className="flex shrink-0 items-center gap-2">
          {/* מאזן מטבעות */}
          <div className="chip font-display flex items-center gap-1.5 px-2.5 py-1 text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-full" title={t("coins")}>
            <Coins className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="font-bold">{coins}</span>
          </div>

           <Button variant="ghost" onClick={() => setLevelsOpen(true)} aria-label={t("chooseLevel")} title={t("chooseLevel")} className="chip px-2 sm:px-3.5" disabled={simulating}><Layers className="h-4 w-4" /><span className="hidden sm:inline">{t("levels")}</span></Button>
           <Button variant="ghost" onClick={() => loadPuzzle(idx)} aria-label={t("reset")} title={t("reset")} className="chip px-2 sm:px-3.5" disabled={simulating}><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">{t("reset")}</span></Button>
           <SettingsButton />
        </div>
      </header>

      <HintSelection open={hints.open} onOpenChange={hints.setOpen} level={level} cars={cars} hidden={hidden} plan={plan} coins={coins} onUse={useHint} />
      <div className="game-grid">
        <aside className="panel flex flex-col gap-2" style={{ gridArea: "ctrl" }}>
          {!started ? (
            <Button onClick={start} className="execute start-control whitespace-normal"><Play className="h-4 w-4" /><span>{t("startSolving")}</span></Button>
          ) : (
          <div className="solving-controls flex flex-col gap-2">
            <div>
              <h2 className="panel-title">{t("direction")}</h2>
              <div className="grid grid-cols-3 grid-rows-3 gap-2">
                {DIRS.map(({ m, Icon, cls }) => (
                   <Button variant="ghost" key={m} aria-label={m} title={m} onClick={() => setMove(m)} data-active={move === m} className={`ctrl ${cls}`} disabled={simulating}>
                    <Icon className="h-5 w-5" />
                   </Button>
                ))}

                {/* כפתור רמז במרכז החיצים (שורה 2, עמודה 2) */}
                <Button
                  onClick={() => { setCoinsState(getCoins()); hints.setOpen(true); }}
                  variant="outline"
                  disabled={simulating || won || failed || hints.peek}
                  title={t("hintMenu")} aria-label={t("hintMenu")}
                  className="ctrl col-start-2 row-start-2 border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold p-0 flex flex-col items-center justify-center gap-0.5"
                >
                  <Lightbulb className="h-4 w-4 fill-amber-500 shrink-0" />
                  
                </Button>
              </div>
            </div>

            <div>
              <h2 className="panel-title">{t("steps")}</h2>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => (
                   <Button variant="ghost" key={n} onClick={() => setSteps(n)} data-active={steps === n} className="ctrl px-0 font-display" disabled={simulating}>{n}</Button>
                ))}
              </div>
            </div>

            {/* כפתור בצע - מופעל ומוצג תמיד לכל רמות המשחק */}
            <Button onClick={execute} disabled={won || simulating} className="execute mt-1">
              {murderer ? <Plus className="h-4 w-4 shrink-0" /> : <Play className="h-4 w-4 shrink-0" />}
              <span>{murderer ? t("addMove") : t("execute")}</span>
            </Button>
          </div>
          )}
        </aside>

        <section className="flex min-h-0 flex-col items-center gap-2" style={{ gridArea: "board" }}>
          {murderer && started && !won && !failed && !hints.peek && hidden.size < cars.length && (
            <Button variant="ghost" className="chip" onClick={() => setMurdererBoard((value) => !value)}>
              {murdererBoard ? <Layers className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {t(murdererBoard ? "plannedMoves" : "hintRevealedBoard")}
            </Button>
          )}
          {showBoard ? (
            <div className="board">
              {warn && <div key={warn.key} className="warn" role="alert">{warn.text}</div>}
              {Array.from({ length: 36 }).map((_, i) => <div key={i} className="cell" style={{ gridRow: Math.floor(i / 6) + 1, gridColumn: (i % 6) + 1 }} />)}
              <div className="exit" />
              {boardCars.map((c) => (
                <button
                  key={c.id}
                  draggable={false}
                  onPointerDown={(e) => handlePointerDown(c, e)}
                  onPointerUp={(e) => handlePointerUp(c, e)}
                  onPointerMove={(e) => handlePointerMove(c, e)}
                  onPointerCancel={() => { dragStart.current = null; setDrag(null); }}
                  data-shake={sel === c.id && !!warn}
                  data-selected={sel === c.id}
                  data-hidden={hidden.has(c.id) && !boardRevealed}
                  data-escaping={won && c.id === "X"}
                  aria-label={hidden.has(c.id) && !boardRevealed ? t("hiddenCar") : c.name}
                  className="car touch-none select-none"
                  style={{
                    background: c.color,
                    gridRow: `${c.row + 1} / span ${c.dir === "v" ? c.len : 1}`,
                    gridColumn: `${c.col + 1} / span ${c.dir === "h" ? c.len : 1}`,
                    transform: drag?.id === c.id ? (c.dir === "h" ? `translate(${drag.offset}px, 0)` : `translate(0, ${drag.offset}px)`) : undefined,
                    transition: drag?.id === c.id ? "none" : undefined,
                    zIndex: drag?.id === c.id ? 5 : undefined,
                  }}
                >
                  {c.id}
                </button>
              ))}
              {won && (
                <div className="win flex-col gap-2 text-center">
                  <Trophy className="h-12 w-12 text-yellow-500 animate-bounce" />
                  <span className="text-3xl font-bold">{t("victory")}</span>
                  
                  <div className="flex justify-center gap-1 my-1">
                    {[1, 2, 3].map((s) => (
                      <Star 
                        key={s} 
                        className={`h-8 w-8 ${s <= wonStars ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} 
                      />
                    ))}
                  </div>

                  {isLast && <span className="text-base text-muted-foreground">{t("allDone")}</span>}
                  <div className="flex flex-col items-center text-base text-muted-foreground">
                    <span>{t("statMoves", { n: moves })}</span>
                    <span>{t("statTime", { t: clock })}</span>
                    <span>{t("statPar", { n: puzzle.par })}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {!isLast ? (
                       <Button variant="ghost" onClick={() => jumpTo(idx + 1)} className="chip">{t("nextLevel")}</Button>
                    ) : (
                       <Button variant="ghost" onClick={() => loadPuzzle(idx)} className="chip">{t("playAgain")}</Button>
                    )}
                    <Link to="/" className="chip"><Home className="h-4 w-4" /> {t("home")}</Link>
                  </div>
                </div>
              )}
              {failed && (
                <div className="win flex-col gap-2 text-center" style={{ backgroundColor: 'oklch(0.16 0.01 260 / 0.95)' }}>
                  <X className="h-12 w-12 text-destructive" />
                  <span className="text-3xl text-destructive">{t("oops")}</span>
                  <span className="text-base text-muted-foreground">
                    {invisibleBumps >= 3 
                      ? t("bumped3")
                      : t("planWrong")}
                  </span>
                  <div className="mt-3 flex gap-2">
                    <Button variant="ghost" onClick={() => loadPuzzle(idx)} className="chip">
                      <RotateCcw className="h-4 w-4" /> {t("tryAgain")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="panel relative flex w-full flex-col gap-2 self-start" style={{ width: "var(--board)", maxHeight: "var(--board)" }}>
              {warn && <div key={warn.key} className="warn" role="alert">{warn.text}</div>}
              <h2 className="panel-title mb-0">{t("plannedMoves")}</h2>
              {plan.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{t("planEmpty")}</p>
              ) : (
                <ol className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
                  {plan.map((p, i) => {
                    const c = cars.find((x) => x.id === p.id)!;
                    return (
                      <li key={i} className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm">
                        <span className="w-6 font-display text-muted-foreground">{i + 1}.</span>
                        <span className="h-3 w-5 rounded-sm" style={{ background: c.color }} />
                        <span className="flex-1">{c.id} · {c.name}</span>
                        <span className="font-display">{ARROW[p.move]} {p.steps}</span>
                        <button aria-label={t("removeMove")} onClick={() => setPlan((q) => q.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground" disabled={simulating}><Trash2 className="h-4 w-4" /></button>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div className="flex gap-2">
                <button onClick={() => setPlan([])} disabled={!plan.length || simulating} className="chip">{t("clear")}</button>
                <button onClick={submitPlan} disabled={simulating} className="execute flex flex-1 items-center justify-center gap-2"><Send className="h-4 w-4" /> {t("submitSolution")}</button>
              </div>
            </div>
          )}
          <div className="flex w-full shrink-0 items-center justify-between gap-3 rounded-xl border bg-card px-3 py-1.5 text-sm text-muted-foreground" style={{ width: "var(--board)" }}>
            <span>{t("movesLabel")}: <span className="font-display text-foreground">{murderer && !won ? plan.length : moves}</span></span>
            <span className="min-w-0 flex-1 truncate text-center">{msg}</span>
            <span className="flex items-center gap-1"><Timer className="h-4 w-4" /><span className="font-display text-foreground">{clock}</span></span>
          </div>
        </section>

        <aside className="panel" style={{ gridArea: "cars" }}>
          <h2 className="panel-title">{t("cars")}</h2>
          <div className="grid grid-cols-4 gap-2">{standard.map(carBtn)}</div>
          {trucks.length > 0 && (
            <>
              <h2 className="panel-title mt-2">{t("trucks")}</h2>
              <div className="grid grid-cols-2 gap-2">{trucks.map(carBtn)}</div>
            </>
          )}
        </aside>
      </div>

      {/* דיאלוג בחירת השלבים */}
      {levelsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={() => setLevelsOpen(false)}>
          <div className="panel flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden p-0" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
              <h2 className="font-display text-xl font-bold">{t("chooseLevel")}</h2>
              <button aria-label={t("close")} onClick={() => setLevelsOpen(false)} className="chip"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
              {TIERS.map((tier, tierIdx) => {
                const unlocked = isTierUnlocked(tierIdx, puzzles, progress);
                const solvedCount = getSolvesCountInTier(tier, puzzles, progress);
                const tierItems = getPuzzlesForTier(tier, puzzles);

                if (tierItems.length === 0) return null;
                const isCollapsed = !!collapsedTiers[tier.id];

                return (
                  <div key={tier.id} className="rounded-lg border bg-card p-3">
                    <button
                      onClick={() => toggleTier(tier.id)}
                      className="flex w-full items-center justify-between text-start transition-colors hover:opacity-80"
                    >
                      <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                        {!unlocked ? (
                          <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                        <span>{t(tierIdx === TIERS.length - 1 ? "tierTitleLast" : "tierTitle", { n: tierIdx + 1, min: tier.minPar, max: tier.maxPar })}</span>
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {unlocked
                          ? t("tierSolved", { a: solvedCount, b: tierItems.length })
                          : t("tierLocked", { n: Math.max(0, tier.requiredSolvesToNext - getSolvesCountInTier(TIERS[tierIdx - 1]!, puzzles, progress)) })}
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div className="grid grid-cols-5 gap-2 mt-3 pt-2 border-t border-border/50">
                        {tierItems.map(({ originalIdx, tierLevelNum }) => {
                          const done = (progress[originalIdx]?.stars ?? 0) > 0;
                          const starCount = progress[originalIdx]?.stars ?? 0;
                          const bestSecs = progress[originalIdx]?.bestTime;

                          return (
                            <button
                              key={`${tier.id}_${tierLevelNum}`}
                              disabled={!unlocked}
                              onClick={() => jumpTo(originalIdx)}
                              data-active={originalIdx === idx}
                              className="ctrl relative font-display disabled:opacity-40 flex flex-col items-center justify-center p-2 min-h-[4rem]"
                            >
                              {!unlocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : tierLevelNum}
                              {done && <CheckCircle2 className="absolute -right-1 -top-1 h-4 w-4 text-primary" />}
                              
                              {unlocked && starCount > 0 && (
                                <div className="flex gap-0.5 mt-1">
                                  {[1, 2, 3].map((s) => (
                                    <Star key={s} className={`h-2.5 w-2.5 ${s <= starCount ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
                                  ))}
                                </div>
                              )}

                              {unlocked && done && bestSecs !== undefined && (
                                <span className="mt-0.5 text-[10px] text-muted-foreground font-display font-semibold">
                                  {formatTime(bestSecs)}
                                </span>
                              )}
                            </button>
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
    </main>
  );
}
