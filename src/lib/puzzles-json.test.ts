import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadPuzzlesAsync, DEFAULT_PUZZLES, type PuzzleRaw } from "./puzzles";

const JSON_PATH = path.resolve(process.cwd(), "public/puzzles.json");

function readRawPuzzles(): unknown {
  return JSON.parse(readFileSync(JSON_PATH, "utf-8"));
}

afterEach(() => vi.unstubAllGlobals());

describe("public/puzzles.json", () => {
  const data = readRawPuzzles();

  it("is a single valid JSON array", () => {
    expect(Array.isArray(data)).toBe(true);
  });

  it("has at least one puzzle and every entry is playable", () => {
    const list = data as PuzzleRaw[];
    expect(list.length).toBeGreaterThan(0);
    for (const p of list) {
      expect(typeof p.par).toBe("number");
      expect(p.par).toBeGreaterThan(0);
      expect(p.cars.some((c) => c.id === "X")).toBe(true);
      for (const c of p.cars) {
        expect(["h", "v"]).toContain(c.dir);
        expect(c.row).toBeGreaterThanOrEqual(0);
        expect(c.row).toBeLessThanOrEqual(5);
        expect(c.col).toBeGreaterThanOrEqual(0);
        expect(c.col).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe("loadPuzzlesAsync", () => {
  it("fetches /puzzles.json, inflates and sorts the puzzles", async () => {
    const raw: PuzzleRaw[] = [
      { par: 20, cars: [{ id: "X", row: 2, col: 0, dir: "h" }, { id: "O", row: 0, col: 2, dir: "v" }] },
      { par: 5, cars: [{ id: "X", row: 2, col: 3, dir: "h" }] },
    ];
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(raw), { status: 200 })));
    const loaded = await loadPuzzlesAsync();
    expect(loaded.map((p) => p.par)).toEqual([5, 20]);
    // every car got its full definition inflated from CAR_DEFAULTS
    for (const p of loaded) for (const c of p.cars) {
      expect(c.name).toBeTruthy();
      expect(c.color).toBeTruthy();
      expect([2, 3]).toContain(c.len);
    }
  });

  it("falls back to the built-in list when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json", { status: 500 })));
    const loaded = await loadPuzzlesAsync();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.cars.some((c) => c.id === "X")).toBe(true);
  });

  it("falls back when the JSON is malformed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("[{oops", { status: 200 })));
    const loaded = await loadPuzzlesAsync();
    expect(loaded).toHaveLength(1);
  });

  it("drops invalid entries instead of crashing", async () => {
    const raw = [
      { par: 7, cars: [{ id: "X", row: 2, col: 0, dir: "h" }] },
      { par: 8, cars: [] }, // no red car — must be dropped
      { par: "nine", cars: [{ id: "X", row: 2, col: 0, dir: "h" }] }, // bad par
      { par: 9, cars: [{ id: "X", row: 99, col: 0, dir: "h" }] }, // off the board
    ];
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(raw), { status: 200 })));
    const loaded = await loadPuzzlesAsync();
    expect(loaded.map((p) => p.par)).toEqual([7]);
  });
});
