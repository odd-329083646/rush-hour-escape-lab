import { addCoins } from "@/lib/puzzles";

export const TUTORIAL_REWARD = 50;
const KEY = "rush_hour_tutorial_done";

export function isTutorialDone(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
}

/** Marks the tutorial complete; awards coins only the first time. Returns whether coins were awarded. */
export function completeTutorial(): boolean {
  if (isTutorialDone()) return false;
  localStorage.setItem(KEY, "1");
  addCoins(TUTORIAL_REWARD);
  return true;
}

const SEEN_KEY = "has_seen_tutorial";
export function hasSeenTutorial(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(SEEN_KEY) === "1";
}
export function markTutorialSeen(): void {
  localStorage.setItem(SEEN_KEY, "1");
}
