import { inflateCars, isValidPuzzle, todayKey, setPuzzleCatalogue, type Car } from "@/engine/game";

export async function loadPuzzlesAsync(): Promise<{ par: number; cars: Car[] }[]> {
  try {
    const PUZZLES_URL = "https://raw.githubusercontent.com/odd-329083646/rush-hour-escape-lab/refs/heads/main/public/puzzles.json";
    
    const response = await fetch(`${PUZZLES_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load external puzzles (${response.status})`);
    
    const data: unknown = await response.json();
    const raw = Array.isArray(data) ? data : (data as { puzzles?: unknown[] })?.puzzles;
    const loadedPuzzles = (Array.isArray(raw) ? raw : [])
      .filter(isValidPuzzle)
      .map((p) => ({ par: p.par, cars: inflateCars(p.cars) }))
      .sort((a, b) => a.par - b.par);

    if (!loadedPuzzles.length) throw new Error("No valid puzzles in puzzles.json");

    console.log(`Loaded ${loadedPuzzles.length} puzzles successfully from GitHub!`);
    setPuzzleCatalogue(loadedPuzzles, false);
    return loadedPuzzles;
  } catch (err) {
    console.warn("Could not load puzzles.json from network. Switching to offline generator mode:", err);
    

    // Serve a validated snapshot immediately; background generation never blocks the board.
    const { DEFAULT_PUZZLES } = await import("@/engine/game");
    const offlinePuzzles = DEFAULT_PUZZLES;
    setPuzzleCatalogue(offlinePuzzles, true);
    return offlinePuzzles;
  }
}

export async function getDailyPuzzleAsync(dateStr?: string): Promise<{ par: number; cars: Car[] }> {
  const key = dateStr ?? todayKey();
  try {
    const res = await fetch(`/daily_puzzles.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`daily_puzzles.json ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    const p = data?.[key];
    if (!isValidPuzzle(p)) throw new Error(`No valid daily puzzle for ${key}`);
    return { par: p.par, cars: inflateCars(p.cars) };
  } catch (err) {
    console.warn("Daily puzzle unavailable, generating one:", err);
    const { DEFAULT_PUZZLES } = await import("@/engine/game");
    return DEFAULT_PUZZLES[0] ?? { par: 1, cars: inflateCars([{ id: "X", row: 2, col: 0, dir: "h" }]) };
  }
}

