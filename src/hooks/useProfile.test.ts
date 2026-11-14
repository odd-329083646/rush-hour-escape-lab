import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { getProfile } from "@/engine/profile";
import { storageService } from "@/services/storageService";
const rpc = vi.hoisted(() => ({ register: vi.fn(), sync: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/tournament.functions", () => ({ registerTournamentGuest: rpc.register, syncTournamentProfile: rpc.sync }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { useProfile, useProfileSync } from "./useProfile";

afterEach(() => { cleanup(); rpc.register.mockReset(); rpc.sync.mockReset(); storageService.resetCache(); localStorage.clear(); });

it("updates name and avatar immediately while online saving is still pending", async () => {
  storageService.setItem("rush_hour_guest_capability", JSON.stringify({ id: "device-guest", token: "capability" }));
  rpc.sync.mockImplementation(() => new Promise(() => {}));
  const { result } = renderHook(() => { useProfileSync(); return useProfile(); });
  act(() => { result.current.updateUsername("  Odya  "); result.current.updateAvatar("flame"); });
  expect(result.current.profile.username).toBe("Odya");
  expect(result.current.profile.avatarId).toBe("flame");
  storageService.flush();
  expect(JSON.parse(localStorage.getItem("rush_hour_profile") ?? "{}").avatarId).toBe("flame");
  await waitFor(() => expect(rpc.sync).toHaveBeenCalledTimes(1));
  expect(rpc.sync.mock.calls[0]?.[0].data.profile).toEqual(getProfile());
});

it("rejects invalid edits and never syncs coins or race results as editable records", async () => {
  storageService.setItem("rush_hour_guest_capability", JSON.stringify({ id: "device-guest", token: "capability" }));
  rpc.sync.mockResolvedValue({ saved: true });
  const { result } = renderHook(() => { useProfileSync(); return useProfile(); });
  const initial = result.current.profile;
  act(() => { result.current.updateUsername(" "); result.current.updateUsername("123456789012345678901"); result.current.updateAvatar("not-an-avatar"); });
  expect(result.current.profile).toEqual(initial);
  await waitFor(() => expect(rpc.sync).toHaveBeenCalledTimes(1));
  expect(rpc.sync.mock.calls[0]?.[0].data.records).toEqual({ standardCompleted: 0, dailySolved: 0 });
});