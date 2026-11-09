import { beforeEach, describe, expect, it } from "vitest";
import { completeTutorial, hasSeenTutorial, markTutorialSeen } from "./tutorial";
import { getCoins } from "./puzzles";

describe("tutorial reward", () => {
  beforeEach(() => localStorage.clear());
  it("awards 50 coins on first completion", () => {
    expect(completeTutorial()).toBe(true);
    expect(getCoins()).toBe(50);
  });
  it("does not award again on repeat completion", () => {
    completeTutorial();
    expect(completeTutorial()).toBe(false);
    expect(getCoins()).toBe(50);
  });
});

describe("first-time tutorial flag", () => {
  beforeEach(() => localStorage.clear());
  it("is unset for new visitors and set after viewing", () => {
    expect(hasSeenTutorial()).toBe(false);
    markTutorialSeen();
    expect(hasSeenTutorial()).toBe(true);
    expect(hasSeenTutorial()).toBe(true);
  });
});
