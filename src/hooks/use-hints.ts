import { useEffect, useRef, useState } from "react";
import { blApi } from "@/engine/blApi";
import type { HintType } from "@/engine/hints";
import { spendCoins } from "./useRewardSystem";

const PEEK_DURATION = 3000;

export function useHints(onBalance: (balance: number) => void) {
  const storage = blApi.ports.storage;
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reset = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setOpen(false);
    setPeek(false);
  };
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  const charge = (type: HintType) => {
    if (!spendCoins(blApi.constants.hintCosts[type])) return false;
    onBalance(blApi.rewards.getCoins(storage));
    return true;
  };
  const startPeek = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    setPeek(true);
    timer.current = setTimeout(() => {
      setPeek(false);
      timer.current = null;
    }, PEEK_DURATION);
  };
  return { open, setOpen, peek, startPeek, charge, reset };
}