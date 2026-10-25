import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Home, RotateCcw } from "lucide-react";
import { applyMove, LEVELS, type Car, type Level, type Move } from "@/lib/puzzles";

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
  const [cars, setCars] = useState<Car[]>(cfg.cars);
  const [sel, setSel] = useState<string | null>(null);
  const [move, setMove] = useState<Move | null>(null);
  const [steps, setSteps] = useState(1);
  const [moves, setMoves] = useState(0);
  const [msg, setMsg] = useState("Select a car to begin");
  const [warn, setWarn] = useState<{ text: string; key: number } | null>(null);
  const won = !cars.some((c) => c.id === "X");

  const reset = () => { setCars(cfg.cars); setSel(null); setMove(null); setSteps(1); setMoves(0); setMsg("Select a car to begin"); setWarn(null); };

  const flash = (text: string) => {
    const key = Date.now();
    setWarn({ text, key });
    setTimeout(() => setWarn((w) => (w?.key === key ? null : w)), 1800);
  };

  const execute = () => {
    if (!sel) return flash("Select a car first");
    if (!move) return flash("Choose a direction");
    const r = applyMove(cars, sel, move, steps);
    if (r.error) return flash(r.error);
    setCars(r.cars); setMoves((n) => n + 1); setWarn(null);
    if (r.vanished) { setMsg("The red car escaped! You win!"); setSel(null); }
    else setMsg("Moved!");
  };

  return (
    <main className="lot-bg min-h-screen px-4 py-6">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="chip"><Home className="h-4 w-4" /> Back to Home</Link>
        <h1 className="font-display text-lg font-bold md:text-2xl">{cfg.title} <span className="text-muted-foreground">· {cfg.he}</span></h1>
        <button onClick={reset} className="chip"><RotateCcw className="h-4 w-4" /> Reset</button>
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
          <button onClick={execute} disabled={won} className="execute">Execute · בצע</button>
          <div className="text-sm text-muted-foreground">
            <p>Moves: <span className="font-display text-foreground">{moves}</span></p>
            <p className="mt-1">{msg}</p>
          </div>
        </aside>

        {/* Center: board */}
        <section className="order-1 flex justify-center lg:order-2">
          <div className="board">
            {warn && <div key={warn.key} className="warn" role="alert">{warn.text}</div>}
            {Array.from({ length: 36 }).map((_, i) => <div key={i} className="cell" />)}
            <div className="exit" style={{ gridRow: 3 }} />
            {cars.map((c) => (
              <button
                key={sel === c.id && warn ? `${c.id}-${warn.key}` : c.id}
                onClick={() => setSel(c.id)}
                data-shake={sel === c.id && !!warn}
                data-selected={sel === c.id}
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
            {won && <div className="win">🏁 You escaped in {moves} moves!</div>}
          </div>
        </section>

        {/* Right: car palette */}
        <aside className="panel order-3">
          <h2 className="panel-title">Cars</h2>
          <ul className="flex flex-col gap-2">
            {cfg.cars.map((c) => {
              const gone = !cars.some((x) => x.id === c.id);
              return (
                <li key={c.id}>
                  <button disabled={gone} onClick={() => setSel(c.id)} data-active={sel === c.id} className="palette-item">
                    <span className="flex gap-0.5">
                      {Array.from({ length: c.len }).map((_, i) => <span key={i} className="h-3 w-3 rounded-sm" style={{ background: c.color }} />)}
                    </span>
                    <span className="flex-1 text-left">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{gone ? "vanished" : c.dir === "h" ? "↔" : "↕"}</span>
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
