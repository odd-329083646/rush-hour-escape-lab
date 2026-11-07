import { describe, it, expect, beforeEach, vi } from "vitest";

const rows: { date: string; solve_time: number }[] = [];
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: (_c: string, date: string) => ({
          order: () => ({
            limit: async () => ({
              data: rows.filter((r) => r.date === date).sort((a, b) => a.solve_time - b.solve_time).slice(0, 1),
              error: null,
            }),
          }),
        }),
      }),
      insert: async (r: { date: string; solve_time: number }) => { rows.push(r); return { error: null }; },
    }),
  },
}));

const { submitScore, getBestTime, getMySolves, isSolvedOn } = await import("./daily-scores");

beforeEach(() => { localStorage.clear(); rows.length = 0; });

describe("daily scores", () => {
  it("first solve of a date is a record", async () => {
    expect((await submitScore({ date: "2026-03-01", solve_time: 50, player_name: "a" })).isRecord).toBe(true);
  });
  it("only a strictly faster time beats the global best", async () => {
    await submitScore({ date: "2026-03-01", solve_time: 50, player_name: "a" });
    expect(await submitScore({ date: "2026-03-01", solve_time: 60, player_name: "b" })).toEqual({ best: 50, isRecord: false });
    expect((await submitScore({ date: "2026-03-01", solve_time: 50, player_name: "d" })).isRecord).toBe(false);
    expect((await submitScore({ date: "2026-03-01", solve_time: 40, player_name: "c" })).isRecord).toBe(true);
    expect(await getBestTime("2026-03-01")).toBe(40);
    expect(getMySolves()["2026-03-01"]).toBe(40);
  });
  it("marks a date solved after a submit", async () => {
    expect(isSolvedOn("2026-03-02")).toBe(false);
    await submitScore({ date: "2026-03-02", solve_time: 30, player_name: "a" });
    expect(isSolvedOn("2026-03-02")).toBe(true);
  });
});
