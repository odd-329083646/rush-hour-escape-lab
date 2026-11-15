import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ action: vi.fn() }));
vi.mock("@/hooks/use-tournament", () => ({ useTournament: () => ({ snapshot: null, ready: true, busy: false, action: mocks.action, commitMove: vi.fn(), clockOffset: 0 }) }));
vi.mock("@/hooks/useProfile", () => ({ useProfile: () => ({ profile: { username: "Guest", country: "IL", avatarId: "car" } }) }));
vi.mock("@/hooks/useDuelInvitations", () => ({ useDuelInvitations: () => ({ inbox: { playerCode: "", invitations: [] }, send: vi.fn() }) }));
vi.mock("@/lib/puzzles", () => ({ getCoins: () => 100 }));
import { useCompetitions } from "./useCompetitions";
afterEach(() => { cleanup(); mocks.action.mockReset(); });
it("shows unavailable-room state only for a failed join, never a cancelled search", async () => {
  mocks.action.mockResolvedValue({ error: "unavailable" });
  const { result } = renderHook(() => useCompetitions());
  await act(async () => { await result.current.begin("join", "000000"); });
  expect(result.current.unavailable).toBe(true);
  await act(async () => { await result.current.begin("random"); });
  expect(result.current.unavailable).toBe(false);
  await act(async () => { await result.current.action("cancel"); });
  expect(result.current.unavailable).toBe(false);
});