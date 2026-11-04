import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Eye, EyeOff, Home, Layers, Lock, Play, Plus, RotateCcw, Send, Timer, Trash2, Trophy, X } from "lucide-react";
import { applyMove, isSolved, LEVELS, pickHidden, runPlan, DEFAULT_PUZZLES, loadPuzzlesAsync, type Car, type Level, type Move } from "@/lib/puzzles";
import { Button } from "@/components/ui/button";

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
  { m: "up", Icon: ArrowUp, cls: "col-start-2" },
  { m: "left", Icon: ArrowLeft, cls: "col-start-1 row-start-2" },
  { m: "right", Icon: ArrowRight, cls: "col-start-3 row-start-2" },
  { m: "down", Icon: ArrowDown, cls: "col-start-2 row-start-3" },
];
const ARROW: Record<Move, string> = { up: "↑", down: "↓", left: "←", right: "→" };
type Planned = { id: string; move: Move; steps: number };

function Game() {
  const { level } = Route.useParams() as { level: Level };
  const cfg = LEVELS[level];
  const murderer = level === "murderer";
  const idxKey = `rush_hour_puzzle_index_${level}`;
  const maxKey = `rush_hour_max_solved_${level}`;

  const [puzzles, setPuzzles] = useState(DEFAULT_PUZZLES);
  const [idx, setIdx] = useState(0);
  const [maxSolved, setMaxSolved] = useState(-1);
  const puzzle = puzzles[idx] ?? puzzles[0] ?? { par: 0, cars: [] as Car[] };
  const [cars, setCars] = useState<Car[]>(puzzle?.cars ?? []);
  const [sel, setSel] = useState<string | null>(null);
  const [move, setMove] = useState<Move | null>(null);
  const [steps, setSteps] = useState(1);
  const [moves, setMoves] = useState(0);
  const [msg, setMsg] = useState("Study the lot, then press Start Solving");
  const [warn, setWarn] = useState<{ text: string; key: number } | null>(null);
  const [started, setStarted] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [reveal, setReveal] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [wonAt, setWonAt] = useState<number | null>(null);
  const [plan, setPlan] = useState<Planned[]>([]);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [invisibleBumps, setInvisibleBumps] = useState(0);

  const won = wonAt !== null;
  const elapsed = startedAt ? Math.floor(((wonAt ?? now) - startedAt) / 1000) : 0;
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

  const loadPuzzle = (i: number, currentPuzzles = puzzles) => {
    const p = currentPuzzles[i] ?? currentPuzzles[0];
    if (!p) return;
    setIdx(currentPuzzles.indexOf(p));
    setCars(p.cars);
    setSel(null); setMove(null); setSteps(1); setMoves(0);
    setMsg("Study the lot, then press Start Solving");
    setWarn(null); setStarted(false); setHidden(new Set()); setReveal(false);
    setStartedAt(null); setWonAt(null); setPlan([]); setFailed(false); setSimulating(false);
    setInvisibleBumps(0);
  };

  useEffect(() => {
    let alive = true;
    loadPuzzlesAsync().then((loadedPuzzles) => {
      if (!alive) return;
      const finalPuzzles = loadedPuzzles.length > 1 ? loadedPuzzles : DEFAULT_PUZZLES;
      setPuzzles(finalPuzzles);
      const saved = parseInt(localStorage.getItem(idxKey) ?? "0", 10) || 0;
      const i = Math.max(0, Math.min(saved, finalPuzzles.length - 1));
      setMaxSolved(Number.isFinite(parseInt(localStorage.getItem(maxKey) ?? "", 10)) ? parseInt(localStorage.getItem(maxKey)!, 10) : -1);
      loadPuzzle(i, finalPuzzles);
    }).catch(() => {
      if (!alive) return;
      setPuzzles(DEFAULT_PUZZLES);
      const saved = parseInt(localStorage.getItem(idxKey) ?? "0", 10) || 0;
      const i = Math.max(0, Math.min(saved, DEFAULT_PUZZLES.length - 1));
      setMaxSolved(Number.isFinite(parseInt(localStorage.getItem(maxKey) ?? "", 10)) ? parseInt(localStorage.getItem(maxKey)!, 10) : -1);
      loadPuzzle(i, DEFAULT_PUZZLES);
    });
    return () => { alive = false; };
  }, [level]);

  useEffect(() => {
    if (!startedAt || won) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [startedAt, won]);

  const markWon = () => {
    setWonAt(Date.now()); setMsg("Solved!"); setSel(null);
    if (idx > maxSolved) { setMaxSolved(idx); localStorage.setItem(maxKey, String(idx)); }
  };

  const jumpTo = (i: number) => {
    localStorage.setItem(idxKey, String(i));
    loadPuzzle(i);
    setLevelsOpen(false);
  };

  const start = () => {
    setHidden(pickHidden(cars, level));
    setStarted(true);
    setStartedAt(Date.now());
    setMsg(murderer ? "Board hidden — plan every move, then submit." : level === "hard" ? "All cars vanished. Good luck!" : level === "medium" ? "Some cars vanished — they still block!" : "Clock's running — free the red car!");
  };

  const flash = (text: string) => {
    const key = Date.now();
    setWarn({ text, key });
    setTimeout(() => setWarn((w) => (w?.key === key ? null : w)), 1800);
  };

  const checkInvisibleBump = (c: Car, moveDir: Move, attemptedSteps: number) => {
    if (level !== "medium" && level !== "hard") return false;
    
    const occ = new Map<string, string>();
    for (const o of cars) {
      if (o.id === c.id) continue;
      for (let k = 0; k < o.len; k++) {
        occ.set(o.dir === "h" ? `${o.row},${o.col + k}` : `${o.row + k},${o.col}`, o.id);
      }
    }

    let r = c.row;
    let col = c.col;
    for (let s = 1; s <= attemptedSteps; s++) {
      if (moveDir === "up") r--;
      else if (moveDir === "down") r++;
      else if (moveDir === "left") col--;
      else if (moveDir === "right") col++;
      
      for (let k = 0; k < c.len; k++) {
         const cell = c.dir === "h" ? `${r},${col + k}` : `${r + k},${col}`;
         if (occ.has(cell)) {
            const blockerId = occ.get(cell)!;
            if (hidden.has(blockerId) && !reveal) {
               return true; 
            }
            return false;
         }
      }
    }
    return false;
  };

  const execute = () => {
    if (!started) return flash("Press Start Solving first");
    if (!sel) return flash("Select a car first");
    if (!move) return flash("Choose a direction");
    if (murderer) { setPlan((p) => [...p, { id: sel, move, steps }]); return; }

    const c = cars.find((x) => x.id === sel);
    if (c && checkInvisibleBump(c, move, steps)) {
      const newBumps = invisibleBumps + 1;
      setInvisibleBumps(newBumps);
      if (newBumps >= 3) {
        setFailed(true);
      } else {
        flash(`נחסמת על ידי מכונית בלתי נראית! (ניסיון ${newBumps} מתוך 3)`);
      }
      return;
    }

    const r = applyMove(cars, sel, move, steps);
    if (r.error) return flash(r.error);
    setCars(r.cars); setMoves((n) => n + 1); setWarn(null);
    if (isSolved(r.cars)) markWon(); else setMsg("Moved!");
  };

  const submitPlan = async () => {
    if (simulating) return;
    if (!plan.length) return flash("Add some moves first");
    
    setSimulating(true);
    setHidden(new Set());
    setMsg("Simulating moves... · מדמה מהלכים...");

    let currentCars = [...cars];

    for (let i = 0; i < plan.length; i++) {
      const p = plan[i];
      const r = applyMove(currentCars, p.id, p.move, p.steps);
      
      if (r.error) {
        setFailed(true);
        setSimulating(false);
        return;
      }
      
      currentCars = r.cars;
      setCars(currentCars);
      setMoves(i + 1);
      
      await new Promise((res) => setTimeout(res, 700));
    }

    if (isSolved(currentCars)) {
      markWon();
    } else {
      setFailed(true);
    }
    setSimulating(false);
  };

  const finish = () => {
    if (isSolved(cars)) markWon();
    else flash("Not solved yet — the red car must reach the exit");
  };

  const isLast = idx >= puzzles.length - 1;
  const standard = cars.filter((c) => c.len === 2);
  const trucks = cars.filter((c) => c.len === 3);
  
  const showBoard = simulating || !(murderer && started && !won && !failed);

  const carBtn = (c: Car) => (
    <button key={c.id} onClick={() => setSel(c.id)} data-active={sel === c.id} title={c.name} className="palette-cell" disabled={simulating}>
      <span className="h-3 rounded-sm" style={{ background: c.color, width: c.len === 3 ? "2.5rem" : "1.5rem" }} />
      <span className="text-xs">{c.id} {c.dir === "h" ? "↔" : "↕"}</span>
    </button>
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || simulating) return;

      let char = e.key.toUpperCase();
      if (e.code.startsWith("Key")) char = e.code.replace("Key", "");

      const carExists = cars.some((c) => c.id === char);
      if (carExists) {
        setSel(char);
        return;
      }

      if (["1", "2", "3", "4"].includes(e.key)) {
        setSteps(parseInt(e.key, 10));
        return;
      }

      if (e.key === "ArrowUp") { e.preventDefault(); setMove("up"); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setMove("down"); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); setMove("left"); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); setMove("right"); return; }

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (murderer && started) submitPlan();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (!started) {
          start();
        } else if (murderer) {
          if (sel && move) {
            setPlan((p) => [...p, { id: sel, move, steps }]);
          } else {
            flash("Select a car and direction first");
          }
        } else {
          execute();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cars, sel, move, steps, started, murderer, plan, simulating, invisibleBumps]);

  const dragStart = useRef<{ id: string; x: number; y: number; pitch: number; min: number; max: number } | null>(null);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);

  const freeRange = (c: Car) => {
    const occ = new Set<string>();
    for (const o of cars) {
      if (o.id === c.id) continue;
      // כאן הוסר המעקף - כעת מכוניות נסתרות חוסמות את הגרירה ויזואלית כמו קיר מוצק
      for (let k = 0; k < o.len; k++) occ.add(o.dir === "h" ? `${o.row},${o.col + k}` : `${o.row + k},${o.col}`);
    }
    const free = (r: number, col: number) => r >= 0 && r < 6 && col >= 0 && col < 6 && !occ.has(`${r},${col}`);
    let back = 0, fwd = 0;
    if (c.dir === "h") {
      while (free(c.row, c.col - back - 1)) back++;
      while (free(c.row, c.col + c.len + fwd)) fwd++;
    } else {
      while (free(c.row - back - 1, c.col)) back++;
      while (free(c.row + c.len + fwd, c.col)) fwd++;
    }
    return { back, fwd };
  };

  const handlePointerDown = (c: Car, e: React.PointerEvent) => {
    if (simulating) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch (err) {}
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const gap = 6;
    const size = c.dir === "h" ? rect.width : rect.height;
    const pitch = (size + gap) / c.len;
    const { back, fwd } = started && !won ? freeRange(c) : { back: 0, fwd: 0 };
    dragStart.current = { id: c.id, x: e.clientX, y: e.clientY, pitch, min: -back * pitch, max: fwd * pitch };
  };

  const handlePointerMove = (c: Car, e: React.PointerEvent) => {
    if (simulating) return;
    const d = dragStart.current;
    if (!d || d.id !== c.id) return;
    const raw = c.dir === "h" ? e.clientX - d.x : e.clientY - d.y;
    const offset = Math.max(d.min, Math.min(d.max, raw));
    setDrag({ id: c.id, offset });
  };

  const handlePointerUp = (c: Car, e: React.PointerEvent) => {
    if (simulating) return;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
    const d = dragStart.current;
    dragStart.current = null;
    setDrag(null);
    if (!d || d.id !== c.id) return;

    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) { setSel(c.id); return; }
    if (!started) { flash("Press Start Solving first"); return; }

    setSel(c.id);
    const raw = c.dir === "h" ? dx : dy;
    const offset = Math.max(d.min, Math.min(d.max, raw));
    const cellsMoved = Math.round(offset / d.pitch);

    // בדיקה אם השחקן ניסה למשוך את המכונית בכוח לתוך "קיר" המכונית הבלתי נראית
    if ((raw > offset + 20 || raw < offset - 20) && (level === "medium" || level === "hard")) {
      const intendedDir: Move = c.dir === "h" ? (raw > 0 ? "right" : "left") : (raw > 0 ? "down" : "up");
      if (checkInvisibleBump(c, intendedDir, Math.abs(cellsMoved) + 1)) {
        const newBumps = invisibleBumps + 1;
        setInvisibleBumps(newBumps);
        if (newBumps >= 3) {
          setFailed(true);
          return;
        } else {
          flash(`נחסמת על ידי מכונית בלתי נראית! (ניסיון ${newBumps} מתוך 3)`);
        }
      }
    }

    if (cellsMoved === 0) return;
    const moveDir: Move = c.dir === "h" ? (cellsMoved > 0 ? "right" : "left") : (cellsMoved > 0 ? "down" : "up");
    const calculatedSteps = Math.abs(cellsMoved);
    setMove(moveDir);
    setSteps(Math.min(4, calculatedSteps));

    if (murderer) {
      setPlan((p) => [...p, { id: c.id, move: moveDir, steps: calculatedSteps }]);
      return;
    }

    const r = applyMove(cars, c.id, moveDir, calculatedSteps);
    if (r.error) return flash(r.error);
    setCars(r.cars);
    setMoves((n) => n + 1);
    setWarn(null);
    if (isSolved(r.cars)) markWon(); else setMsg("Moved!");
  };

  return (
    <main className="lot-bg flex h-dvh flex-col gap-2 overflow-hidden px-2 py-2 sm:px-4">
      <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-2 overflow-x-auto">
        <Button asChild variant="ghost" className="chip shrink-0 px-2 sm:px-3.5" disabled={simulating}><Link to="/" aria-label="Back to Home" title="Back to Home"><Home className="h-4 w-4" /><span className="hidden sm:inline">Back to Home</span></Link></Button>
        <h1 className="min-w-0 truncate font-display text-sm font-bold md:text-xl">{cfg.title} <span className="text-muted-foreground">· {cfg.he} (שלב {idx + 1})</span></h1>
        <div className="flex shrink-0 gap-2">
          {started && hidden.size > 0 && !murderer && (
            <button onClick={() => setReveal((v) => !v)} data-active={reveal} className="chip" disabled={simulating}>
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {reveal ? "Hide cars" : "Reveal cars"}
            </button>
          )}
           <Button variant="ghost" onClick={() => setLevelsOpen(true)} aria-label="Levels · בחר שלב" title="Levels · בחר שלב" className="chip px-2 sm:px-3.5" disabled={simulating}><Layers className="h-4 w-4" /><span className="hidden sm:inline">Levels · בחר שלב</span></Button>
           <Button variant="ghost" onClick={() => loadPuzzle(idx)} aria-label="Reset" title="Reset" className="chip px-2 sm:px-3.5" disabled={simulating}><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Reset</span></Button>
        </div>
      </header>

      <div className="game-grid">
        <aside className="panel flex flex-col gap-2" style={{ gridArea: "ctrl" }}>
          {!started ? (
            <Button onClick={start} className="execute start-control whitespace-normal"><Play className="h-4 w-4" /><span>Start Solving · התחל פתירה</span></Button>
          ) : (
          <div className="solving-controls flex flex-col gap-2">
          <div>
            <h2 className="panel-title">Direction</h2>
            <div className="grid grid-cols-3 grid-rows-3 gap-2">
              {DIRS.map(({ m, Icon, cls }) => (
                 <Button variant="ghost" key={m} aria-label={m} title={m} onClick={() => setMove(m)} data-active={move === m} className={`ctrl ${cls}`} disabled={simulating}>
                  <Icon className="h-5 w-5" />
                 </Button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="panel-title">Steps</h2>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => (
                 <Button variant="ghost" key={n} onClick={() => setSteps(n)} data-active={steps === n} className="ctrl px-0 font-display" disabled={simulating}>{n}</Button>
              ))}
            </div>
          </div>
           <Button onClick={execute} disabled={won || simulating} className="execute">
            {murderer ? (
              <>
                <Plus className="h-4 w-4" /> Add move · הוסף
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Execute · בצע
              </>
            )}
          </Button>
          </div>
          )}
</aside>

        <section className="flex min-h-0 flex-col items-center gap-2" style={{ gridArea: "board" }}>
          {showBoard ? (
            <div className="board">
              {warn && <div key={warn.key} className="warn" role="alert">{warn.text}</div>}
              {Array.from({ length: 36 }).map((_, i) => <div key={i} className="cell" style={{ gridRow: Math.floor(i / 6) + 1, gridColumn: (i % 6) + 1 }} />)}
              <div className="exit" />
              {cars.map((c) => (
                <button
                  key={c.id}
                  draggable={false}
                  onPointerDown={(e) => handlePointerDown(c, e)}
                  onPointerUp={(e) => handlePointerUp(c, e)}
                  onPointerMove={(e) => handlePointerMove(c, e)}
                  onPointerCancel={() => { dragStart.current = null; setDrag(null); }}
                  data-shake={sel === c.id && !!warn}
                  data-selected={sel === c.id}
                  data-hidden={hidden.has(c.id) && !reveal}
                  data-ghost={hidden.has(c.id) && reveal}
                  data-escaping={won && c.id === "X"}
                  aria-label={hidden.has(c.id) && !reveal ? "Hidden car" : c.name}
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
                  <Trophy className="h-12 w-12" />
                  <span className="text-3xl">Victory! · ניצחון</span>
                  <span className="text-base text-muted-foreground">
                    {isLast ? "סיימת את כל השלבים במשחק בהצלחה רבה! כל הכבוד! 🎉" : `${moves} moves · ${clock} · best possible ${puzzle.par}`}
                  </span>
                  <div className="mt-3 flex gap-2">
                    {!isLast ? (
                       <Button variant="ghost" onClick={() => jumpTo(idx + 1)} className="chip">Next Level · שלב הבא</Button>
                    ) : (
                       <Button variant="ghost" onClick={() => loadPuzzle(idx)} className="chip">Play again · שחק שוב</Button>
                    )}
                    <Link to="/" className="chip"><Home className="h-4 w-4" /> Home</Link>
                  </div>
                </div>
              )}
              {failed && (
                <div className="win flex-col gap-2 text-center" style={{ backgroundColor: 'oklch(0.16 0.01 260 / 0.95)' }}>
                  <X className="h-12 w-12 text-destructive" />
                  <span className="text-3xl text-destructive">Oops! · אופס!</span>
                  <span className="text-base text-muted-foreground">
                    {invisibleBumps >= 3 
                      ? "התנגשת 3 פעמים במכוניות בלתי נראות!" 
                      : "התוכנית שגויה או שלא שחררה את הרכב האדום."}
                  </span>
                  <div className="mt-3 flex gap-2">
                    <Button variant="ghost" onClick={() => loadPuzzle(idx)} className="chip">
                      <RotateCcw className="h-4 w-4" /> Try again · נסה שוב
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="panel relative flex w-full flex-col gap-2 self-start" style={{ width: "var(--board)", maxHeight: "var(--board)" }}>
              {warn && <div key={warn.key} className="warn" role="alert">{warn.text}</div>}
              <h2 className="panel-title mb-0">Planned Moves · מהלכים מתוכננים</h2>
              {plan.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Pick a car, direction and steps, then press Add move.</p>
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
                        <button aria-label="Remove move" onClick={() => setPlan((q) => q.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground" disabled={simulating}><Trash2 className="h-4 w-4" /></button>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div className="flex gap-2">
                <button onClick={() => setPlan([])} disabled={!plan.length || simulating} className="chip">Clear</button>
                <button onClick={submitPlan} disabled={simulating} className="execute flex flex-1 items-center justify-center gap-2"><Send className="h-4 w-4" /> Submit Solution · הגש פתרון</button>
              </div>
            </div>
          )}
          <div className="flex w-full shrink-0 items-center justify-between gap-3 rounded-xl border bg-card px-3 py-1.5 text-sm text-muted-foreground" style={{ width: "var(--board)" }}>
            <span>Moves: <span className="font-display text-foreground">{murderer && !won ? plan.length : moves}</span></span>
            <span className="min-w-0 flex-1 truncate text-center">{msg}</span>
            <span className="flex items-center gap-1"><Timer className="h-4 w-4" /><span className="font-display text-foreground">{clock}</span></span>
          </div>
        </section>

        <aside className="panel" style={{ gridArea: "cars" }}>
          <h2 className="panel-title">Cars</h2>
          <div className="grid grid-cols-4 gap-2">{standard.map(carBtn)}</div>
          {trucks.length > 0 && (
            <>
              <h2 className="panel-title mt-2">Trucks</h2>
              <div className="grid grid-cols-2 gap-2">{trucks.map(carBtn)}</div>
            </>
          )}
        </aside>
      </div>

      {levelsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={() => setLevelsOpen(false)}>
          <div className="panel max-h-[80vh] w-full max-w-lg overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Choose Level · בחר שלב</h2>
              <button aria-label="Close" onClick={() => setLevelsOpen(false)} className="chip"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {puzzles.map((_, i) => {
                const locked = i > maxSolved + 1;
                const done = i <= maxSolved;
                return (
                  <button key={i} disabled={locked} onClick={() => jumpTo(i)} data-active={i === idx} className="ctrl relative font-display disabled:opacity-40">
                    {locked ? <Lock className="h-4 w-4" /> : i + 1}
                    {done && <CheckCircle2 className="absolute -right-1 -top-1 h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
