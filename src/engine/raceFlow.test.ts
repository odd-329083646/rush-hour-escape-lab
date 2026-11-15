import { expect, it } from "vitest";
import { raceWaitRemaining, raceIntroPhase } from "./tournament";

it("expires random searches at exactly 60 seconds", () => {
  const match = { private: false, created_at: new Date(0).toISOString() };
  expect(raceWaitRemaining(match, 0)).toBe(60);
  expect(raceWaitRemaining(match, 59_000)).toBe(1);
  expect(raceWaitRemaining(match, 60_000)).toBe(0);
});
it("keeps the private invitation deadline at 30 seconds", () => {
  expect(raceWaitRemaining({ private: true, created_at: new Date(0).toISOString() }, 0)).toBe(30);
});
it("shows VS before countdown and blocks play until the server start", () => {
  const start = new Date(6000).toISOString();
  expect(raceIntroPhase(start, 0)).toBe("vs");
  expect(raceIntroPhase(start, 2999)).toBe("vs");
  expect(raceIntroPhase(start, 3000)).toBe("countdown");
  expect(raceIntroPhase(start, 6000)).toBe("playing");
});