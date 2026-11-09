import { useSyncExternalStore } from "react";
import { storageService } from "@/services/storageService";
import { addCoins, getCoins, saveLevelProgress } from "@/engine/rewards";
import { ENTRY_FEE } from "@/lib/tournament";

import { spendCoins, awardOnce } from "@/engine/rewardPolicy";
export { spendCoins, awardOnce } from "@/engine/rewardPolicy";
export function useRewardSystem() {
  const coins = useSyncExternalStore(storageService.subscribe, getCoins, () => 0);
  return { coins, spend: spendCoins, awardOnce, saveLevelProgress, canEnter: coins >= ENTRY_FEE };
}