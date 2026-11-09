import { useEffect, useRef, useState } from "react";
import { getCoins } from "@/engine/rewards";
import { spendCoins } from "./useRewardSystem";
import { HINT_COSTS, PEEK_DURATION, type HintType } from "@/lib/hints";

export function useHints(onBalance: (balance: number) => void) {
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reset = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setOpen(false);
    setPeek(false);
  };
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  const charge = (type: HintType) => {
    if (!spendCoins(HINT_COSTS[type])) return false;
    onBalance(getCoins());
    return true;
  };
  const startPeek = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    setPeek(true);
    timer.current = setTimeout(() => { setPeek(false); timer.current = null; }, PEEK_DURATION);
  };
  return { open, setOpen, peek, startPeek, charge, reset };
}