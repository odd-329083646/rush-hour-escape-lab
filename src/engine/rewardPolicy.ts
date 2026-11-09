import { storageService } from "@/services/storageService";
import { addCoins, getCoins } from "./rewards";
/** Device reward checks are not a security boundary; tournament settlement remains server-authoritative. */
export function spendCoins(amount: number): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0 || getCoins() < amount) return false;
  addCoins(-amount); return true;
}
export function awardOnce(key: string, amount: number): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0 || storageService.getItem(key) === "1") return false;
  storageService.setItem(key, "1"); addCoins(amount); return true;
}
