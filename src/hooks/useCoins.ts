import { useSyncExternalStore } from "react";
import { getCoins } from "@/engine/rewards";

function subscribe(callback: () => void) {
  window.addEventListener("rush_hour_coins_updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("rush_hour_coins_updated", callback);
    window.removeEventListener("storage", callback);
  };
}

export function useCoins(): number {
  return useSyncExternalStore(subscribe, getCoins, () => 0);
}
