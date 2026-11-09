import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Home, Languages, Play, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyMove, isSolved, runPlan, type Car, type Move } from "@/lib/puzzles";
import { setLang, translate, useI18n, type Lang, type TKey } from "@/lib/i18n";
import { completeTutorial, markTutorialSeen } from "@/lib/tutorial";

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

export function Tutorial() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [languageChosen, setLanguageChosen] = useState(false);
  const chooseLanguage = (language: Lang) => { setLang(language); setLanguageChosen(true); };
  const [finished, setFinished] = useState<null | boolean>(null);
  // First visit counts as seen, so the menu never redirects here again.
  useEffect(() => markTutorialSeen(), []);
  const next = () => {
    if (step < 3) setStep(step + 1);
    else setFinished(completeTutorial());
  };
  if (!languageChosen) return (
    <main className="lot-bg flex h-dvh items-center justify-center overflow-hidden px-4" dir="ltr">
      <section className="panel flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <Languages className="h-10 w-10 text-primary" />
        <h1 className="font-display text-xl font-bold"><span className="block">{translate("en", "tutorialLanguage")}</span><span className="block" lang="he">{translate("he", "tutorialLanguage")}</span></h1>
        <div className="grid w-full grid-cols-2 gap-3">
          <Button className="execute" onClick={() => chooseLanguage("en")}>{t("languageEnglish")}</Button>
          <Button className="execute" onClick={() => chooseLanguage("he")}>{t("languageHebrew")}</Button>
        </div>
      </section>
    </main>
  );
  const lesson = LESSONS[step];
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
        lesson && <LessonView key={step} lesson={lesson} onNext={next} last={step === 3} />
      )}
    </main>
  );
}

function LessonView({ lesson, onNext, last }: { lesson: Lesson; onNext: () => void; last: boolean }) {
  const { t, te, lang } = useI18n();
  const [cars, setCars] = useState(lesson.cars);
  const [sel, setSel] = useState<string | null>(null);
  const [steps, setSteps] = useState(1);
  const [move, setMove] = useState<Move | null>(null);
  const [started, setStarted] = useState(!lesson.hidden);
  const [plan, setPlan] = useState<{ id: string; move: Move; steps: number }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const dragStart = useRef<{ id: string; pointerId: number; x: number; y: number; pitch: number; min: number; max: number } | null>(null);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  const done = isSolved(cars);
  const hidden = new Set(started && !done ? lesson.hidden ?? [] : []);

  const act = (id: string | null, direction: Move | null, count = steps) => {
    if (done) return;
    if (!started) { setMsg(t("needStart")); return; }
    if (!id) { setMsg(t("needCar")); return; }
    if (!direction) { setMsg(t("needDir")); return; }
    if (lesson.plan) { setPlan((queue) => [...queue, { id, move: direction, steps: count }]); setMsg(null); return; }
    const result = applyMove(cars, id, direction, count);
    setMsg(result.error ? te(result.error) : null);
    setCars(result.cars);
  };
  const submit = () => {
    const result = runPlan(cars, plan);
    if (result.failedAt === undefined && isSolved(result.cars)) { setCars(result.cars); setMsg(null); }
    else setMsg(t("tutPlanFail"));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || done) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [role=dialog]")) return;
      const id = event.code.startsWith("Key") ? event.code.slice(3) : event.key.toUpperCase();
      if (cars.some((car) => car.id === id)) { setSel(id); return; }
      if (["1", "2", "3", "4"].includes(event.key)) { setSteps(Number(event.key)); return; }
      const directions: Record<string, Move> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      const direction = directions[event.key];
      if (direction) { event.preventDefault(); setMove(direction); return; }
      if (event.key === "Enter") {
        event.preventDefault();
        if (!started) setStarted(true);
        else act(sel, move);
      }
      if (event.code === "Space" && lesson.plan && started) { event.preventDefault(); submit(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cars, sel, steps, move, started, done, plan, lang]);

  const handlePointerDown = (car: Car, event: PointerEvent<HTMLButtonElement>) => {
    if (done || !started || event.button !== 0) return;
    setSel(car.id);
    const target = event.currentTarget;
    const board = target.parentElement;
    if (!board) return;
    const cell = board.querySelector<HTMLElement>(".cell");
    if (!cell) return;
    const gap = parseFloat(getComputedStyle(board).columnGap) || 4;
    const pitch = cell.getBoundingClientRect().width + gap;
    if (pitch <= 0) return;
    let back = 0, forward = 0;
    // Plan drags queue intentions; collision validation happens only on submission.
    if (lesson.plan) {
      const position = car.dir === "h" ? car.col : car.row;
      back = position; forward = 6 - position - car.len;
    } else {
      const negative: Move = car.dir === "h" ? "left" : "up";
      const positive: Move = car.dir === "h" ? "right" : "down";
      while (back < 4 && !applyMove(cars, car.id, negative, back + 1).error) back++;
      while (forward < 4 && !applyMove(cars, car.id, positive, forward + 1).error) forward++;
    }
    target.setPointerCapture?.(event.pointerId);
    dragStart.current = { id: car.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, pitch, min: -back * pitch, max: forward * pitch };
  };
  const handlePointerMove = (car: Car, event: PointerEvent<HTMLButtonElement>) => {
    const current = dragStart.current;
    if (!current || current.id !== car.id || current.pointerId !== event.pointerId) return;
    const raw = car.dir === "h" ? event.clientX - current.x : event.clientY - current.y;
    setDrag({ id: car.id, offset: Math.max(current.min, Math.min(current.max, raw)) });
  };
  const handlePointerUp = (car: Car, event: PointerEvent<HTMLButtonElement>) => {
    const current = dragStart.current;
    if (!current || current.id !== car.id || current.pointerId !== event.pointerId) return;
    dragStart.current = null; setDrag(null);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const raw = car.dir === "h" ? event.clientX - current.x : event.clientY - current.y;
    const cells = Math.round(Math.max(current.min, Math.min(current.max, raw)) / current.pitch);
    if (!cells) return;
    const direction: Move = car.dir === "h" ? (cells > 0 ? "right" : "left") : (cells > 0 ? "down" : "up");
    setMove(direction); act(car.id, direction, Math.abs(cells));
  };
  const paletteCar = (car: Car) => (
    <Button key={car.id} variant="ghost" className="palette-cell h-auto" aria-label={t("selectCar", { id: car.id })} data-active={sel === car.id} disabled={done} onClick={() => setSel(car.id)}>
      <span className="h-3 rounded-sm" style={{ background: car.color, width: car.len === 3 ? "2.5rem" : "1.5rem" }} />
      <span className="text-xs">{car.id} {car.dir === "h" ? "↔" : "↕"}</span>
    </Button>
  );
  const directionPosition: Record<Move, string> = { up: "col-start-2 row-start-1", down: "col-start-2 row-start-3", left: "col-start-1 row-start-2", right: "col-start-3 row-start-2" };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3" dir="ltr">
      <section className="lesson-intro mx-auto w-full max-w-3xl text-center">
        <h2 className="font-display text-lg font-bold" dir={lang === "he" ? "rtl" : "ltr"}>{t(lesson.title)}</h2>
        <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground" dir={lang === "he" ? "rtl" : "ltr"}>{t(lesson.body).split("\n").map((line) => <li key={line}>{line}</li>)}</ul>
      </section>
      <div className="game-grid">
        <aside className="panel flex flex-col gap-2" style={{ gridArea: "ctrl" }}>
          {!started ? <Button className="execute start-control whitespace-normal" onClick={() => setStarted(true)}><Play className="h-4 w-4" />{t("tut3Start")}</Button> : (
            <div className="solving-controls flex flex-col gap-2">
              <h2 className="panel-title">{t("direction")}</h2>
              <div className="grid grid-cols-3 grid-rows-3 gap-2">
                {DIRS.map(({ m, Icon }) => <Button key={m} variant="ghost" className={`ctrl ${directionPosition[m]}`} aria-label={m} title={m} data-active={move === m} disabled={done} onClick={() => setMove(m)}><Icon className="h-5 w-5" /></Button>)}
              </div>
              <h2 className="panel-title">{t("steps")}</h2>
              <div className="grid grid-cols-4 gap-2">{[1, 2, 3, 4].map((n) => <Button key={n} variant="ghost" className="ctrl px-0 font-display" data-active={steps === n} disabled={done} onClick={() => setSteps(n)}>{n}</Button>)}</div>
              <Button className="execute mt-1" disabled={done} onClick={() => act(sel, move)}>{lesson.plan ? <Plus className="h-4 w-4" /> : <Play className="h-4 w-4" />}{t(lesson.plan ? "addMove" : "execute")}</Button>
            </div>
          )}
        </aside>
        <section className="flex min-h-0 flex-col items-center gap-2" style={{ gridArea: "board" }}>
          <div className="board">
            {Array.from({ length: 36 }).map((_, i) => <div key={i} className="cell" style={{ gridRow: Math.floor(i / 6) + 1, gridColumn: (i % 6) + 1 }} />)}
            <div className="exit" />
            {cars.map((car) => (
              <Button key={car.id} variant="ghost" draggable={false} onClick={() => setSel(car.id)}
                onPointerDown={(event) => handlePointerDown(car, event)} onPointerMove={(event) => handlePointerMove(car, event)} onPointerUp={(event) => handlePointerUp(car, event)}
                onPointerCancel={() => { dragStart.current = null; setDrag(null); }}
                data-selected={sel === car.id} data-hidden={hidden.has(car.id)} aria-label={t("selectCar", { id: car.id })}
                className="car h-auto min-w-0 touch-none select-none p-0 hover:bg-transparent"
                style={{ background: car.color, gridRow: `${car.row + 1} / span ${car.dir === "v" ? car.len : 1}`, gridColumn: `${car.col + 1} / span ${car.dir === "h" ? car.len : 1}`, transform: drag?.id === car.id ? (car.dir === "h" ? `translate(${drag.offset}px, 0)` : `translate(0, ${drag.offset}px)`) : undefined, transition: drag?.id === car.id ? "none" : undefined, zIndex: drag?.id === car.id ? 5 : undefined }}
              >{car.id}</Button>
            ))}
          </div>
          {msg && <p role="alert" className="text-center text-sm text-destructive">{msg}</p>}
          {done && <div className="flex flex-col items-center gap-2"><p className="font-display text-primary">{t("tutLessonDone")}</p><Button className="execute" onClick={onNext}>{t(last ? "tutDone" : "tutNext")}</Button></div>}
        </section>
        <aside className="panel flex flex-col gap-2" style={{ gridArea: "cars" }}>
          <h2 className="panel-title">{t("cars")}</h2>
          <div className="grid grid-cols-4 gap-2">{cars.filter((car) => car.len === 2).map(paletteCar)}</div>
          <h2 className="panel-title mt-2">{t("trucks")}</h2>
          <div className="grid grid-cols-2 gap-2">{cars.filter((car) => car.len === 3).map(paletteCar)}</div>
          {lesson.plan && <div className="mt-2 flex flex-col gap-2">
            <h3 className="panel-title">{t("tutPlan")}</h3>
            <ol className="lesson-plan text-sm">{plan.length ? plan.map((entry, i) => <li key={i}>{i + 1}. {entry.id} {{ up: "↑", down: "↓", left: "←", right: "→" }[entry.move]} {entry.steps}</li>) : <li>{t("tutPlanEmpty")}</li>}</ol>
            <div className="grid grid-cols-2 gap-2"><Button variant="ghost" className="ctrl" onClick={() => { setPlan([]); setMsg(null); }}>{t("tutClear")}</Button><Button className="execute" disabled={!plan.length || done} onClick={submit}>{t("tutSubmit")}</Button></div>
          </div>}
        </aside>
      </div>
    </div>
  );
}
