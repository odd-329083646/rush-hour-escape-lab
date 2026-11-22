import { useSyncExternalStore } from "react";
import { blApi } from "@/engine/blApi";

function subscribe(callback: () => void) {
  window.addEventListener("rush_hour_coins_updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("rush_hour_coins_updated", callback);
    window.removeEventListener("storage", callback);
  };
}

export function useCoins(): number {
  const storage = blApi.ports.storage;
  return useSyncExternalStore(
    subscribe,
    () => blApi.rewards.getCoins(storage),
    () => 0,
  );
}