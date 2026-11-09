import { describe, expect, it } from "vitest";
import { HINT_COSTS, PEEK_DURATION, hintAvailable, validateHintPlan } from "./hints";
import { type Car } from "./puzzles";

describe("hint rules", () => {
  it.each([["next", 15], ["peek", 25], ["reveal", 40], ["validate", 20]] as const)("charges %s at %i coins", (type, cost) => {
    expect(HINT_COSTS[type]).toBe(cost);
  });
  it("peeks for exactly three seconds", () => { expect(PEEK_DURATION).toBe(3000); });
  it("allows peek only in Medium, Hard, and Murderer", () => {
    expect(hintAvailable("peek", "easy", new Set(["A"]), [])).toBe(false);
    for (const level of ["medium", "hard", "murderer"] as const) expect(hintAvailable("peek", level, new Set(["A"]), [])).toBe(true);
  });
  it("allows validation only for a queued Murderer plan", () => {
    const plan = [{ id: "X", move: "right" as const, steps: 1 }];
    expect(hintAvailable("validate", "murderer", new Set(), plan)).toBe(true);
    for (const level of ["easy", "medium", "hard"] as const) expect(hintAvailable("validate", level, new Set(), plan)).toBe(false);
    expect(hintAvailable("validate", "murderer", new Set(), [])).toBe(false);
  });
  it("reports a collision without mutating cars or the queued plan", () => {
    const cars: Car[] = [
      { id: "X", name: "X", color: "var(--car-red)", row: 2, col: 0, len: 2, dir: "h" },
      { id: "A", name: "A", color: "var(--car-green)", row: 2, col: 2, len: 2, dir: "v" },
    ];
    const plan = [{ id: "X", move: "right" as const, steps: 1 }];
    const before = JSON.stringify({ cars, plan });
    expect(validateHintPlan(cars, plan)).toEqual({ failedAt: 0, error: "Blocked by another car" });
    expect(JSON.stringify({ cars, plan })).toBe(before);
  });
});