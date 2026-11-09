import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useGameEngine, movementRange } from "./useGameEngine";
import { fallbackRacePuzzles } from "@/engine/tournament";

afterEach(() => { cleanup(); vi.useRealTimers(); });
it("commits sequential local moves immediately without touching network or storage", () => {
  const network = vi.spyOn(globalThis, "fetch");
  const storage = vi.spyOn(Storage.prototype, "setItem");
  const cars = fallbackRacePuzzles()[0]?.cars ?? [];
  const { result } = renderHook(() => useGameEngine(cars));
  act(() => {
    expect(result.current.commitMove("O", "down", 3).error).toBeUndefined();
    expect(result.current.commitMove("X", "right", 4).error).toBeUndefined();
  });
  expect(result.current.cars.find((car) => car.id === "X")?.col).toBe(4);
  expect(result.current.moves).toBe(2);
  expect(result.current.solved).toBe(true);
  expect(network).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
  network.mockRestore(); storage.mockRestore();
});
it("keeps the local timer running independently and stops it on completion", () => {
  vi.useFakeTimers(); vi.setSystemTime(10000);
  const { result } = renderHook(() => useGameEngine());
  act(() => result.current.setStartedAt(10000));
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.now).toBe(11000);
  act(() => result.current.setWonAt(11000));
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.now).toBe(11000);
});
it("restricts visual drag to free cells without crossing hidden blockers", () => {
  const cars = fallbackRacePuzzles()[0]?.cars ?? [];
  const red = cars.find((car) => car.id === "X");
  if (!red) throw new Error("Missing fixture");
  expect(movementRange(cars, red)).toEqual({ back: 0, fwd: 1 });
});