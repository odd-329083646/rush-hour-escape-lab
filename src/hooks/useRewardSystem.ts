import { useSyncExternalStore } from "react";
import { storageService } from "@/services/storageService";
import { addCoins, getCoins, saveLevelProgress } from "@/engine/rewards";
import { ENTRY_FEE } from "@/lib/tournament";

/** Device reward checks are not a security boundary; tournament settlement remains server-authoritative. */
export function spendCoins(amount: number): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0 || getCoins() < amount) return false;
  addCoins(-amount); return true;
}
export function awardOnce(key: string, amount: number): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0 || storageService.getItem(key) === "1") return false;
  storageService.setItem(key, "1"); addCoins(amount); return true;
}
export function useRewardSystem() {
  const coins = useSyncExternalStore(storageService.subscribe, getCoins, () => 0);
  return { coins, spend: spendCoins, awardOnce, saveLevelProgress, canEnter: coins >= ENTRY_FEE };
}