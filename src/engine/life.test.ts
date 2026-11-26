import { describe, expect, it } from "vitest";
import { applyLife, lifeOptions } from "./life";

describe("1 Life recovery", () => {
  it("discounts exactly 3 counted moves", () => {
    expect(applyLife("moves", { moves: 20, bumps: 1 })).toEqual({ moves: 17, bumps: 1 });
  });
  it("removes exactly 1 collision (3 -> 2)", () => {
    expect(applyLife("bump", { moves: 5, bumps: 3 })).toEqual({ moves: 5, bumps: 2 });
  });
  it("is not offered for invalid murderer plans", () => {
    expect(lifeOptions("plan", { moves: 9, bumps: 3 })).toEqual({ moves: false, bump: false });
  });
});
