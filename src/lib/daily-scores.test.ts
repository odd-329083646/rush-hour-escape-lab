import { describe, it, expect, beforeEach } from "vitest";
import { submitScore, getBestTime, getMySolves } from "./daily-scores";

beforeEach(() => localStorage.clear());

describe("daily scores", () => {
  it("first solve of a date is a record", async () => {
    expect((await submitScore({ date: "2026-03-01", solve_time: 50, player_name: "a" })).isRecord).toBe(true);
  });
  it("only a faster time beats the best", async () => {
    await submitScore({ date: "2026-03-01", solve_time: 50, player_name: "a" });
    expect((await submitScore({ date: "2026-03-01", solve_time: 60, player_name: "b" })).isRecord).toBe(false);
    expect((await submitScore({ date: "2026-03-01", solve_time: 40, player_name: "c" })).isRecord).toBe(true);
    expect(await getBestTime("2026-03-01")).toBe(40);
    expect(getMySolves()["2026-03-01"]).toBe(40);
  });
});
