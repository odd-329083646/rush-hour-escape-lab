import { describe, it, expect } from "vitest";
import { applyMove, isSolved, LEVELS, minSolution, pickHidden, type Level } from "./puzzles";

describe("applyMove", () => {
  const cars = LEVELS.beginner.cars;
  it("blocks moves across orientation", () => expect(applyMove(cars, "X", "up", 1).error).toBeTruthy());
  it("blocks when another car is in the way", () => expect(applyMove(cars, "X", "right", 1).error).toBe("Blocked by another car"));
  it("cars can't leave the grid", () => expect(applyMove(cars, "A", "left", 1).error).toBe("Can't leave the parking lot"));
  it("moves exactly the chosen steps", () => expect(applyMove(cars, "A", "right", 1).cars.find((c) => c.id === "A")?.col).toBe(1));
});

describe("win condition", () => {
  it("solved when red front reaches the exit cell", () => expect(isSolved([{ ...LEVELS.beginner.cars[0]!, col: 4 }])).toBe(true));
  it("not solved one cell short", () => expect(isSolved([{ ...LEVELS.beginner.cars[0]!, col: 3 }])).toBe(false));
});

describe("every level is solvable", () => {
  for (const l of Object.keys(LEVELS) as Level[]) {
    it(`${l} solves in ${LEVELS[l].par} moves`, () => expect(minSolution(LEVELS[l].cars)).toBe(LEVELS[l].par));
  }
});

describe("pickHidden", () => {
  it("beginner hides nothing", () => expect(pickHidden(LEVELS.beginner.cars, "beginner").size).toBe(0));
  it("champions hides all cars", () => expect(pickHidden(LEVELS.champions.cars, "champions").size).toBe(LEVELS.champions.cars.length));
  it("advanced hides some, never the red car", () => {
    const h = pickHidden(LEVELS.advanced.cars, "advanced");
    expect(h.size).toBe(6);
    expect(h.has("X")).toBe(false);
  });
});
