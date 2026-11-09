import { useDailyGame } from "@/hooks/useDailyGame";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarDays, Coins, Home, Lightbulb, Play, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsButton } from "@/components/settings-dialog";
import { HintSelection } from "@/components/hint-selection";
import { DailyCalendar } from "./daily-calendar";
import { getCoins, pickHidden, type Car, type Move } from "@/lib/puzzles";
import { fmtTime } from "@/lib/daily-scores";

const DIRS: { m: Move; Icon: typeof ArrowUp; cls: string }[] = [
  { m: "up", Icon: ArrowUp, cls: "col-start-2 row-start-1" },
  { m: "left", Icon: ArrowLeft, cls: "col-start-1 row-start-2" },
  { m: "right", Icon: ArrowRight, cls: "col-start-3 row-start-2" },
  { m: "down", Icon: ArrowDown, cls: "col-start-2 row-start-3" },
];
const ARROW: Record<Move, string> = { up: "↑", down: "↓", left: "←", right: "→" };

export function DailyGame({ date, openCalendar = false }: { date: string; openCalendar?: boolean }) {
  const { t, start, par, cars, moves, setStartedAt, now, setNow, loading, sel, setSel, steps, setSteps, move, setMove, hidden, setHidden, bumps, warn, coins, setCoins, result, hints, boardCars, calOpen, setCalOpen, dragStart, drag, setDrag, failed, reset, elapsed, started, useHint, execute, handlePointerDown, handlePointerMove, handlePointerUp, label } = useDailyGame({ date, openCalendar });
  const carBtn = (c: Car) => (
    <Button variant="ghost" key={c.id} onClick={() => setSel(c.id)} data-active={sel === c.id}
      title={c.name} aria-label={`Select ${c.id} · ${c.name}`} disabled={!started || !!result} className="palette-cell h-auto">
      <span className={`h-3 rounded-sm ${c.len === 3 ? "w-10" : "w-6"}`} style={{ background: c.color }} />
      <span className="text-xs">{c.id} {c.dir === "h" ? "↔" : "↕"}</span>
    </Button>
  );

  return (
    <main className="lot-bg flex h-dvh flex-col gap-2 overflow-hidden px-2 py-2 sm:px-4">
      <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-2">
        <Button asChild variant="ghost" className="chip px-2 sm:px-3.5"><Link to="/" aria-label={t("backHome")}><Home className="h-4 w-4" /><span className="hidden sm:inline">{t("backHome")}</span></Link></Button>
        <h1 className="min-w-0 truncate font-display text-sm font-bold md:text-xl">{t("daily")} <span className="text-muted-foreground">· {label}</span></h1>
        
        <div className="flex shrink-0 items-center gap-2">
          {/* מאזן מטבעות */}
          <div className="chip font-display flex items-center gap-1.5 px-2.5 py-1 text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-full" title={t("coins")}>
            <Coins className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="font-bold">{coins}</span>
          </div>

          <Button variant="ghost" className="chip px-2 sm:px-3.5" onClick={() => setCalOpen(true)} aria-label={t("calendar")}><CalendarDays className="h-4 w-4" /><span className="hidden sm:inline">{t("calendar")}</span></Button>
          <Button variant="ghost" className="chip px-2 sm:px-3.5" onClick={() => reset(start)} aria-label={t("reset")}><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">{t("reset")}</span></Button>
          <SettingsButton />
        </div>
      </header>

      <HintSelection open={hints.open} onOpenChange={hints.setOpen} level="medium" cars={cars} hidden={hidden} coins={coins} onUse={useHint} />
      <div className="game-grid">
        <aside className="panel flex flex-col gap-2" style={{ gridArea: "ctrl" }}>
          {!started ? (
            <Button disabled={loading} onClick={() => { setHidden(pickHidden(cars, "medium")); setStartedAt(Date.now()); setNow(Date.now()); }} className="execute start-control whitespace-normal">
              <Play className="h-4 w-4" /><span>{t("startSolving")}</span>
            </Button>
          ) : (
            <div className="solving-controls flex flex-col gap-2">
              <div>
                <h2 className="panel-title">{t("direction")}</h2>
                <div className="grid grid-cols-3 grid-rows-3 gap-2">
                  {DIRS.map(({ m, Icon, cls }) => (
                    <Button variant="ghost" key={m} aria-label={m} data-active={move === m} onClick={() => setMove(m)} className={`ctrl ${cls}`}><Icon className="h-5 w-5" /></Button>
                  ))}

                  {/* כפתור רמז במרכז החיצים (שורה 2, עמודה 2) */}
                  <Button
                    onClick={() => { setCoins(getCoins()); hints.setOpen(true); }}
                    variant="outline"
                    disabled={!started || !!result || failed || hints.peek}
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
                    <Button variant="ghost" key={n} onClick={() => setSteps(n)} data-active={steps === n} className="ctrl px-0 font-display">{n}</Button>
                  ))}
                </div>
              </div>

              {/* כפתור בצע */}
              <Button onClick={execute} disabled={!started || !!result || failed} className="execute mt-1">
                <Play className="h-4 w-4 shrink-0" />
                <span>{t("execute")}</span>
              </Button>
            </div>
          )}
        </aside>

        <section className="flex min-h-0 flex-col items-center gap-2" style={{ gridArea: "board" }}>
          <div className="board">
            {warn && <div className="warn" role="alert">{warn}</div>}
            {Array.from({ length: 36 }).map((_, i) => <div key={i} className="cell" style={{ gridRow: Math.floor(i / 6) + 1, gridColumn: (i % 6) + 1 }} />)}
            <div className="exit" />
            {boardCars.map((c) => (
              <Button variant="ghost"
                key={c.id}
                draggable={false}
                onClick={() => started && !result && setSel(c.id)}
                onPointerDown={(e) => handlePointerDown(c, e)}
                onPointerMove={(e) => handlePointerMove(c, e)}
                onPointerUp={(e) => handlePointerUp(c, e)}
                onPointerCancel={() => { dragStart.current = null; setDrag(null); }}
                onLostPointerCapture={() => { dragStart.current = null; setDrag(null); }}
                data-selected={sel === c.id}
                data-hidden={hidden.has(c.id) && !hints.peek}
                data-escaping={!!result && c.id === "X"}
                aria-label={hidden.has(c.id) && !hints.peek ? t("hiddenCar") : c.name}
                className="car h-auto min-w-0 touch-none select-none p-0 hover:bg-transparent"
                style={{
                  background: c.color,
                  gridRow: `${c.row + 1} / span ${c.dir === "v" ? c.len : 1}`,
                  gridColumn: `${c.col + 1} / span ${c.dir === "h" ? c.len : 1}`,
                  transform: drag?.id === c.id ? (c.dir === "h" ? `translate(${drag.offset}px, 0)` : `translate(0, ${drag.offset}px)`) : undefined,
                  transition: drag?.id === c.id ? "none" : undefined,
                  zIndex: drag?.id === c.id ? 5 : undefined,
                }}
              >{c.id}</Button>
            ))}
          </div>
          <div className="flex w-full items-center justify-between gap-3 text-sm" style={{ maxWidth: "var(--board)" }}>
            <span>{t("movesLabel")} <b className="font-display">{moves}</b> <span className="text-muted-foreground">/ {t("par", { n: par })}</span></span>
            <span className="font-display">{fmtTime(elapsed)}</span>
            <span>{t("bumps")} <b className="font-display">{bumps}</b></span>
          </div>
        </section>

        <aside className="panel" style={{ gridArea: "cars" }}>
          <h2 className="panel-title">{t("cars")}</h2>
          <div className="grid grid-cols-4 gap-2">{cars.filter((c) => c.len === 2).map(carBtn)}</div>
          {cars.some((c) => c.len === 3) && <>
            <h2 className="panel-title mt-2">{t("trucks")}</h2>
            <div className="grid grid-cols-2 gap-2">{cars.filter((c) => c.len === 3).map(carBtn)}</div>
          </>}
        </aside>
      </div>

      {result && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 p-4 backdrop-blur">
          <div className="panel max-w-sm text-center" role="dialog" aria-label="Result">
            <Trophy className="mx-auto mb-2 h-10 w-10 text-primary" />
            <h2 className="font-display text-2xl font-bold">
              {result.isRecord ? t("newRecord") : t("solved")}
            </h2>
            <div className="mt-2 flex flex-col items-center text-muted-foreground">
              <span>{t("statMoves", { n: moves })}</span>
              <span>{t("statTime", { t: fmtTime(result.time) })}</span>
              <span>{t("statPar", { n: par })}</span>
            </div>
            {!result.isRecord && <p className="mt-1 text-sm">{t("yourVsBest", { time: fmtTime(result.time), best: result.best != null ? fmtTime(result.best) : "—" })}</p>}
            
            {/* פירוט המטבעות שהורווחו */}
            <div className="mt-3 flex justify-center">
              {result.coinsEarned > 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-400">
                  <Coins className="h-4 w-4 fill-amber-400" />
                  <span>{t("coinsEarned", { n: result.coinsEarned })} {result.isRecord ? t("recordBonus") : ""}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">{t("replayNoCoins")}</span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="ghost" className="chip" onClick={() => reset(start)}>{t("playAgain")}</Button>
              <Button variant="ghost" className="chip" onClick={() => setCalOpen(true)}><CalendarDays className="h-4 w-4" /> {t("calendar")}</Button>
              <Button asChild variant="ghost" className="chip"><Link to="/"><Home className="h-4 w-4" /> {t("home")}</Link></Button>
            </div>
          </div>
        </div>
      )}
      {failed && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 p-4 backdrop-blur">
          <div className="panel max-w-sm text-center" role="dialog" aria-label="Game over">
            <h2 className="font-display text-2xl font-bold">{t("gameOver")}</h2>
            <p className="mt-2 text-muted-foreground">{t("bumped3Daily")}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="ghost" className="chip" onClick={() => reset(start)}><RotateCcw className="h-4 w-4" /> {t("tryAgain")}</Button>
              <Button asChild variant="ghost" className="chip"><Link to="/"><Home className="h-4 w-4" /> {t("home")}</Link></Button>
            </div>
          </div>
        </div>
      )}
      <DailyCalendar open={calOpen} onClose={() => setCalOpen(false)} current={date} />
    </main>
  );
}
