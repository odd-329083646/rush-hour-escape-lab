import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { fallbackRacePuzzles, type RaceSnapshot } from "@/engine/tournament";
import { storageService } from "@/services/storageService";
import { tournamentStats } from "@/engine/tournament-device";
import { getProfile } from "@/engine/profile";

const rpc = vi.hoisted(() => ({ invoke: vi.fn(), register: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/tournament.functions", () => ({ registerTournamentGuest: rpc.register, tournamentAction: rpc.invoke }));
vi.mock("@/services/supabaseService", async (importOriginal) => ({ ...await importOriginal<typeof import("@/services/supabaseService")>(), subscribeRace: () => () => {} }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
import { useTournament } from "./use-tournament";

afterEach(() => { cleanup(); rpc.invoke.mockReset(); storageService.resetCache(); localStorage.clear(); });

function entryFixture(status: "finished" | "cancelled" | "playing"): RaceSnapshot {
  const puzzles = fallbackRacePuzzles();
  const first = puzzles[0];
  if (!first) throw new Error("Missing fixture");
  return {
    guest: { id: "guest-a", coins: 190, wins: 7, losses: 2 }, serverNow: new Date().toISOString(),
    match: { id: "old-match", a: "guest-a", b: "guest-b", private: false, room_code: null, status, puzzle_indices: null, puzzles,
      a_state: { index: status === "finished" ? 3 : 0, moves: 0, totalMoves: 9, elapsed: 20, cars: first.cars }, b_state: null,
      a_name: "A", a_country: "IL", b_name: "B", b_country: "US", started_at: new Date(Date.now() - 5000).toISOString(),
      winner: status === "finished" ? "guest-a" : null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  };
}

it.each(["finished", "cancelled"] as const)("dismisses a stale %s match on entry and keeps it hidden after polling", async (status) => {
  storageService.setItem("rush_hour_guest_capability", JSON.stringify({ id: "guest-a", token: "capability" }));
  rpc.invoke.mockResolvedValue(entryFixture(status));
  const { result } = renderHook(() => useTournament({ resetResultsOnEntry: true }));
  await waitFor(() => expect(result.current.ready).toBe(true));
  expect(result.current.snapshot?.match).toBeNull();
  await act(async () => { await result.current.action("status"); });
  expect(result.current.snapshot?.match).toBeNull();
});

it("preserves profile, total wins and daily world records when dismissing an entry result", async () => {
  storageService.setItem("rush_hour_guest_capability", JSON.stringify({ id: "guest-a", token: "capability" }));
  storageService.setItem("rush_hour_profile", JSON.stringify({ username: "Odya", country: "IL", avatarId: "flame" }));
  storageService.setItem("rush_hour_tournament_stats", JSON.stringify({ wins: 7, losses: 2 }));
  storageService.setItem("daily_world_records", "4");
  const profile = getProfile();
  rpc.invoke.mockResolvedValue(entryFixture("finished"));
  const { result } = renderHook(() => useTournament({ resetResultsOnEntry: true }));
  await waitFor(() => expect(result.current.ready).toBe(true));
  expect(tournamentStats()).toEqual({ wins: 7, losses: 2 });
  expect(storageService.getItem("daily_world_records")).toBe("4");
  expect(getProfile()).toEqual(profile);
});

it("resumes active matches and shows new results earned during the visit", async () => {
  storageService.setItem("rush_hour_guest_capability", JSON.stringify({ id: "guest-a", token: "capability" }));
  rpc.invoke.mockResolvedValue(entryFixture("playing"));
  const { result } = renderHook(() => useTournament({ resetResultsOnEntry: true }));
  await waitFor(() => expect(result.current.ready).toBe(true));
  expect(result.current.snapshot?.match?.status).toBe("playing");
  rpc.invoke.mockResolvedValue(entryFixture("finished"));
  await act(async () => { await result.current.action("status"); });
  expect(result.current.snapshot?.match?.status).toBe("finished");
});

it("shows the result of a new match after hiding an old entry result", async () => {
  storageService.setItem("rush_hour_guest_capability", JSON.stringify({ id: "guest-a", token: "capability" }));
  rpc.invoke.mockResolvedValue(entryFixture("finished"));
  const { result } = renderHook(() => useTournament({ resetResultsOnEntry: true }));
  await waitFor(() => expect(result.current.ready).toBe(true));
  const next = entryFixture("finished");
  if (!next.match) throw new Error("Missing match");
  next.match.id = "new-match";
  rpc.invoke.mockResolvedValue(next);
  await act(async () => { await result.current.action("random"); });
  expect(result.current.snapshot?.match?.id).toBe("new-match");
  expect(result.current.snapshot?.match?.status).toBe("finished");
});
it("accepts another local move while its first server validation is still pending", async () => {
  storageService.setItem("rush_hour_guest_capability", JSON.stringify({ id: "guest-a", token: "capability" }));
  storageService.setItem("rush_hour_coins", "100");
  const puzzles = fallbackRacePuzzles();
  const first = puzzles[0];
  if (!first) throw new Error("Missing fixture");
  const snapshot: RaceSnapshot = {
    guest: { id: "guest-a", coins: 100, wins: 0, losses: 0 }, serverNow: new Date().toISOString(),
    match: { id: "match", a: "guest-a", b: "guest-b", private: true, room_code: "123456", status: "playing", puzzle_indices: null, puzzles,
      a_state: { index: 0, moves: 0, totalMoves: 0, elapsed: 0, cars: first.cars }, b_state: null,
      a_name: "A", a_country: "IL", b_name: "B", b_country: "IL",
      started_at: new Date(Date.now() - 5000).toISOString(), winner: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  };
  let resolveMove: ((value: RaceSnapshot) => void) | undefined;
  rpc.invoke.mockImplementation(({ data }: { data: { action: string } }) => data.action === "move"
    ? new Promise<RaceSnapshot>((resolve) => { resolveMove = resolve; }) : Promise.resolve(snapshot));
  const { result } = renderHook(() => useTournament());
  await waitFor(() => expect(result.current.ready).toBe(true));
  act(() => result.current.commitMove("O", "down", 3));
  await waitFor(() => expect(resolveMove).toBeDefined());
  expect(result.current.busy).toBe(true);
  act(() => result.current.commitMove("X", "right", 4));
  expect(result.current.snapshot?.match?.a_state.index).toBe(1);
  expect(result.current.snapshot?.match?.a_state.totalMoves).toBe(2);
  expect(rpc.invoke.mock.calls.filter(([args]) => args.data.action === "move")).toHaveLength(1);
  // The pending RPC never resolves during the assertion: the board did not wait for it.
});
it("sends moves made during a pending request together in the next single request", async () => {
  storageService.setItem("rush_hour_guest_capability", JSON.stringify({ id: "guest-a", token: "capability" }));
  storageService.setItem("rush_hour_coins", "100");
  const puzzles = fallbackRacePuzzles();
  const first = puzzles[0]!;
  const snapshot: RaceSnapshot = {
    guest: { id: "guest-a", coins: 100, wins: 0, losses: 0 }, serverNow: new Date().toISOString(),
    match: { id: "match", a: "guest-a", b: "guest-b", private: true, room_code: "123456", status: "playing", puzzle_indices: null, puzzles,
      a_state: { index: 0, moves: 0, totalMoves: 0, elapsed: 0, cars: first.cars }, b_state: null,
      a_name: "A", a_country: "IL", b_name: "B", b_country: "IL",
      started_at: new Date(Date.now() - 5000).toISOString(), winner: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  };
  const resolvers: ((v: RaceSnapshot) => void)[] = [];
  rpc.invoke.mockImplementation(({ data }: { data: { action: string } }) => data.action === "move"
    ? new Promise<RaceSnapshot>((resolve) => { resolvers.push(resolve); }) : Promise.resolve(snapshot));
  const { result } = renderHook(() => useTournament());
  await waitFor(() => expect(result.current.ready).toBe(true));
  act(() => result.current.commitMove("O", "down", 3));
  await waitFor(() => expect(resolvers).toHaveLength(1));
  act(() => result.current.commitMove("X", "right", 4));
  act(() => result.current.commitMove("A", "down", 2));
  await act(async () => { resolvers[0]!(snapshot); });
  await waitFor(() => expect(resolvers).toHaveLength(2));
  const moveCalls = rpc.invoke.mock.calls.filter(([args]) => args.data.action === "move");
  expect(moveCalls[1]![0].data.moves).toHaveLength(2);
});
