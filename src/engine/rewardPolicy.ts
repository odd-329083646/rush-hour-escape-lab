// src/engine/rewardPolicy.ts
import type { StoragePort } from "./contracts";
import { addCoins, getCoins } from "./rewards";

const fallbackStorage: StoragePort = {
  getItem: () => null,
  setItem: () => {},
};

/** Device reward checks are not a security boundary; tournament settlement remains server-authoritative. */
export function spendCoins(amount: number): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0 || getCoins() < amount) return false;
  addCoins(-amount);
  return true;
}

export function awardOnce(
  key: string,
  amount: number,
  storage: StoragePort = fallbackStorage,
): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0 || storage.getItem(key) === "1") return false;
  storage.setItem(key, "1");
  addCoins(amount);
  return true;
}
