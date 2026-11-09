import { useEffect, useRef, useState } from "react";
import { useI18n, setLang, type Lang } from "@/lib/i18n";
import { completeTutorial, hasSeenTutorial, markTutorialSeen } from "@/lib/tutorial";
import { LESSONS } from "@/engine/tutorialLessons";
export function useTutorial() {
  const { t, lang } = useI18n();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"language" | "intro" | "play" | "complete" | null>(null);
  const chooseLanguage = (language: Lang) => { setLang(language); setPhase("intro"); };
  const [finished, setFinished] = useState<null | boolean>(null);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setPhase(hasSeenTutorial() ? "intro" : "language");
    markTutorialSeen();
  }, []);
  const next = () => {
    if (step < LESSONS.length - 1) { setStep(step + 1); setPhase("intro"); }
    else { setFinished(completeTutorial()); setPhase("complete"); }
  };
  const lesson = LESSONS[step];
  return { t, lang, step, phase, chooseLanguage, finished, lesson, next, setPhase, setStep };
}
