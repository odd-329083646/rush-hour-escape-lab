import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Home, Play, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyMove, isSolved, runPlan, type Car, type Move } from "@/lib/puzzles";
import { useI18n, type TKey } from "@/lib/i18n";
import { completeTutorial } from "@/lib/tutorial";

export const Route = createFileRoute("/tutorial")({
  head: () => ({
    meta: [
      { title: "Tutorial - Rush Hour Vanishing Cars" },
      { name: "description", content: "Learn Rush Hour Vanishing Cars in 4 interactive lessons: the goal, movement, invisible cars and plan mode." },
      { property: "og:title", content: "Tutorial - Rush Hour Vanishing Cars" },
      { property: "og:description", content: "4 interactive lessons that teach every rule. Finish to earn 50 coins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tutorial,
});

const X: Car = { id: "X", name: "Red Car", color: "var(--car-red)", row: 2, col: 0, len: 2, dir: "h" };
const O: Car = { id: "O", name: "Yellow Truck", color: "var(--car-yellow)", row: 0, col: 3, len: 3, dir: "v" };
const A: Car = { id: "A", name: "Blue Car", color: "var(--car-blue)", row: 2, col: 3, len: 2, dir: "v" };
const B: Car = { id: "B", name: "Lime Car", color: "var(--car-lime)", row: 5, col: 0, len: 2, dir: "h" };

type Lesson = { title: TKey; body: TKey; cars: Car[]; hidden?: string[]; plan?: boolean };
const LESSONS: Lesson[] = [
  { title: "tut1Title", body: "tut1Body", cars: [X] },
  { title: "tut2Title", body: "tut2Body", cars: [X, O, B] },
  { title: "tut3Title", body: "tut3Body", cars: [X, A, B], hidden: ["A"] },
  { title: "tut4Title", body: "tut4Body", cars: [X, O], plan: true },
];
const DIRS: { m: Move; Icon: typeof ArrowUp }[] = [
  { m: "up", Icon: ArrowUp }, { m: "down", Icon: ArrowDown }, { m: "left", Icon: ArrowLeft }, { m: "right", Icon: ArrowRight },
];

function Tutorial() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState<null | boolean>(null);
  const next = () => {
    if (step < 3) setStep(step + 1);
    else setFinished(completeTutorial());
  };
  return (
    <main className="tutorial lot-bg flex h-dvh flex-col items-center gap-3 overflow-hidden px-3 py-3">
      <header className="flex w-full max-w-3xl items-center justify-between gap-2">
        <Button asChild variant="ghost" className="chip px-3"><Link to="/" aria-label={t("backMenu")}><Home className="h-4 w-4" /><span className="hidden sm:inline">{t("menu")}</span></Link></Button>
        <h1 className="font-display text-xl font-bold">{t("tutorial")}</h1>
        <span className="chip px-3 py-1 text-xs">{t("tutLesson", { n: step + 1 })}</span>
      </header>
      {finished !== null ? (
        <div className="panel mt-8 flex max-w-sm flex-col items-center gap-3 text-center">
          <Trophy className="h-10 w-10 text-primary" />
          <h2 className="font-display text-2xl font-bold">{t("tutDone")}</h2>
          <p className="text-muted-foreground">{finished ? t("tutReward") : t("tutNoReward")}</p>
          <Button asChild className="execute"><Link to="/play">{t("regularGames")}</Link></Button>
        </div>
      ) : (
        <LessonView key={step} lesson={LESSONS[step]} onNext={next} last={step === 3} />
      )}
    </main>
  );
}

function LessonView({ lesson, onNext, last }: { lesson: Lesson; onNext: () => void; last: boolean }) {
  const { t, te } = useI18n();
  const [cars, setCars] = useState(lesson.cars);
  const [sel, setSel] = useState<string | null>(null);
  const [steps, setSteps] = useState(1);
  const [started, setStarted] = useState(!lesson.hidden);
  const [plan, setPlan] = useState<{ id: string; move: Move; steps: number }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const done = isSolved(cars);
  const hidden = new Set(started && !done ? lesson.hidden ?? [] : []);

  const act = (move: Move) => {
    if (!sel || done || !started) { setMsg(te("Select a car first")); return; }
    if (lesson.plan) { setPlan([...plan, { id: sel, move, steps }]); setMsg(null); return; }
    const r = applyMove(cars, sel, move, steps);
    setMsg(r.error ? te(r.error) : null);
    setCars(r.cars);
  };
  const submit = () => {
    const r = runPlan(cars, plan);
    if (r.failedAt === undefined && isSolved(r.cars)) { setCars(r.cars); setMsg(null); }
    else setMsg(t("tutPlanFail"));
  };

  return (
    <div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center gap-3">
      <div className="panel w-full py-3">
        <h2 className="font-display text-lg font-bold">{t(lesson.title)}</h2>
        <p className="text-sm text-muted-foreground">{t(lesson.body)}</p>
      </div>
      <div className="board relative">
        {Array.from({ length: 36 }).map((_, i) => <div key={i} className="cell" style={{ gridRow: Math.floor(i / 6) + 1, gridColumn: (i % 6) + 1 }} />)}
        <div className="exit" />
        {cars.map((c) => (
          <Button key={c.id} variant="ghost" draggable={false} onClick={() => setSel(c.id)}
            data-selected={sel === c.id} data-hidden={hidden.has(c.id)}
            aria-label={hidden.has(c.id) ? t("hiddenCar") : c.name}
            className="car h-auto min-w-0 p-0 hover:bg-transparent"
            style={{ background: c.color, gridRow: `${c.row + 1} / span ${c.dir === "v" ? c.len : 1}`, gridColumn: `${c.col + 1} / span ${c.dir === "h" ? c.len : 1}` }}
          >{c.id}</Button>
        ))}
      </div>
      {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
      {done ? (
        <div className="flex flex-col items-center gap-2">
          <p className="font-display text-primary">{t("tutLessonDone")}</p>
          <Button onClick={onNext} className="execute">{last ? t("tutDone") : t("tutNext")}</Button>
        </div>
      ) : !started ? (
        <Button onClick={() => setStarted(true)} className="execute"><Play className="h-4 w-4" />{t("tut3Start")}</Button>
      ) : (
        <div className="flex w-full max-w-md flex-col gap-2">
          <div className="grid grid-cols-4 gap-2">
            {DIRS.map(({ m, Icon }) => <Button key={m} variant="ghost" className="ctrl" aria-label={m} onClick={() => act(m)}><Icon className="h-4 w-4" /></Button>)}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((n) => <Button key={n} variant="ghost" className="ctrl" data-active={steps === n} onClick={() => setSteps(n)}>{n}</Button>)}
          </div>
          <p className="text-center text-xs text-muted-foreground">{t("steps")}: {steps} · {lesson.plan ? t("addMove") : t("execute")} = ←↑↓→</p>
          {lesson.plan && (
            <div className="panel py-2">
              <h3 className="panel-title">{t("tutPlan")}</h3>
              <p className="text-sm">{plan.length ? plan.map((p, i) => `${i + 1}. ${p.id} ${p.move} ${p.steps}`).join("  ·  ") : t("tutPlanEmpty")}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="ghost" className="ctrl" onClick={() => { setPlan([]); setMsg(null); }}>{t("tutClear")}</Button>
                <Button className="execute" disabled={!plan.length} onClick={submit}>{t("tutSubmit")}</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
