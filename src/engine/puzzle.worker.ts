import { generateRandomPuzzleOnTheFly, getNextBestMove } from "./game";
import type { Car } from "./game";

self.onmessage = (event: MessageEvent<{ id: number; kind: "generate" | "hint"; minPar?: number; cars?: Car[] }>) => {
  const { id, kind, minPar, cars } = event.data;
  try {
    const result = kind === "generate" ? generateRandomPuzzleOnTheFly(minPar ?? 7) : getNextBestMove(cars ?? []);
    self.postMessage({ id, result });
  } catch { self.postMessage({ id, error: "Puzzle analysis unavailable" }); }
};