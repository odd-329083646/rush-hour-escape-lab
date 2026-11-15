import { act, cleanup, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useSettings } from "./useSettings";
import { useTournamentBoard } from "./useTournamentBoard";
import { storageService } from "@/services/storageService";
import type { Car } from "@/lib/puzzles";
import type { PointerEvent } from "react";

const cars: Car[] = [{ id: "A", name: "Car", color: "var(--car-green)", row: 0, col: 0, len: 2, dir: "h" }];
afterEach(() => { cleanup(); storageService.flush(); localStorage.clear(); storageService.resetCache(); });
it("defaults dragging to ON and persists OFF across a cold device read", () => {
  const { result } = renderHook(useSettings);
  expect(result.current.dragEnabled).toBe(true);
  act(() => result.current.setDragEnabled(false));
  storageService.flush();
  expect(localStorage.getItem("dragEnabled")).toBe("false");
  storageService.resetCache();
  expect(result.current.dragEnabled).toBe(false);
});
it("defaults keyboard to ON and shares changes reactively without changing dragging", () => {
  const first = renderHook(useSettings);
  const second = renderHook(useSettings);
  expect(first.result.current.keyboardEnabled).toBe(true);
  act(() => first.result.current.setKeyboardEnabled(false));
  expect(second.result.current.keyboardEnabled).toBe(false);
  expect(second.result.current.dragEnabled).toBe(true);
  storageService.flush();
  expect(localStorage.getItem("keyboardEnabled")).toBe("false");
});
it("ignores keyboard selections and moves when OFF, and restores them when ON", () => {
  const onMove = vi.fn();
  const { result } = renderHook(() => ({ board: useTournamentBoard({ state: { cars, index: 0, moves: 0, totalMoves: 0, elapsed: 0 }, blocked: false, onMove }), settings: useSettings() }));
  act(() => result.current.settings.setKeyboardEnabled(false));
  fireEvent.keyDown(window, { key: "a", code: "KeyA" });
  fireEvent.keyDown(window, { key: "ArrowRight" });
  fireEvent.keyDown(window, { key: "Enter" });
  expect(result.current.board.selected).toBe(null);
  expect(onMove).not.toHaveBeenCalled();
  act(() => result.current.settings.setKeyboardEnabled(true));
  fireEvent.keyDown(window, { key: "a", code: "KeyA" });
  fireEvent.keyDown(window, { key: "ArrowRight" });
  fireEvent.keyDown(window, { key: "Enter" });
  expect(onMove).toHaveBeenCalledWith("A", "right", 1);
});
it("blocks pointer capture and commits when dragging is OFF while preserving selection", () => {
  const onMove = vi.fn();
  const { result } = renderHook(() => ({ board: useTournamentBoard({ state: { cars, index: 0, moves: 0, totalMoves: 0, elapsed: 0 }, blocked: false, onMove }), settings: useSettings() }));
  const capture = vi.fn();
  const event = { button: 0, currentTarget: { setPointerCapture: capture, hasPointerCapture: () => false } } as unknown as PointerEvent<HTMLButtonElement>;
  act(() => result.current.settings.setDragEnabled(false));
  act(() => { result.current.board.down(cars[0] as Car, event); result.current.board.up(cars[0] as Car, event); result.current.board.setSelected("A"); });
  expect(capture).not.toHaveBeenCalled();
  expect(onMove).not.toHaveBeenCalled();
  expect(result.current.board.selected).toBe("A");
});
