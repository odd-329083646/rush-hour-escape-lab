import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarDays, Home, Play, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DailyCalendar } from "./daily-calendar";
import { applyMove, cells, getDailyPuzzleAsync, isSolved, pickHidden, type Car, type Move } from "@/lib/puzzles";
import { fmtTime, submitScore } from "@/lib/daily-scores";

const DIRS: { m: Move; Icon: typeof ArrowUp; cls: string }[] = [
  { m: "up", Icon: ArrowUp, cls: "col-start-2" },
  { m: "left", Icon: ArrowLeft, cls: "col-start-1 row-start-2" },
  { m: "right", Icon: ArrowRight, cls: "col-start-3 row-start-2" },
  { m: "down", Icon: ArrowDown, cls: "col-start-2 row-start-3" },
];

export function DailyGame({ date, openCalendar = false }: { date: string; openCalendar?: boolean }) {
  const [start, setStart] = useState<Car[]>([]);
  const [par, setPar] = useState(0);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [steps, setSteps] = useState(1);
  const [move, setMove] = useState<Move | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [moves, setMoves] = useState(0);
  const [bumps, setBumps] = useState(0);
  const [warn, setWarn] = useState<string | null>(null);
  const [result, setResult] = useState<{ time: number; best: number | null; isRecord: boolean } | null>(null);
  const [calOpen, setCalOpen] = useState(openCalendar);
  const dragStart = useRef<{ id: string; pointerId: number; x: number; y: number; pitch: number; min: number; max: number } | null>(null);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  const submitting = useRef(false);

  const reset = (cs: Car[]) => {
    setCars(cs); setSel(null); setHidden(new Set()); setStartedAt(null);
    setMoves(0); setBumps(0); setResult(null); setWarn(null);
    setMove(null); setSteps(1); setDrag(null); dragStart.current = null; submitting.current = false;
  };

  useEffect(() => {
    let live = true;
    setLoading(true);
    getDailyPuzzleAsync(date).then((p) => {
      if (!live) return;
      setStart(p.cars); setPar(p.par); reset(p.cars); setLoading(false);
    });
    return () => { live = false; };
  }, [date]);

  useEffect(() => {
    if (!startedAt || result || failed) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [startedAt, result, failed]);

  const failed = bumps >= 3 && !result;
  const elapsed = startedAt ? Math.floor(((result ? startedAt + result.time * 1000 : now) - startedAt) / 1000) : 0;
  const started = startedAt !== null;

  const flash = useCallback((t: string) => { setWarn(t); setTimeout(() => setWarn((w) => (w === t ? null : w)), 1600); }, []);

  const blockerOf = useCallback((c: Car, m: Move, count: number): string | undefined => {
    const d = m === "right" || m === "down" ? 1 : -1;
    const front = d > 0 ? c.len : -1;
    const [r, col] = c.dir === "h" ? [c.row, c.col + front] : [c.row + front, c.col];
    for (let s = 0; s < count; s++) {
      const rr = c.dir === "h" ? r : r + s * d, cc = c.dir === "h" ? col + s * d : col;
      const hit = cars.find((o) => o.id !== c.id && cells(o).some(([a, b]) => a === rr && b === cc));
      if (hit) return hit.id;
    }
    return undefined;
  }, [cars]);

  const go = useCallback(async (m: Move, id = sel, count = steps) => {
    if (startedAt === null || result || failed || submitting.current) return;
    const c = cars.find((x) => x.id === id);
    if (!c) return flash("Select a car first");
    const r = applyMove(cars, c.id, m, count);
    if (r.error) {
      const b = r.error.startsWith("Blocked") ? blockerOf(c, m, count) : undefined;
      if (b && hidden.has(b)) { setBumps((n) => n + 1); return flash("Bumped into an invisible car!"); }
      return flash(r.error);
    }
    setCars(r.cars); setMoves((n) => n + 1); setWarn(null);
    if (isSolved(r.cars)) {
      submitting.current = true;
      const time = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const name = localStorage.getItem("player_name") || "Player";
      const res = await submitScore({ date, solve_time: time, player_name: name });
      setResult({ time, ...res });
    }
  }, [sel, steps, startedAt, result, failed, cars, blockerOf, hidden, flash, date]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat || calOpen || result || failed || !started || submitting.current) return;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [role='dialog']"))) return;
      const char = e.code.startsWith("Key") ? e.code.slice(3) : e.key.toUpperCase();
      if (cars.some((c) => c.id === char)) { e.preventDefault(); setSel(char); return; }
      if (["1", "2", "3", "4"].includes(e.key)) { e.preventDefault(); setSteps(Number(e.key)); return; }
      const arrows: Record<string, Move> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      const direction = arrows[e.key];
      if (direction) { e.preventDefault(); setMove(direction); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        if (move) void go(move); else flash("Select a direction first");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cars, calOpen, result, failed, started, move, go, flash]);

  const handlePointerDown = (c: Car, e: PointerEvent<HTMLButtonElement>) => {
    if (!started || result || failed || calOpen || submitting.current || !e.isPrimary || e.button !== 0 || dragStart.current) return;
    const board = e.currentTarget.parentElement;
    const cell = board?.querySelector(".cell");
    if (!board || !cell) return;
    const pitch = cell.getBoundingClientRect().width + (parseFloat(getComputedStyle(board).columnGap) || 0);
    if (pitch <= 0) return;
    let back = 0, fwd = 0;
    // Use the existing move validator for both visible and invisible obstacles.
    for (let n = 1; n <= 4; n++) {
      if (applyMove(cars, c.id, c.dir === "h" ? "left" : "up", n).error) break;
      back = n;
    }
    for (let n = 1; n <= 4; n++) {
      if (applyMove(cars, c.id, c.dir === "h" ? "right" : "down", n).error) break;
      fwd = n;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setSel(c.id);
    dragStart.current = { id: c.id, pointerId: e.pointerId, x: e.clientX, y: e.clientY, pitch, min: -back * pitch, max: fwd * pitch };
  };

  const handlePointerMove = (c: Car, e: PointerEvent<HTMLButtonElement>) => {
    const d = dragStart.current;
    if (!d || d.id !== c.id || d.pointerId !== e.pointerId) return;
    const raw = c.dir === "h" ? e.clientX - d.x : e.clientY - d.y;
    setDrag({ id: c.id, offset: Math.max(d.min, Math.min(d.max, raw)) });
  };

  const handlePointerUp = (c: Car, e: PointerEvent<HTMLButtonElement>) => {
    const d = dragStart.current;
    if (!d || d.id !== c.id || d.pointerId !== e.pointerId) return;
    dragStart.current = null; setDrag(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    const raw = c.dir === "h" ? e.clientX - d.x : e.clientY - d.y;
    const offset = Math.max(d.min, Math.min(d.max, raw));
    const count = Math.round(offset / d.pitch);
    const direction: Move = c.dir === "h" ? (raw > 0 ? "right" : "left") : (raw > 0 ? "down" : "up");
    if (Math.abs(raw - offset) > 20) {
      const blocker = blockerOf(c, direction, Math.abs(count) + 1);
      if (blocker && hidden.has(blocker)) { setBumps((n) => n + 1); flash("Bumped into an invisible car!"); }
    }
    if (!count) return;
    setMove(direction); setSteps(Math.abs(count));
    void go(direction, c.id, Math.abs(count));
  };

  const carBtn = (c: Car) => (
    <Button variant="ghost" key={c.id} onClick={() => setSel(c.id)} data-active={sel === c.id}
      title={c.name} aria-label={`Select ${c.id} · ${c.name}`} disabled={!started || !!result} className="palette-cell h-auto">
      <span className={`h-3 rounded-sm ${c.len === 3 ? "w-10" : "w-6"}`} style={{ background: c.color }} />
      <span className="text-xs">{c.id} {c.dir === "h" ? "↔" : "↕"}</span>
    </Button>
  );

  const label = new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="lot-bg flex h-dvh flex-col gap-2 overflow-hidden px-2 py-2 sm:px-4">
      <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-2">
        <Button asChild variant="ghost" className="chip px-2 sm:px-3.5"><Link to="/" aria-label="Back to Home"><Home className="h-4 w-4" /><span className="hidden sm:inline">Back to Home</span></Link></Button>
        <h1 className="min-w-0 truncate font-display text-sm font-bold md:text-xl">Daily · משחק יומי <span className="text-muted-foreground">· {label}</span></h1>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" className="chip px-2 sm:px-3.5" onClick={() => setCalOpen(true)} aria-label="Calendar · לוח שנה"><CalendarDays className="h-4 w-4" /><span className="hidden sm:inline">Calendar · לוח שנה</span></Button>
          <Button variant="ghost" className="chip px-2 sm:px-3.5" onClick={() => reset(start)} aria-label="Reset"><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Reset</span></Button>
        </div>
      </header>

      <div className="game-grid">
        <aside className="panel flex flex-col gap-2" style={{ gridArea: "ctrl" }}>
          {!started ? (
            <Button disabled={loading} onClick={() => { setHidden(pickHidden(cars, "medium")); setStartedAt(Date.now()); setNow(Date.now()); }} className="execute start-control whitespace-normal">
              <Play className="h-4 w-4" /><span>Start Solving · התחל פתירה</span>
            </Button>
          ) : (
            <div className="solving-controls flex flex-col gap-2">
              <div>
                <h2 className="panel-title">Direction</h2>
                <div className="grid grid-cols-3 grid-rows-3 gap-2">
                  {DIRS.map(({ m, Icon, cls }) => (
                    <Button variant="ghost" key={m} aria-label={m} data-active={move === m} onClick={() => { setMove(m); void go(m); }} className={`ctrl ${cls}`}><Icon className="h-5 w-5" /></Button>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="panel-title">Steps</h2>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <Button variant="ghost" key={n} onClick={() => setSteps(n)} data-active={steps === n} className="ctrl px-0 font-display">{n}</Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>

        <section className="flex min-h-0 flex-col items-center gap-2" style={{ gridArea: "board" }}>
          <div className="board">
            {warn && <div className="warn" role="alert">{warn}</div>}
            {Array.from({ length: 36 }).map((_, i) => <div key={i} className="cell" style={{ gridRow: Math.floor(i / 6) + 1, gridColumn: (i % 6) + 1 }} />)}
            <div className="exit" />
            {cars.map((c) => (
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
                data-hidden={hidden.has(c.id)}
                data-escaping={!!result && c.id === "X"}
                aria-label={hidden.has(c.id) ? "Hidden car" : c.name}
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
            <span>Moves <b className="font-display">{moves}</b> <span className="text-muted-foreground">/ par {par}</span></span>
            <span className="font-display">{fmtTime(elapsed)}</span>
            <span>Bumps <b className="font-display">{bumps}</b></span>
          </div>
        </section>

        <aside className="panel" style={{ gridArea: "cars" }}>
          <h2 className="panel-title">Cars</h2>
          <div className="grid grid-cols-4 gap-2">{cars.filter((c) => c.len === 2).map(carBtn)}</div>
          {cars.some((c) => c.len === 3) && <>
            <h2 className="panel-title mt-2">Trucks</h2>
            <div className="grid grid-cols-2 gap-2">{cars.filter((c) => c.len === 3).map(carBtn)}</div>
          </>}
        </aside>
      </div>

      {result && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 p-4 backdrop-blur">
          <div className="panel max-w-sm text-center" role="dialog" aria-label="Result">
            <Trophy className="mx-auto mb-2 h-10 w-10 text-primary" />
            <h2 className="font-display text-2xl font-bold">
              {result.isRecord ? "New World Record! · שיא עולמי חדש!" : "Solved! · נפתר!"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {fmtTime(result.time)} · {moves} moves · {bumps} bumps
              </p>
            {!result.isRecord && <p className="mt-1 text-sm">Your time {fmtTime(result.time)} · World best {result.best != null ? fmtTime(result.best) : "—"}</p>}
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="ghost" className="chip" onClick={() => reset(start)}>Play again · שחק שוב</Button>
              <Button variant="ghost" className="chip" onClick={() => setCalOpen(true)}><CalendarDays className="h-4 w-4" /> Calendar</Button>
            </div>
          </div>
        </div>
      )}
      {failed && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 p-4 backdrop-blur">
          <div className="panel max-w-sm text-center" role="dialog" aria-label="Game over">
            <h2 className="font-display text-2xl font-bold">Game over · המשחק נגמר</h2>
            <p className="mt-2 text-muted-foreground">You bumped into invisible cars 3 times.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="ghost" className="chip" onClick={() => reset(start)}><RotateCcw className="h-4 w-4" /> Try again · נסה שוב</Button>
            </div>
          </div>
        </div>
      )}
      <DailyCalendar open={calOpen} onClose={() => setCalOpen(false)} current={date} />
    </main>
  );
}
