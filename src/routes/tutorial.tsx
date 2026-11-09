import { useTutorial } from "@/hooks/useTutorial";
import type { Lesson } from "@/engine/tutorialLessons";
import { useTutorialLesson } from "@/hooks/useTutorialLesson";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Home, Languages, Play, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { applyMove, isSolved, runPlan, type Car, type Move } from "@/lib/puzzles";
import { setLang, translate, useI18n, type Lang, type TKey } from "@/lib/i18n";
import { completeTutorial, hasSeenTutorial, markTutorialSeen } from "@/lib/tutorial";

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

const DIRS: { m: Move; Icon: typeof ArrowUp }[] = [
  { m: "up", Icon: ArrowUp }, { m: "down", Icon: ArrowDown }, { m: "left", Icon: ArrowLeft }, { m: "right", Icon: ArrowRight },
];

export function Tutorial() {
  const { t, lang, step, phase, chooseLanguage, finished, lesson, next, setPhase, setStep } = useTutorial();
  return (
    <main className="tutorial lot-bg flex h-dvh flex-col items-center gap-3 overflow-hidden px-3 py-3">
      <header className="flex w-full max-w-3xl items-center justify-between gap-2">
        <Button asChild variant="ghost" className="chip px-3"><Link to="/" aria-label={t("backMenu")}><Home className="h-4 w-4" /><span className="hidden sm:inline">{t("menu")}</span></Link></Button>
        <h1 className="font-display text-xl font-bold">{t("tutorial")}</h1>
        <span className="chip px-3 py-1 text-xs">{t("tutLesson", { n: step + 1 })}</span>
      </header>
      {phase === "play" && lesson && <LessonView key={step} lesson={lesson} onNext={next} />}
      <Dialog open={phase !== null && phase !== "play"}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-lg border-border bg-card text-center [&>button:last-child]:hidden" dir="ltr" onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()}>
          {phase === "language" ? <>
            <Languages className="mx-auto h-10 w-10 text-primary" />
            <DialogTitle className="font-display text-xl"><span className="block">{translate("en", "tutorialLanguage")}</span><span className="block" lang="he">{translate("he", "tutorialLanguage")}</span></DialogTitle>
            <DialogDescription className="sr-only">{t("language")}</DialogDescription>
            <div className="grid grid-cols-2 gap-3">
              <Button className="execute" onClick={() => chooseLanguage("en")}>{t("languageEnglish")}</Button>
              <Button className="execute" onClick={() => chooseLanguage("he")}>{t("languageHebrew")}</Button>
            </div>
          </> : phase === "complete" ? <>
            <Trophy className="mx-auto h-12 w-12 text-primary" />
            <DialogTitle className="font-display text-2xl">{t("tutDone")}</DialogTitle>
            <DialogDescription>{finished ? t("tutReward") : t("tutNoReward")}</DialogDescription>
            <Button asChild className="execute"><Link to="/play">{t("regularGames")}</Link></Button>
          </> : lesson && <>
            <span className="font-display text-sm text-primary">{t("tutLesson", { n: step + 1 })}</span>
            <DialogTitle className="font-display text-xl leading-snug" dir={lang === "he" ? "rtl" : "ltr"}>{t(lesson.title)}</DialogTitle>
            <DialogDescription asChild><ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground" dir={lang === "he" ? "rtl" : "ltr"}>{t(lesson.body).split("\n").map((line) => <li key={line}>{line}</li>)}</ul></DialogDescription>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button className="execute" onClick={() => setPhase("play")}>{t("tutUnderstand")}</Button>
              {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>{t("tutPrevious")}</Button>}
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function LessonView({ lesson, onNext }: { lesson: Lesson; onNext: () => void }) {
  const { t, te, lang, cars, setCars, commitMove, sel, setSel, steps, setSteps, move, setMove, started, setStarted, plan, setPlan, msg, setMsg, dragStart, drag, setDrag, done, hidden, act, submit, handlePointerDown, handlePointerMove, handlePointerUp, directionPosition } = useTutorialLesson({ lesson, onNext });
  const paletteCar = (car: Car) => (
    <Button key={car.id} variant="ghost" className="palette-cell h-auto" aria-label={t("selectCar", { id: car.id })} data-active={sel === car.id} disabled={done} onClick={() => setSel(car.id)}>
      <span className="h-3 rounded-sm" style={{ background: car.color, width: car.len === 3 ? "2.5rem" : "1.5rem" }} />
      <span className="text-xs">{car.id} {car.dir === "h" ? "↔" : "↕"}</span>
    </Button>
  );
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3" dir="ltr">
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
