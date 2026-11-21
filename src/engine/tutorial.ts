// src/engine/tutorial.ts
import type { StoragePort } from "./contracts";
import { awardOnce } from "./rewardPolicy";

export const TUTORIAL_REWARD = 50;
const KEY = "rush_hour_tutorial_done";
const SEEN_KEY = "has_seen_tutorial";

const fallbackStorage: StoragePort = {
  getItem: () => null,
  setItem: () => {},
};

export function isTutorialDone(storage: StoragePort = fallbackStorage): boolean {
  return typeof window !== "undefined" && storage.getItem(KEY) === "1";
}

export function hasSeenTutorial(storage: StoragePort = fallbackStorage): boolean {
  return typeof window !== "undefined" && storage.getItem(SEEN_KEY) === "1";
}

export function markTutorialSeen(storage: StoragePort = fallbackStorage): void {
  storage.setItem(SEEN_KEY, "1");
}

/**
 * מעניק 50 מטבעות אך ורק אם המתחרה הוא מתחרה חדש (טרם ראה/סיים את המדריך),
 * ומסמן אותו כמתחרה ותיק.
 */
export function completeTutorial(storage: StoragePort = fallbackStorage): boolean {
  const isNewCompetitor = !hasSeenTutorial(storage) && !isTutorialDone(storage);
  markTutorialSeen(storage);
  if (!isNewCompetitor) {
    storage.setItem(KEY, "1");
    return false;
  }
  return awardOnce(KEY, TUTORIAL_REWARD, storage);
}