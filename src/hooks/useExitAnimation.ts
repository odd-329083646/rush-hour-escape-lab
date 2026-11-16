import { useEffect, useState } from "react";

/** Give the red car time to animate out when reaching the maximum position. */
export function useExitAnimation(isAtMaxPosition: boolean) {
  const [hasExited, setHasExited] = useState(false);

  useEffect(() => {
    if (!isAtMaxPosition) {
      setHasExited(false);
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setHasExited(true), reducedMotion ? 0 : 750);
    return () => window.clearTimeout(timer);
  }, [isAtMaxPosition]);

  return hasExited;
}
