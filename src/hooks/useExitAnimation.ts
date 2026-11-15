import { useEffect, useState } from "react";

/** Give the completed board time to animate before covering it with results. */
export function useExitAnimation(completedAt: number | null) {
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  useEffect(() => {
    if (completedAt === null) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setFinishedAt(completedAt), reducedMotion ? 0 : 750);
    return () => window.clearTimeout(timer);
  }, [completedAt]);

  return completedAt !== null && finishedAt === completedAt;
}