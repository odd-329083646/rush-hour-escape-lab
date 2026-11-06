import { useEffect, useState } from "react";
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

export function DailyGame({ date }: { date: string }) {
  const [start, setStart] = useState<Car[]>([]);
  const [par, setPar] = useState(0);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [steps, setSteps] = useState(1);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [moves, setMoves] = useState(0);
  const [bumps, setBumps] = useState(0);
  const [warn, setWarn] = useState<string | null>(null);
  const [result, setResult] = useState<{ time: number; best: number | null; isRecord: boolean } | null>(null);
  const [calOpen, setCalOpen] = useState(false);

  const reset = (cs: Car[]) => {
    setCars(cs); setSel(null); setHidden(new Set()); setStartedAt(null);
    setMoves(0); setBumps(0); setResult(null); setWarn(null);
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
    if (!startedAt || result) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [startedAt, result]);

  const elapsed = startedAt ? Math.floor(((result ? startedAt + result.time * 1000 : now) - startedAt) / 1000) : 0;
  const started = startedAt !== null;

  const flash = (t: string) => { setWarn(t); setTimeout(() => setWarn((w) => (w === t ? null : w)), 1600); };

  const blockerOf = (c: Car, m: Move): string | undefined => {
    const d = m === "right" || m === "down" ? 1 : -1;
    const front = d > 0 ? c.len : -1;
    const [r, col] = c.dir === "h" ? [c.row, c.col + front] : [c.row + front, c.col];
    for (let s = 0; s < steps; s++) {
      const rr = c.dir === "h" ? r : r + s * d, cc = c.dir === "h" ? col + s * d : col;
      const hit = cars.find((o) => o.id !== c.id && cells(o).some(([a, b]) => a === rr && b === cc));
      if (hit) return hit.id;
    }
  };

  const go = async (m: Move) => {
    if (!sel || result) return flash("Select a car first");
    const c = cars.find((x) => x.id === sel)!;
    const r = applyMove(cars, sel, m, steps);
    if (r.error) {
      const b = r.error.startsWith("Blocked") ? blockerOf(c, m) : undefined;
      if (b && hidden.has(b)) { setBumps((n) => n + 1); return flash("Bumped into an invisible car!"); }
      return flash(r.error);
    }
    setCars(r.cars); setMoves((n) => n + 1);
    if (isSolved(r.cars)) {
      const time = Math.max(1, Math.round((Date.now() - startedAt!) / 1000));
      const name = localStorage.getItem("player_name") || "Player";
      const res = await submitScore({ date, solve_time: time, player_name: name });
      setResult({ time, ...res });
    }
  };

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
                    <Button variant="ghost" key={m} aria-label={m} onClick={() => go(m)} className={`ctrl ${cls}`}><Icon className="h-5 w-5" /></Button>
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
              <button
                key={c.id}
                onClick={() => started && setSel(c.id)}
                data-selected={sel === c.id}
                data-hidden={hidden.has(c.id)}
                data-escaping={!!result && c.id === "X"}
                aria-label={hidden.has(c.id) ? "Hidden car" : c.name}
                className="car"
                style={{
                  background: c.color,
                  gridRow: `${c.row + 1} / span ${c.dir === "v" ? c.len : 1}`,
                  gridColumn: `${c.col + 1} / span ${c.dir === "h" ? c.len : 1}`,
                }}
              />
            ))}
          </div>
          <div className="flex w-full items-center justify-between gap-3 text-sm" style={{ maxWidth: "var(--board)" }}>
            <span>Moves <b className="font-display">{moves}</b> <span className="text-muted-foreground">/ par {par}</span></span>
            <span className="font-display">{fmtTime(elapsed)}</span>
            <span>Bumps <b className="font-display">{bumps}</b></span>
          </div>
        </section>

        <aside className="panel text-sm" style={{ gridArea: "cars" }}>
          <h2 className="panel-title">Today's lot</h2>
          <p className="text-muted-foreground">Half the cars vanish when you start — they still block. Tap a car, pick steps, then an arrow.</p>
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
              {result.best != null && !result.isRecord && <> · best {fmtTime(result.best)}</>}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="ghost" className="chip" onClick={() => reset(start)}>Play again · שחק שוב</Button>
              <Button variant="ghost" className="chip" onClick={() => setCalOpen(true)}><CalendarDays className="h-4 w-4" /> Calendar</Button>
            </div>
          </div>
        </div>
      )}
      <DailyCalendar open={calOpen} onClose={() => setCalOpen(false)} current={date} />
    </main>
  );
}
