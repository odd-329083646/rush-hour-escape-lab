import { describe, it, expect } from "vitest";
import { runPlan, applyMove, isSolved, LEVELS, minSolution, pickHidden, type Level } from "./puzzles";

describe("applyMove", () => {
  const cars = LEVELS.easy.cars;
  it("blocks moves across orientation", () => expect(applyMove(cars, "X", "up", 1).error).toBeTruthy());
  it("blocks when another car is in the way", () => expect(applyMove(cars, "X", "right", 1).error).toBe("Blocked by another car"));
  it("cars can't leave the grid", () => expect(applyMove(cars, "A", "right", 1).error).toBe("Can't leave the parking lot"));
  it("moves exactly the chosen steps", () => expect(applyMove(cars, "A", "left", 1).cars.find((c) => c.id === "A")?.col).toBe(3));
});

describe("win condition", () => {
  it("solved when red front reaches the exit cell", () => expect(isSolved([{ ...LEVELS.easy.cars[0]!, col: 4 }])).toBe(true));
  it("not solved one cell short", () => expect(isSolved([{ ...LEVELS.easy.cars[0]!, col: 3 }])).toBe(false));
});

describe("every level is solvable", () => {
  for (const l of Object.keys(LEVELS) as Level[]) {
    it(`${l} solves in ${LEVELS[l].par} moves`, () => expect(minSolution(LEVELS[l].cars)).toBe(LEVELS[l].par));
  }
});

describe("runPlan", () => {
  it("reports the first invalid planned move", () => expect(runPlan(LEVELS.easy.cars, [{ id: "A", move: "left", steps: 1 }, { id: "X", move: "up", steps: 1 }]).failedAt).toBe(1));
});

describe("pickHidden", () => {
  it("easy hides nothing", () => expect(pickHidden(LEVELS.easy.cars, "easy").size).toBe(0));
  it("hard hides all cars", () => expect(pickHidden(LEVELS.hard.cars, "hard").size).toBe(LEVELS.hard.cars.length));
  it("medium hides some, never the red car", () => {
    const h = pickHidden(LEVELS.medium.cars, "medium");
    expect(h.size).toBe(Math.ceil((LEVELS.medium.cars.length - 1) / 2));
    expect(h.has("X")).toBe(false);
  });
});
