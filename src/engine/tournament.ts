import { applyMove, isSolved, type Car, type Move } from "@/engine/game";
import { PUZZLES } from "@/services/tournamentCatalogue";

export const ENTRY_FEE = 50;
export const WIN_REWARD = 90;
export const ROOM_WAIT_MS = 30_000;
export const COUNTDOWN_MS = 3_000;

export type RacePuzzle = { par: number; cars: Car[] };
export type RaceState = { index: number; moves: number; totalMoves: number; elapsed: number; cars: Car[] };
export type GuestCredential = { id: string; token: string };
export type RaceGuest = { id: string; coins: number; wins: number; losses: number };
export type RaceMatch = {
  id: string; a: string; b: string | null; private: boolean; room_code: string | null;
  status: "waiting" | "playing" | "finished" | "cancelled"; puzzle_indices: number[] | null;
  /** Read-only compatibility for matches created before index-based races. */
  puzzles?: RacePuzzle[];
  a_state: RaceState; b_state: RaceState | null; a_name: string; a_country: string;
  b_name: string | null; b_country: string | null; started_at: string | null;
  winner: string | null; created_at: string; updated_at: string;
};
export type RaceSnapshot = { guest: RaceGuest; match: RaceMatch | null; serverNow: string; error?: string };

export function resolveRacePuzzles(match: Pick<RaceMatch, "puzzle_indices" | "puzzles">): RacePuzzle[] {
  if (match.puzzle_indices === null) return match.puzzles ?? [];
  if (match.puzzle_indices.length !== 3) throw new Error("Three puzzle indices required");
  return match.puzzle_indices.map((index) => {
    const puzzle = PUZZLES[index];
    if (!Number.isInteger(index) || index < 0 || !puzzle) throw new Error("Invalid puzzle index");
    return puzzle;
  });
}

export function pickRacePuzzleIndices(random: () => number = Math.random): number[] {
  const available = PUZZLES.map((_, index) => index);
  if (available.length < 3) throw new Error("Three puzzles required");
  return Array.from({ length: 3 }, () => {
    const position = Math.floor(random() * available.length);
    const [index] = available.splice(position, 1);
    if (index === undefined) throw new Error("Invalid random puzzle selection");
    return index;
  });
}

const red: Car = { id: "X", name: "X", color: "var(--car-red)", row: 2, col: 0, len: 2, dir: "h" };
const truck: Car = { id: "O", name: "O", color: "var(--car-yellow)", row: 0, col: 3, len: 3, dir: "v" };
const blue: Car = { id: "A", name: "A", color: "var(--car-blue)", row: 2, col: 3, len: 2, dir: "v" };

export function fallbackRacePuzzles(): RacePuzzle[] {
  return [
    { par: 2, cars: [{ ...red }, { ...truck }] },
    { par: 2, cars: [{ ...red }, { ...blue }] },
    { par: 3, cars: [{ ...red }, { ...truck }, { ...blue, col: 4 }] },
  ];
}

export function normalizeRoomCode(code: string): string | null {
  const normalized = code.replace(/[\s-]/g, "");
  return /^\d{6}$/.test(normalized) ? normalized : null;
}
export function formatRoomCode(code: string): string { 
  return `${code.slice(0, 3)}-${code.slice(3)}`; 
}

export function advanceRace(
  puzzles: RacePuzzle[], 
  state: RaceState, 
  id: string, 
  move: Move, 
  steps: number, 
  elapsed: number
): { state: RaceState; error?: string } {
  if (!Number.isInteger(steps) || steps < 1 || steps > 4 || state.index >= 3) {
    return { state, error: "Invalid move" };
  }
  
  const result = applyMove(state.cars, id, move, steps);
  if (result.error) return { state, error: result.error };
  
  const puzzleSolved = isSolved(result.cars);
  const nextIndex = state.index + (puzzleSolved ? 1 : 0);
  
  return {
    state: {
      index: nextIndex,
      totalMoves: state.totalMoves + 1,
      moves: puzzleSolved ? 0 : state.moves + 1,
      elapsed,
      cars: puzzleSolved ? (puzzles[nextIndex]?.cars ?? result.cars) : result.cars
    }
  };
}
