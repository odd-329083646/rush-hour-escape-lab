import { describe, it, expect } from "vitest";
import { applyMove, LEVELS } from "./puzzles";

describe("applyMove", () => {
  const cars = LEVELS.beginner.cars;
  it("blocks moves across orientation", () => {
    expect(applyMove(cars, "X", "up", 1).error).toBeTruthy();
  });
  it("blocks when another car is in the way", () => {
    expect(applyMove(cars, "X", "right", 1).error).toBe("Blocked by another car");
  });
  it("car vanishes when driven off the edge", () => {
    const r = applyMove(cars, "X", "left", 2);
    expect(r.vanished).toBe(true);
    expect(r.cars.find((c) => c.id === "X")).toBeUndefined();
  });
});
