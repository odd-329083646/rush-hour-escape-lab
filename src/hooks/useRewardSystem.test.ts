import { expect, it } from "vitest";
import { spendCoins, awardOnce } from "./useRewardSystem";
import { getCoins, addCoins, saveLevelProgress } from "@/engine/rewards";
import { storageService } from "@/services/storageService";

it("checks a 50-coin entry without overdrafts or invalid deductions", () => {
  storageService.setItem("rush_hour_coins", "50");
  expect(spendCoins(50)).toBe(true);
  expect(getCoins()).toBe(0);
  expect(spendCoins(50)).toBe(false);
  expect(spendCoins(-50)).toBe(false);
  expect(addCoins(Number.NaN)).toBe(0);
});
it("awards the tutorial 50 coins once even before persistence completes", () => {
  storageService.setItem("rush_hour_coins", "0");
  expect(awardOnce("reward_test", 50)).toBe(true);
  expect(awardOnce("reward_test", 50)).toBe(false);
  expect(getCoins()).toBe(50);
});
it("awards regular puzzle coins only on its first solve", () => {
  storageService.setItem("rush_hour_coins", "0");
  expect(saveLevelProgress("layer_test", 0, 9, 9, 20).coinsEarned).toBe(30);
  expect(saveLevelProgress("layer_test", 0, 9, 9, 18).coinsEarned).toBe(0);
  expect(getCoins()).toBe(30);
});