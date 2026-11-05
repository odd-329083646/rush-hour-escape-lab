import { describe, it, expect } from "vitest";
import {
  applyMove,
  generateRandomPuzzleOnTheFly,
  isSolved,
  minSolution,
  pickHidden,
  runPlan,
  type Car,
} from "./puzzles";

// Fixed layout used by every assertion below, so a change to the puzzle data file
// can never quietly change what these tests prove.
const FIXTURE: Car[] = [
  { id: "X", name: "Red Racer", color: "var(--car-red)", row: 2, col: 0, len: 2, dir: "h" },
  { id: "A", name: "Green Car", color: "var(--car-green)", row: 0, col: 4, len: 2, dir: "h" },
  { id: "O", name: "Yellow Truck", color: "var(--car-yellow)", row: 0, col: 2, len: 3, dir: "v" },
  { id: "Q", name: "Blue Truck", color: "var(--car-blue)", row: 3, col: 5, len: 3, dir: "v" },
  { id: "P", name: "Orange Truck", color: "var(--car-orange)", row: 3, col: 0, len: 3, dir: "h" },
];

describe("applyMove", () => {
  it("blocks moves across orientation", () => {
    expect(applyMove(FIXTURE, "X", "up", 1).error).toBe("This car can't move that way");
  });
  it("blocks when another car is in the way", () => {
    expect(applyMove(FIXTURE, "X", "right", 1).error).toBe("Blocked by another car");
  });
  it("cars can't leave the grid", () => {
    expect(applyMove(FIXTURE, "A", "right", 1).error).toBe("Can't leave the parking lot");
  });
  it("moves exactly the chosen steps", () => {
    expect(applyMove(FIXTURE, "A", "left", 1).cars.find((c) => c.id === "A")?.col).toBe(3);
  });
  it("leaves the other cars where they were", () => {
    const r = applyMove(FIXTURE, "A", "left", 1);
    expect(r.error).toBeUndefined();
    expect(r.cars.find((c) => c.id === "O")).toMatchObject({ row: 0, col: 2 });
    expect(r.cars.find((c) => c.id === "X")).toMatchObject({ row: 2, col: 0 });
  });
});

describe("win condition", () => {
  it("solved when red front reaches the exit cell", () => {
    expect(isSolved([{ ...FIXTURE[0]!, col: 4 }])).toBe(true);
  });
  it("not solved one cell short", () => {
    expect(isSolved([{ ...FIXTURE[0]!, col: 3 }])).toBe(false);
  });
  it("not solved when the red car is off the exit row", () => {
    expect(isSolved([{ ...FIXTURE[0]!, col: 4, row: 1 }])).toBe(false);
  });
});

describe("the built-in puzzle is solvable", () => {
  it("clears in 9 slides, its stated par", () => {
    expect(minSolution(FIXTURE)).toBe(9);
  });
});

describe("runPlan", () => {
  it("reports the first invalid planned move", () => {
    const r = runPlan(FIXTURE, [
      { id: "A", move: "left", steps: 1 },
      { id: "X", move: "up", steps: 1 },
    ]);
    expect(r.failedAt).toBe(1);
    // the valid first move was still applied
    expect(r.cars.find((c) => c.id === "A")?.col).toBe(3);
  });
});

describe("pickHidden", () => {
  it("easy hides nothing", () => expect(pickHidden(FIXTURE, "easy").size).toBe(0));
  it("hard hides every car", () =>
    expect(pickHidden(FIXTURE, "hard").size).toBe(FIXTURE.length));
  it("murderer hides every car", () =>
    expect(pickHidden(FIXTURE, "murderer").size).toBe(FIXTURE.length));
  it("medium hides some, never the red car", () => {
    const h = pickHidden(FIXTURE, "medium");
    expect(h.size).toBe(Math.ceil((FIXTURE.length - 1) / 2));
    expect(h.has("X")).toBe(false);
  });
});

describe("generateRandomPuzzleOnTheFly", () => {
  it("returns a playable puzzle that really needs the claimed effort", () => {
    const p = generateRandomPuzzleOnTheFly(6);
    expect(p.cars.some((c) => c.id === "X")).toBe(true);
    expect(p.par).toBeGreaterThanOrEqual(6);
    expect(minSolution(p.cars)).toBe(p.par);
  });
});
