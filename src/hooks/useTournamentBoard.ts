import { useEffect, useRef, useState, type PointerEvent } from "react";
import { applyMove, type Car, type Move } from "@/lib/puzzles";
import { useI18n } from "@/lib/i18n";
import type { RaceState } from "@/lib/tournament";
import { movementRange } from "@/hooks/useGameEngine";

export function useTournamentBoard({ state, blocked, onMove }: { state: RaceState; blocked: boolean; onMove: (id: string, direction: Move, steps: number) => void }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const [direction, setDirection] = useState<Move | null>(null);
  const [steps, setSteps] = useState(1);
  const dragStart = useRef<{ id: string; pointerId: number; x: number; y: number; pitch: number; min: number; max: number } | null>(null);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (blocked || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [role=dialog]")) return;
      const id = event.code.startsWith("Key") ? event.code.slice(3) : event.key.toUpperCase();
      if (state.cars.some((car) => car.id === id)) { setSelected(id); return; }
      if (/^[1-4]$/.test(event.key)) { setSteps(Number(event.key)); return; }
      const moves: Record<string, Move> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      const move = moves[event.key];
      if (move) { event.preventDefault(); setDirection(move); }
      if (event.key === "Enter" && selected && direction) { event.preventDefault(); onMove(selected, direction, steps); }
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [state, blocked, selected, direction, steps, onMove]);
  const down = (car: Car, event: PointerEvent<HTMLButtonElement>) => {
    if (blocked || event.button !== 0) return;
    setSelected(car.id);
    const board = event.currentTarget.parentElement;
    const cell = board?.querySelector(".cell");
    if (!board || !cell) return;
    const pitch = cell.getBoundingClientRect().width + (parseFloat(getComputedStyle(board).columnGap) || 4);
    if (pitch <= 0) return;
    const { back, fwd: forward } = movementRange(state.cars, car);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { id: car.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, pitch, min: -back * pitch, max: forward * pitch };
  };
  const offset = (car: Car, event: PointerEvent<HTMLButtonElement>) => {
    const start = dragStart.current;
    if (!start || start.id !== car.id || start.pointerId !== event.pointerId) return null;
    const raw = car.dir === "h" ? event.clientX - start.x : event.clientY - start.y;
    return { start, pixels: Math.max(start.min, Math.min(start.max, raw)) };
  };
  const up = (car: Car, event: PointerEvent<HTMLButtonElement>) => {
    const result = offset(car, event);
    dragStart.current = null; setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!result || blocked) return;
    const cells = Math.round(result.pixels / result.start.pitch);
    if (cells) onMove(car.id, car.dir === "h" ? cells > 0 ? "right" : "left" : cells > 0 ? "down" : "up", Math.abs(cells));
  };
  return { t, selected, setSelected, direction, setDirection, steps, setSteps, dragStart, drag, setDrag, down, offset, up };
}
