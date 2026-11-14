import { beforeEach, describe, expect, it } from "vitest";
import { getProfile, getPlayerRecords, levelBests, saveProfile, validateUsername } from "./profile";
import { translate, translateError } from "./i18n";

beforeEach(() => localStorage.clear());

describe("profile", () => {
  it("creates a Guest_XXXX username on first load and keeps it", () => {
    const p = getProfile();
    expect(p.username).toMatch(/^Guest_[A-Z0-9]{4}$/);
    expect(getProfile().username).toBe(p.username);
  });

  it("saves edited username and country", () => {
    saveProfile({ username: "Odya", country: "IL" });
    expect(getProfile()).toEqual({ username: "Odya", country: "IL", avatarId: "car" });
  });

  it("computes best time and fewest moves per level", () => {
    localStorage.setItem("rush_hour_progress_easy", JSON.stringify({
      0: { stars: 3, bestTime: 40, bestMoves: 9 },
      1: { stars: 2, bestTime: 25, bestMoves: 12 },
    }));
    expect(levelBests("easy")).toEqual({ bestTime: 25, bestMoves: 9 });
    expect(levelBests("hard")).toEqual({ bestTime: null, bestMoves: null });
  });
  it("rejects blank usernames without replacing the existing name", () => {
    expect(validateUsername("   ")).toBeNull();
  });
  it("trims names and accepts exactly 20 characters but rejects 21", () => {
    expect(validateUsername("  Odya  ")).toBe("Odya");
    expect(validateUsername("12345678901234567890")).toBe("12345678901234567890");
    expect(validateUsername("123456789012345678901")).toBeNull();
  });
  it("preserves avatar selection when settings edits only username or country", () => {
    saveProfile({ username: "Odya", country: "IL", avatarId: "crown" });
    saveProfile({ username: "Daniel", country: "US" });
    expect(getProfile()).toEqual({ username: "Daniel", country: "US", avatarId: "crown" });
  });
  it("falls back to the racing car for legacy and unknown avatars", () => {
    localStorage.setItem("rush_hour_profile", JSON.stringify({ username: "Legacy", country: "IL", avatarId: "missing" }));
    expect(getProfile().avatarId).toBe("car");
  });
  it("derives completed levels, daily solves, race results and coins without counting unsolved attempts", () => {
    localStorage.setItem("rush_hour_progress_easy", JSON.stringify({ 0: { stars: 3 }, 1: { stars: 0 } }));
    localStorage.setItem("rush_hour_progress_hard", JSON.stringify({ 0: { stars: 1 } }));
    localStorage.setItem("daily_my_solves", JSON.stringify({ "2026-11-13": 0, "2026-11-14": 42 }));
    localStorage.setItem("rush_hour_tournament_stats", JSON.stringify({ wins: 4, losses: 2 }));
    localStorage.setItem("rush_hour_coins", "140");
    expect(getPlayerRecords()).toEqual({ standardCompleted: 2, dailySolved: 2, wins: 4, losses: 2, coins: 140 });
  });
});

describe("i18n", () => {
  it("renders single-language labels", () => {
    expect(translate("en", "execute")).toBe("Execute");
    expect(translate("he", "execute")).toBe("בצע");
    expect(translate("he", "level", { n: 3 })).toBe("שלב 3");
    expect(translateError("he", "Blocked by another car")).toBe("חסום על ידי מכונית אחרת");
  });
});
