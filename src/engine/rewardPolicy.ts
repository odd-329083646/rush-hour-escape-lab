// src/engine/rewardPolicy.ts
import type { StoragePort } from "./contracts";
import { addCoins, getCoins } from "./rewards";

const fallbackStorage: StoragePort = {
  getItem: () => null,
  setItem: () => {},
};

export const BOARD_RESET_COST = 5;

/** Device reward checks are not a security boundary; tournament settlement remains server-authoritative. */
export function spendCoins(amount: number, storage: StoragePort = fallbackStorage): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0 || getCoins(storage) < amount) return false;
  addCoins(-amount, storage);
  return true;
}

export function awardOnce(
  key: string,
  amount: number,
  storage: StoragePort = fallbackStorage,
): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0 || storage.getItem(key) === "1") return false;
  storage.setItem(key, "1");
  addCoins(amount, storage);
  return true;
}