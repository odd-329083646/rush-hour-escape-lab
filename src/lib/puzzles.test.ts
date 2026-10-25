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
    const solo = [{ ...cars[0]!, col: 4 }];
    expect(applyMove(solo, "X", "right", 1).vanished).toBe(true);
  });
});

import { pickHidden } from "./puzzles";
describe("pickHidden", () => {
  it("beginner hides nothing", () => expect(pickHidden(LEVELS.beginner.cars, "beginner").size).toBe(0));
  it("champions hides all cars", () => expect(pickHidden(LEVELS.champions.cars, "champions").size).toBe(LEVELS.champions.cars.length));
  it("advanced hides some but not all, never the red car", () => {
    const h = pickHidden(LEVELS.advanced.cars, "advanced");
    expect(h.size).toBe(3);
    expect(h.has("X")).toBe(false);
  });
});
