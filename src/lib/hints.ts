import { runPlan, type Car, type Level, type Move } from "./puzzles";

export const HINT_COSTS = { next: 15, peek: 25, reveal: 40, validate: 20 } as const;
export const PEEK_DURATION = 3000;
export type HintType = keyof typeof HINT_COSTS;
export type PlannedMove = { id: string; move: Move; steps: number };

export function hintAvailable(type: HintType, level: Level, hidden: Set<string>, plan: PlannedMove[]) {
  if (type === "peek") return level !== "easy";
  if (type === "reveal") return hidden.size > 0;
  if (type === "validate") return level === "murderer" && plan.length > 0;
  return true;
}

export function validateHintPlan(cars: Car[], plan: PlannedMove[]) {
  const result = runPlan(cars, plan);
  return { failedAt: result.failedAt, error: result.error };
}

export function peekBoardCars(initial: Car[], current: Car[], peek: boolean) {
  return peek ? initial : current;
}