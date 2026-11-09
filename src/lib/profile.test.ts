import { beforeEach, describe, expect, it } from "vitest";
import { getProfile, levelBests, saveProfile } from "./profile";
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
    expect(getProfile()).toEqual({ username: "Odya", country: "IL" });
  });

  it("computes best time and fewest moves per level", () => {
    localStorage.setItem("rush_hour_progress_easy", JSON.stringify({
      0: { stars: 3, bestTime: 40, bestMoves: 9 },
      1: { stars: 2, bestTime: 25, bestMoves: 12 },
    }));
    expect(levelBests("easy")).toEqual({ bestTime: 25, bestMoves: 9 });
    expect(levelBests("hard")).toEqual({ bestTime: null, bestMoves: null });
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
