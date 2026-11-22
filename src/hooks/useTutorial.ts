import { useEffect, useRef, useState } from "react";
import { useI18n, setLang, type Lang } from "@/lib/i18n";
import { blApi } from "@/engine/blApi";
export function useTutorial() {
  const { t, lang } = useI18n();
  const storage = blApi.ports.storage;
  const lessons = blApi.constants.lessons;
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"language" | "intro" | "play" | "complete" | null>(null);
  const chooseLanguage = (language: Lang) => {
    setLang(language);
    setPhase("intro");
  };
  const [finished, setFinished] = useState<null | boolean>(null);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setPhase(blApi.tutorial.hasSeen(storage) ? "intro" : "language");
    blApi.tutorial.markSeen(storage);
  }, [storage]);
  const next = () => {
    if (step < lessons.length - 1) {
      setStep(step + 1);
      setPhase("intro");
    } else {
      setFinished(blApi.tutorial.complete(storage));
      setPhase("complete");
    }
  };
  const lesson = lessons[step];
  return { t, lang, step, phase, chooseLanguage, finished, lesson, next, setPhase, setStep };
}