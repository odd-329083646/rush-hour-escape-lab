import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useHints } from "./use-hints";
import { getCoins } from "@/lib/puzzles";

afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); });
it.each([["next", 15], ["peek", 25], ["reveal", 40], ["validate", 20]] as const)("deducts exactly the %s price and refuses insufficient coins", (type, cost) => {
  localStorage.setItem("rush_hour_coins", String(cost));
  const { result } = renderHook(() => useHints(vi.fn()));
  expect(result.current.charge(type)).toBe(true);
  expect(getCoins()).toBe(0);
  expect(result.current.charge(type)).toBe(false);
  expect(getCoins()).toBe(0);
});
it("hides the peek after three seconds and clears it on reset", () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useHints(vi.fn()));
  act(() => result.current.startPeek());
  act(() => vi.advanceTimersByTime(2999));
  expect(result.current.peek).toBe(true);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.peek).toBe(false);
  act(() => result.current.startPeek());
  act(() => result.current.reset());
  expect(result.current.peek).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});