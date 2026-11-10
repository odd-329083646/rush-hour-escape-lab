import { beforeEach, describe, expect, it } from "vitest";
import { advanceRace, COUNTDOWN_MS, ENTRY_FEE, fallbackRacePuzzles, normalizeRoomCode, ROOM_WAIT_MS, WIN_REWARD, type RaceState, type RaceSnapshot } from "./tournament";
import { minSolution, getCoins } from "./puzzles";
import { applyTournamentSnapshot, saveGuestCredential, walletDelta } from "./tournament-device";

beforeEach(() => localStorage.clear());
it("charges 50 coins for entry", () => expect(ENTRY_FEE).toBe(50));
it("awards 90 coins to the winner", () => expect(WIN_REWARD).toBe(90));
it("expires friend rooms after 30 seconds", () => expect(ROOM_WAIT_MS).toBe(30000));
it("counts down for three seconds before play", () => expect(COUNTDOWN_MS).toBe(3000));
it("requires a six-digit friend room code", () => {
  expect(normalizeRoomCode("584-912")).toBe("584912");
  expect(normalizeRoomCode("12345")).toBeNull();
  expect(normalizeRoomCode("1234567")).toBeNull();
});
describe("three-puzzle race", () => {
  it("supplies exactly three solvable puzzles", () => {
    const puzzles = fallbackRacePuzzles();
    expect(puzzles).toHaveLength(3);
    for (const puzzle of puzzles) expect(minSolution(puzzle.cars)).toBe(puzzle.par);
  });
  it("advances immediately on escape and preserves cumulative move counts", () => {
    const puzzles = fallbackRacePuzzles();
    const first = puzzles[0];
    if (!first) throw new Error("Missing first puzzle");
    let state: RaceState = { index: 0, moves: 0, totalMoves: 0, elapsed: 0, cars: first.cars };
    state = advanceRace(puzzles, state, "O", "down", 3, 1).state;
    state = advanceRace(puzzles, state, "X", "right", 4, 2).state;
    expect(state.index).toBe(1);
    expect(state.totalMoves).toBe(2);
    expect(state.cars).toEqual(puzzles[1]?.cars);
    expect(state.moves).toBe(0);
  });
  it("rejects collisions without adding moves or changing progress", () => {
    const puzzles = fallbackRacePuzzles();
    const state: RaceState = { index: 0, moves: 0, totalMoves: 0, elapsed: 0, cars: puzzles[0]?.cars ?? [] };
    const result = advanceRace(puzzles, state, "X", "right", 4, 2);
    expect(result.error).toBe("Blocked by another car");
    expect(result.state).toEqual(state);
  });
});
it("imports existing coins once, deducts 50, and applies the 90-coin payout without duplicate credit", () => {
  localStorage.setItem("rush_hour_coins", "150");
  saveGuestCredential({ id: "guest", token: "secret" });
  expect(walletDelta()).toBe(0);
  const snapshot: RaceSnapshot = { guest: { id: "guest", coins: 100, wins: 0, losses: 0 }, match: null, serverNow: "2026-11-09T20:00:00Z" };
  applyTournamentSnapshot(snapshot, 150);
  expect(getCoins()).toBe(100);
  snapshot.guest.coins = 190;
  snapshot.guest.wins = 1;
  applyTournamentSnapshot(snapshot, 100);
  applyTournamentSnapshot(snapshot, 190);
  expect(getCoins()).toBe(190);
  expect(walletDelta()).toBe(0);
});