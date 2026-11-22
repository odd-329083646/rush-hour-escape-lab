import { useSyncExternalStore } from "react";
import { blApi } from "@/engine/blApi";
import { spendCoins, awardOnce } from "@/engine/rewardPolicy";

export { spendCoins, awardOnce } from "@/engine/rewardPolicy";

const emptySubscribe = () => () => {};

export function useRewardSystem() {
  const storage = blApi.ports.storage;
  const coins = useSyncExternalStore(
    emptySubscribe,
    () => blApi.rewards.getCoins(storage),
    () => 0,
  );
  return {
    coins,
    spend: spendCoins,
    awardOnce,
    saveLevelProgress: blApi.rewards.saveLevelProgress,
    canEnter: coins >= blApi.constants.entryFee,
  };
}