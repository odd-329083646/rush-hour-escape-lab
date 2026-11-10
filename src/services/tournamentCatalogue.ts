import rawPuzzles from "../../public/puzzles.json";
import { inflateCars, isValidPuzzle } from "@/engine/game";

// Immutable build snapshot: dynamic regular-game loading must never reorder race indices.
export const PUZZLES = rawPuzzles.filter(isValidPuzzle).map((puzzle) => ({
  par: puzzle.par,
  cars: inflateCars(puzzle.cars),
}));