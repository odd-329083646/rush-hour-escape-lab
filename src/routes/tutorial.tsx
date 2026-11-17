import { useTutorial } from "@/hooks/useTutorial";
import type { Lesson } from "@/engine/tutorialLessons";
import { useTutorialLesson } from "@/hooks/useTutorialLesson";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Languages, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { translate } from "@/lib/i18n";
import { CoinsBadge } from "@/components/coins-badge";
import { GameArena } from "@/components/game-board";

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

export function Tutorial() {
  const { t, lang, step, phase, chooseLanguage, finished, lesson, next, setPhase, setStep } = useTutorial();
  return (
    <main className="tutorial lot-bg flex h-dvh flex-col items-center gap-3 overflow-hidden px-3 py-3">
      <header className="flex w-full max-w-3xl items-center justify-between gap-2">
        <Button asChild variant="ghost" className="chip px-3">
          <Link to="/" aria-label={t("backMenu")}>
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">{t("menu")}</span>
          </Link>
        </Button>
        <h1 className="font-display text-xl font-bold">{t("tutorial")}</h1>

        <div className="flex items-center gap-2">
          <CoinsBadge />
          <span className="chip px-3 py-1 text-xs">{t("tutLesson", { n: step + 1 })}</span>
        </div>
      </header>

      {phase === "play" && lesson && <LessonView key={step} lesson={lesson} onNext={next} />}
      <Dialog open={phase !== null && phase !== "play"}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-lg rounded-lg border-border bg-card text-center [&>button:last-child]:hidden"
          dir="ltr"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          {phase === "language" ? (
            <>
              <Languages className="mx-auto h-10 w-10 text-primary" />
              <DialogTitle className="font-display text-xl">
                <span className="block">{translate("en", "tutorialLanguage")}</span>
                <span className="block" lang="he">
                  {translate("he", "tutorialLanguage")}
                </span>
              </DialogTitle>
              <DialogDescription className="sr-only">{t("language")}</DialogDescription>
              <div className="grid grid-cols-2 gap-3">
                <Button className="execute" onClick={() => chooseLanguage("en")}>
                  {t("languageEnglish")}
                </Button>
                <Button className="execute" onClick={() => chooseLanguage("he")}>
                  {t("languageHebrew")}
                </Button>
              </div>
            </>
          ) : phase === "complete" ? (
            <>
              <Trophy className="mx-auto h-12 w-12 text-primary" />
              <DialogTitle className="font-display text-2xl">{t("tutDone")}</DialogTitle>
              <DialogDescription>{finished ? t("tutReward") : t("tutNoReward")}</DialogDescription>
              <Button asChild className="execute">
                <Link to="/play">{t("regularGames")}</Link>
              </Button>
            </>
          ) : (
            lesson && (
              <>
                <span className="font-display text-sm text-primary">{t("tutLesson", { n: step + 1 })}</span>
                <DialogTitle className="font-display text-xl leading-snug" dir={lang === "he" ? "rtl" : "ltr"}>
                  {t(lesson.title)}
                </DialogTitle>
                <DialogDescription asChild>
                  <ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground" dir={lang === "he" ? "rtl" : "ltr"}>
                    {t(lesson.body)
                      .split("\n")
                      .map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                  </ul>
                </DialogDescription>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button className="execute" onClick={() => setPhase("play")}>
                    {t("tutUnderstand")}
                  </Button>
                  {step > 0 && (
                    <Button variant="outline" onClick={() => setStep(step - 1)}>
                      {t("tutPrevious")}
                    </Button>
                  )}
                </div>
              </>
            )
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function LessonView({ lesson, onNext }: { lesson: Lesson; onNext: () => void }) {
  const {
    t,
    cars,
    sel,
    setSel,
    steps,
    setSteps,
    move,
    setMove,
    started,
    setStarted,
    plan,
    setPlan,
    msg,
    setMsg,
    dragStart,
    drag,
    setDrag,
    done,
    hidden,
    act,
    submit,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    directionPosition,
  } = useTutorialLesson({ lesson, onNext });

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3" dir="ltr">
      <GameArena
        t={t}
        controls={{
          started,
          startLabel: t("tut3Start"),
          onStart: () => setStarted(true),
          move,
          onMoveChange: setMove,
          steps,
          onStepsChange: setSteps,
          directionPositions: directionPosition,
          controlsDisabled: done,
          executeLabel: t(lesson.plan ? "addMove" : "execute"),
          executeIcon: lesson.plan ? "plus" : "play",
          executeDisabled: done,
          onExecute: () => act(sel, move),
        }}
        board={{
          cars,
          selectedId: sel,
          hiddenIds: hidden,
          drag,
          getCarLabel: (car) => t("selectCar", { id: car.id }),
          onCarClick: (car) => setSel(car.id),
          onPointerDown: handlePointerDown,
          onPointerMove: handlePointerMove,
          onPointerUp: handlePointerUp,
          onPointerCancel: () => {
            dragStart.current = null;
            setDrag(null);
          },
        }}
        boardFooter={msg ? <p role="alert" className="text-center text-sm text-destructive">{msg}</p> : null}
        paletteCars={cars}
        paletteDisabled={done}
        onSelectCar={setSel}
        paletteFooter={
          lesson.plan ? (
            <div className="mt-2 flex flex-col gap-2">
              <h3 className="panel-title">{t("tutPlan")}</h3>
              <ol className="lesson-plan text-sm">
                {plan.length ? (
                  plan.map((entry, i) => (
                    <li key={i}>
                      {i + 1}. {entry.id} {{ up: "↑", down: "↓", left: "←", right: "→" }[entry.move]} {entry.steps}
                    </li>
                  ))
                ) : (
                  <li>{t("tutPlanEmpty")}</li>
                )}
              </ol>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  className="ctrl"
                  onClick={() => {
                    setPlan([]);
                    setMsg(null);
                  }}
                >
                  {t("tutClear")}
                </Button>
                <Button className="execute" disabled={!plan.length || done} onClick={submit}>
                  {t("tutSubmit")}
                </Button>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}