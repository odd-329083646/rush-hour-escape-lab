import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Eye, EyeOff, Home, Layers, Lock, Play, Plus, RotateCcw, Send, Timer, Trash2, Trophy, X } from "lucide-react";
import { applyMove, isSolved, LEVELS, pickHidden, runPlan, puzzles, loadPuzzlesAsync, type Car, type Level, type Move } from "@/lib/puzzles";

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
  const puzzle = (puzzles[idx] ?? puzzles[0])!;
  const [cars, setCars] = useState<Car[]>(puzzle.cars);
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
  const won = wonAt !== null;
  const elapsed = startedAt ? Math.floor(((wonAt ?? now) - startedAt) / 1000) : 0;
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

const loadPuzzle = (i: number, currentPuzzles = puzzles) => {
    setIdx(i);
    setCars(currentPuzzles[i]!.cars);
    setSel(null); setMove(null); setSteps(1); setMoves(0);
    setMsg("Study the lot, then press Start Solving");
    setWarn(null); setStarted(false); setHidden(new Set()); setReveal(false);
    setStartedAt(null); setWonAt(null); setPlan([]);
  };

  // טעינת השלבים החיצוניים מה-JSON ואתחול המשחק
  useEffect(() => {
    loadPuzzlesAsync().then((loadedPuzzles) => {
      setPuzzles(loadedPuzzles); // שמירת הנתונים ב-State
      const i = Math.min(parseInt(localStorage.getItem(idxKey) ?? "0", 10) || 0, loadedPuzzles.length - 1);
      setMaxSolved(parseInt(localStorage.getItem(maxKey) ?? "-1", 10));
      loadPuzzle(i, loadedPuzzles); // העברת הנתונים החדשים ישירות לפונקציה
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const execute = () => {
    if (!started) return flash("Press Start Solving first");
    if (!sel) return flash("Select a car first");
    if (!move) return flash("Choose a direction");
    if (murderer) { setPlan((p) => [...p, { id: sel, move, steps }]); return; }
    const r = applyMove(cars, sel, move, steps);
    if (r.error) return flash(r.error);
    setCars(r.cars); setMoves((n) => n + 1); setWarn(null);
    if (isSolved(r.cars)) markWon(); else setMsg("Moved!");
  };

  const submitPlan = () => {
    if (!plan.length) return flash("Add some moves first");
    const r = runPlan(cars, plan);
    if (r.error) return flash(`Move ${r.failedAt! + 1}: ${r.error}`);
    if (!isSolved(r.cars)) return flash("Plan doesn't free the red car");
    setCars(r.cars); setMoves(plan.length); markWon();
  };

  const finish = () => {
    if (isSolved(cars)) markWon();
    else flash("Not solved yet — the red car must reach the exit");
  };

  const isLast = idx >= puzzles.length - 1;
  const standard = cars.filter((c) => c.len === 2);
  const trucks = cars.filter((c) => c.len === 3);
  const showBoard = !(murderer && started && !won);

  const carBtn = (c: Car) => (
    <button key={c.id} onClick={() => setSel(c.id)} data-active={sel === c.id} title={c.name} className="palette-cell">
      <span className="h-3 rounded-sm" style={{ background: c.color, width: c.len === 3 ? "2.5rem" : "1.5rem" }} />
      <span className="text-xs">{c.id} {c.dir === "h" ? "↔" : "↕"}</span>
    </button>
  );

  // האזנה לאירועי מקלדת
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

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
  }, [cars, sel, move, steps, started, murderer, plan]);

  // לוגיקת גרירה והחלקה (Pointer Events)
  const dragStart = useRef<{ id: string; x: number; y: number } | null>(null);

  const handlePointerDown = (c: Car, e: React.PointerEvent) => {
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch (err) {}
    dragStart.current = { id: c.id, x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (c: Car, e: React.PointerEvent) => {
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
    if (!dragStart.current || dragStart.current.id !== c.id) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;

    const threshold = 15;

    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      setSel(c.id);
      return;
    }

    if (!started) {
      flash("Press Start Solving first");
      return;
    }

    setSel(c.id);

    let moveDir: Move | null = null;
    let dist = 0;

    if (c.dir === "h") {
      if (Math.abs(dx) >= threshold) {
        moveDir = dx > 0 ? "right" : "left";
        dist = Math.abs(dx);
      }
    } else {
      if (Math.abs(dy) >= threshold) {
        moveDir = dy > 0 ? "down" : "up";
        dist = Math.abs(dy);
      }
    }

    if (moveDir) {
      setMove(moveDir);
      const calculatedSteps = Math.max(1, Math.round(dist / 40));
      setSteps(calculatedSteps);

      if (murderer) {
        setPlan((p) => [...p, { id: c.id, move: moveDir!, steps: calculatedSteps }]);
      } else {
        const r = applyMove(cars, c.id, moveDir, calculatedSteps);
        if (r.error) {
          const r1 = applyMove(cars, c.id, moveDir, 1);
          if (r1.error) {
            flash(r1.error);
          } else {
            setSteps(1);
            setCars(r1.cars);
            setMoves((n) => n + 1);
            setWarn(null);
            if (isSolved(r1.cars)) markWon(); else setMsg("Moved!");
          }
        } else {
          setCars(r.cars);
          setMoves((n) => n + 1);
          setWarn(null);
          if (isSolved(r.cars)) markWon(); else setMsg("Moved!");
        }
      }
    }
  };

  return (
    <main className="lot-bg min-h-screen px-4 py-6">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <Link to="/" className="chip"><Home className="h-4 w-4" /> Back to Home</Link>
        <h1 className="font-display text-lg font-bold md:text-2xl">{cfg.title} <span className="text-muted-foreground">· {cfg.he} (שלב {idx + 1} מתוך {puzzles.length})</span></h1>
        <div className="flex flex-wrap gap-2">
          {started && hidden.size > 0 && !murderer && (
            <button onClick={() => setReveal((v) => !v)} data-active={reveal} className="chip">
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {reveal ? "Hide cars" : "Reveal cars"}
            </button>
          )}
          <button onClick={() => setLevelsOpen(true)} className="chip"><Layers className="h-4 w-4" /> Levels · בחר שלב</button>
          <button onClick={() => loadPuzzle(idx)} className="chip"><RotateCcw className="h-4 w-4" /> Reset</button>
        </div>
      </header>

      <div className="mx-auto mt-8 grid max-w-6xl gap-6 lg:grid-cols-[220px_1fr_240px]">
        <aside className="panel order-2 flex flex-col gap-6 lg:order-1">
          <div>
            <h2 className="panel-title">Direction</h2>
            <div className="grid grid-cols-3 grid-rows-3 gap-2">
              {DIRS.map(({ m, Icon, cls }) => (
                <button key={m} aria-label={m} onClick={() => setMove(m)} data-active={move === m} className={`ctrl ${cls}`}>
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="panel-title">Steps</h2>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} onClick={() => setSteps(n)} data-active={steps === n} className="ctrl font-display">{n}</button>
              ))}
            </div>
          </div>
          <button onClick={execute} disabled={won || !started} className="execute">
            {murderer ? <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Add move · הוסף</span> : "Execute · בצע"}
          </button>
          {!started ? (
            <button onClick={start} className="execute flex items-center justify-center gap-2"><Play className="h-4 w-4" /> Start Solving · התחל פתירה</button>
          ) : !murderer && (
            <button onClick={finish} disabled={won} className="chip justify-center py-2.5">
              <CheckCircle2 className="h-4 w-4" /> Finished · סיימתי
            </button>
          )}
          <div className="text-sm text-muted-foreground">
            <p className="flex justify-between">
              <span>Moves: <span className="font-display text-foreground">{murderer && !won ? plan.length : moves}</span></span>
              <span className="flex items-center gap-1"><Timer className="h-4 w-4" /><span className="font-display text-foreground">{clock}</span></span>
            </p>
            <p className="mt-1">{msg}</p>
          </div>
        </aside>

        <section className="order-1 flex justify-center lg:order-2">
          {showBoard ? (
            <div className="board">
              {warn && <div key={warn.key} className="warn" role="alert">{warn.text}</div>}
              {Array.from({ length: 36 }).map((_, i) => <div key={i} className="cell" style={{ gridRow: Math.floor(i / 6) + 1, gridColumn: (i % 6) + 1 }} />)}
              <div className="exit" style={{ gridRow: 3 }} />
              {cars.map((c) => (
                <button
                  key={sel === c.id && warn ? `${c.id}-${warn.key}` : c.id}
                  onPointerDown={(e) => handlePointerDown(c, e)}
                  onPointerUp={(e) => handlePointerUp(c, e)}
                  onPointerCancel={() => { dragStart.current = null; }}
                  data-shake={sel === c.id && !!warn}
                  data-selected={sel === c.id}
                  data-hidden={hidden.has(c.id) && !reveal}
                  data-ghost={hidden.has(c.id) && reveal}
                  aria-label={hidden.has(c.id) && !reveal ? "Hidden car" : c.name}
                  className="car touch-none select-none"
                  style={{
                    background: c.color,
                    gridRow: `${c.row + 1} / span ${c.dir === "v" ? c.len : 1}`,
                    gridColumn: `${c.col + 1} / span ${c.dir === "h" ? c.len : 1}`,
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
                      <button onClick={() => jumpTo(idx + 1)} className="chip"><RotateCcw className="h-4 w-4" /> Next Level · שלב הבא</button>
                    ) : (
                      <button onClick={() => loadPuzzle(idx)} className="chip"><RotateCcw className="h-4 w-4" /> Play again · שחק שוב</button>
                    )}
                    <Link to="/" className="chip"><Home className="h-4 w-4" /> Home</Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="panel relative flex w-full max-w-[480px] flex-col gap-4 self-start">
              {warn && <div key={warn.key} className="warn" role="alert">{warn.text}</div>}
              <h2 className="panel-title mb-0">Planned Moves · מהלכים מתוכננים</h2>
              {plan.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Pick a car, direction and steps, then press Add move.</p>
              ) : (
                <ol className="flex max-h-96 flex-col gap-2 overflow-auto">
                  {plan.map((p, i) => {
                    const c = cars.find((x) => x.id === p.id)!;
                    return (
                      <li key={i} className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm">
                        <span className="w-6 font-display text-muted-foreground">{i + 1}.</span>
                        <span className="h-3 w-5 rounded-sm" style={{ background: c.color }} />
                        <span className="flex-1">{c.id} · {c.name}</span>
                        <span className="font-display">{ARROW[p.move]} {p.steps}</span>
                        <button aria-label="Remove move" onClick={() => setPlan((q) => q.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground"><Trash2 className="h-4 w-4" /></button>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div className="flex gap-2">
                <button onClick={() => setPlan([])} disabled={!plan.length} className="chip">Clear</button>
                <button onClick={submitPlan} className="execute flex flex-1 items-center justify-center gap-2"><Send className="h-4 w-4" /> Submit Solution · הגש פתרון</button>
              </div>
            </div>
          )}
        </section>

        <aside className="panel order-3">
          <h2 className="panel-title">Cars</h2>
          <div className="grid grid-cols-4 gap-2">{standard.map(carBtn)}</div>
          {trucks.length > 0 && (
            <>
              <h2 className="panel-title mt-4">Trucks</h2>
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
