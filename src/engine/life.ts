// src/engine/life.ts
/** One purchased Life adjusts a single failure counter; board positions are never touched. */
export type LifeOption = "moves" | "bump";
export type LifeCounters = { moves: number; bumps: number };

export const LIFE_COST = 30;
export const LIFE_MOVE_DISCOUNT = 3;
export const LIFE_BUMP_REFUND = 1;

/** Which recovery options can help for the current failure. Plan failures cannot be recovered. */
export function lifeOptions(
  reason: "bumps" | "moves" | "plan" | null,
  counters: LifeCounters,
): Record<LifeOption, boolean> {
  if (reason !== "bumps" && reason !== "moves") return { moves: false, bump: false };
  return { moves: counters.moves > 0, bump: counters.bumps > 0 };
}

export function applyLife(option: LifeOption, counters: LifeCounters): LifeCounters {
  return option === "moves"
    ? { ...counters, moves: Math.max(0, counters.moves - LIFE_MOVE_DISCOUNT) }
    : { ...counters, bumps: Math.max(0, counters.bumps - LIFE_BUMP_REFUND) };
}
