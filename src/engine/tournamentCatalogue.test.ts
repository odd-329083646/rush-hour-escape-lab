import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inflateCars, isValidPuzzle } from "@/engine/game";
import { PUZZLES } from "@/engine/tournamentCatalogue";

describe("Bundled tournament catalogue", () => {
  it("preserves every valid public puzzle and its exact index ordering", () => {
    const original: unknown[] = JSON.parse(readFileSync("public/puzzles.json", "utf8"));
    const expected = original.filter(isValidPuzzle).map((puzzle) => ({
      par: puzzle.par,
      cars: inflateCars(puzzle.cars),
    }));
    expect(PUZZLES.length).toBeGreaterThan(2);
    expect(PUZZLES).toEqual(expected);
  });
});
