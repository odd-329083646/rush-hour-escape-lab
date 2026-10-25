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
  it("cars can't leave the grid", () => {
    expect(applyMove(cars, "X", "left", 2).error).toBe("Can't leave the parking lot");
  });
  it("moves exactly the chosen steps", () => {
    expect(applyMove(cars, "X", "left", 1).cars.find((c) => c.id === "X")?.col).toBe(0);
  });
  it("red car escapes through the right exit", () => {
    const solo = [{ ...cars[0], col: 4 }];
    expect(applyMove(solo, "X", "right", 1).vanished).toBe(true);
  });
});
