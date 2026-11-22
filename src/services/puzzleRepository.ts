// src/services/puzzleRepository.ts
import type { RawPuzzleDO } from "./types";

const PUZZLES_URL =
  "https://raw.githubusercontent.com/odd-329083646/rush-hour-escape-lab/refs/heads/main/public/puzzles.json";

export const puzzleRepository = {
  async fetchCatalogue(): Promise<RawPuzzleDO[]> {
    const response = await fetch(`${PUZZLES_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load external puzzles (${response.status})`);
    }

    const data: unknown = await response.json();
    const raw = Array.isArray(data) ? data : (data as { puzzles?: unknown[] })?.puzzles;
    if (!Array.isArray(raw)) {
      throw new Error("Invalid puzzles payload format");
    }

    return raw as RawPuzzleDO[];
  },

  async fetchDailyPuzzle(dateKey: string): Promise<RawPuzzleDO> {
    const res = await fetch(`/daily_puzzles.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`daily_puzzles.json ${res.status}`);
    }

    const data = (await res.json()) as Record<string, RawPuzzleDO | undefined>;
    const puzzle = data?.[dateKey];
    if (!puzzle) {
      throw new Error(`No daily puzzle entry for ${dateKey}`);
    }

    return puzzle;
  },
};

export async function loadPuzzlesAsync(repo = puzzleRepository): Promise<RawPuzzleDO[]> {
  return repo.fetchCatalogue();
}

export async function getDailyPuzzleAsync(
  dateKey: string,
  repo = puzzleRepository,
): Promise<RawPuzzleDO> {
  return repo.fetchDailyPuzzle(dateKey);
}