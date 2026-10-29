import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Eye, EyeOff, Home, RotateCcw, Timer, Trophy } from "lucide-react";
import { applyMove, isSolved, LEVELS, pickHidden, getRandomPuzzle, type Car, type Level, type Move } from "@/lib/puzzles";

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

function Game() {
  const { level } = Route.useParams() as { level: Level };
  const cfg = LEVELS[level];

  // הגרלה רנדומלית של שלב (המכוניות וה-par שלו) באתחול העמוד
  const [currentPuzzle, setCurrentPuzzle] = useState(() => getRandomPuzzle());
  const [cars, setCars] = useState<Car[]>(currentPuzzle.cars);

  const [sel, setSel] = useState<string | null>(null);
  const [move, setMove] = useState<Move | null>(null);
  const [steps, setSteps] = useState(1);
  const [moves, setMoves] = useState(0);
  const [msg, setMsg] = useState("Select a car to begin");
  const [warn, setWarn] = useState<{ text: string; key: number } | null>(null);
  const [started, setStarted] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [reveal, setReveal] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [wonAt, setWonAt] = useState<number | null>(null);
  const won = wonAt !== null;
  const elapsed = startedAt ? Math.floor(((wonAt ?? now) - startedAt) / 1000) : 0;
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (!startedAt || won) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [startedAt, won]);

  // בעת איפוס (Reset) - נגריל שלב חדש לחלוטין מתוך המאגר המשותף
  const reset = () => { 
    const newPuzzle = getRandomPuzzle();
    setCurrentPuzzle(newPuzzle);
    setCars(newPuzzle.cars); 
    setSel(null); 
    setMove(null); 
    setSteps(1); 
    setMoves(0); 
    setMsg("Select a car to begin"); 
    setWarn(null); 
    setStarted(false); 
    setHidden(new Set()); 
    setReveal(false); 
    setStartedAt(null); 
    setWonAt(null); 
  };

  const start = () => {
    setHidden(pickHidden(cars, level));
    setStarted(true);
    setStartedAt(Date.now());
    setMsg(level === "champions" ? "All cars vanished. Good luck!" : level === "advanced" ? "Some cars vanished — they still block!" : "Clock's running — free the red car!");
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
    const r = applyMove(cars, sel, move, steps);
    if (r.error) return flash(r.error);
    setCars(r.cars); setMoves((n) => n + 1); setWarn(null);
    if (isSolved(r.cars)) { setWonAt(Date.now()); setMsg("Solved!"); setSel(null); }
    else setMsg("Moved!");
  };

  const finish = () => {
    if (!started) return flash("Press Start Solving first");
    if (isSolved(cars)) setWonAt(Date.now());
    else flash("Not solved yet — the red car must reach the exit");
  };

  return (
    <main className="lot-bg min-h-screen px-4 py-6">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <Link to="/" className="chip"><Home className="h-4 w-4" /> Back to Home</Link>
        <h1 className="font-display text-lg font-bold md:text-2xl">{cfg.title} <span className="text-muted-foreground">· {cfg.he}</span></h1>
        <div className="flex gap-2">
          {started && hidden.size > 0 && (
            <button onClick={() => setReveal((v) => !v)} data-active={reveal} className="chip">
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {reveal ? "Hide cars" : "Reveal cars"}
            </button>
          )}
          <button onClick={reset} className="chip"><RotateCcw className="h-4 w-4" /> Reset</button>
        </div>
      </header>

      <div className="mx-auto mt-8 grid max-w-6xl gap-6 lg:grid-cols-[220px_1fr_220px]">
        {/* Left: controls */}
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
          <button onClick={execute} disabled={won || !started} className="execute">Execute · בצע</button>
          <button onClick={finish} disabled={won || !started} className="chip justify-center py-2.5">
            <CheckCircle2 className="h-4 w-4" /> Finished · סיימתי
          </button>
          <div className="text-sm text-muted-foreground">
            <p className="flex justify-between">
              <span>Moves: <span className="font-display text-foreground">{moves}</span></span>
              <span className="flex items-center gap-1"><Timer className="h-4 w-4" /><span className="font-display text-foreground">{clock}</span></span>
            </p>
            <p className="mt-1">{msg}</p>
          </div>
        </aside>

        {/* Center: board */}
        <section className="order-1 flex justify-center lg:order-2">
          <div className="board">
            {warn && <div key={warn.key} className="warn" role="alert">{warn.text}</div>}
            {Array.from({ length: 36 }).map((_, i) => <div key={i} className="cell" style={{ gridRow: Math.floor(i / 6) + 1, gridColumn: (i % 6) + 1 }} />)}
            <div className="exit" style={{ gridRow: 3 }} />
            {cars.map((c) => (
              <button
                key={sel === c.id && warn ? `${c.id}-${warn.key}` : c.id}
                onClick={() => setSel(c.id)}
                data-shake={sel === c.id && !!warn}
                data-selected={sel === c.id}
                data-hidden={hidden.has(c.id) && !reveal}
                data-ghost={hidden.has(c.id) && reveal}
                aria-label={hidden.has(c.id) && !reveal ? "Hidden car" : c.name}
                className="car"
                style={{
                  background: c.color,
                  gridRow: `${c.row + 1} / span ${c.dir === "v" ? c.len : 1}`,
                  gridColumn: `${c.col + 1} / span ${c.dir === "h" ? c.len : 1}`,
                }}
              >
                {c.id}
              </button>
            ))}
            {!started && (
              <div className="win veil flex-col gap-3">
                <span className="text-base text-muted-foreground">
                  {level === "champions" ? "Memorize the lot — every car will vanish." : level === "advanced" ? "Memorize the lot — some cars will vanish." : "Free the red car to the yellow exit."}
                </span>
                <button onClick={start} className="execute px-8">Start Solving · התחל פתירה</button>
              </div>
            )}
            {won && (
              <div className="win flex-col gap-2 text-center">
                <Trophy className="h-12 w-12" />
                <span className="text-3xl">Victory! · ניצחון</span>
                <span className="text-base text-muted-foreground">{moves} moves · {clock} · best possible {currentPuzzle.par}</span>
                <div className="mt-3 flex gap-2">
                  <button onClick={reset} className="chip"><RotateCcw className="h-4 w-4" /> Play again</button>
                  <Link to="/" className="chip"><Home className="h-4 w-4" /> Home</Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right: car palette */}
        <aside className="panel order-3">
          <h2 className="panel-title">Cars</h2>
          <ul className="flex flex-col gap-2">
            {cars.map((c) => {
              return (
                <li key={c.id}>
                  <button onClick={() => setSel(c.id)} data-active={sel === c.id} className="palette-item">
                    <span className="flex gap-0.5">
                      {Array.from({ length: c.len }).map((_, i) => <span key={i} className="h-3 w-3 rounded-sm" style={{ background: c.color }} />)}
                    </span>
                    <span className="flex-1 text-left">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.dir === "h" ? "↔" : "↕"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </main>
  );
}
