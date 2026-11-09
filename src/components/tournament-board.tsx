import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyMove, type Car, type Move } from "@/lib/puzzles";
import { useI18n } from "@/lib/i18n";
import type { RaceState } from "@/lib/tournament";
import { movementRange } from "@/hooks/useGameEngine";

const directions: { move: Move; Icon: typeof ArrowUp; position: string }[] = [
  { move: "up", Icon: ArrowUp, position: "col-start-2 row-start-1" },
  { move: "down", Icon: ArrowDown, position: "col-start-2 row-start-3" },
  { move: "left", Icon: ArrowLeft, position: "col-start-1 row-start-2" },
  { move: "right", Icon: ArrowRight, position: "col-start-3 row-start-2" },
];
export function TournamentBoard({ state, blocked, onMove }: { state: RaceState; blocked: boolean; onMove: (id: string, direction: Move, steps: number) => void }) {
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
  const palette = (car: Car) => <Button key={car.id} variant="ghost" disabled={blocked} className="palette-cell h-auto" data-active={selected === car.id} aria-label={t("selectCar", { id: car.id })} onClick={() => setSelected(car.id)}><span className="h-3 rounded-sm" style={{ background: car.color, width: car.len === 3 ? "2.5rem" : "1.5rem" }} /><span className="text-xs">{car.id} {car.dir === "h" ? "↔" : "↕"}</span></Button>;
  return <div className="game-grid" dir="ltr">
    <aside className="panel flex flex-col gap-2 [grid-area:ctrl]">
      <h2 className="panel-title">{t("direction")}</h2>
      <div className="grid grid-cols-3 grid-rows-3 gap-2">{directions.map(({ move, Icon, position }) => <Button key={move} variant="ghost" className={`ctrl ${position}`} disabled={blocked} data-active={direction === move} aria-label={move} title={move} onClick={() => { setDirection(move); if (selected) onMove(selected, move, steps); }}><Icon className="h-5 w-5" /></Button>)}</div>
      <h2 className="panel-title">{t("steps")}</h2>
      <div className="grid grid-cols-4 gap-2">{[1, 2, 3, 4].map((n) => <Button key={n} variant="ghost" className="ctrl px-0" data-active={steps === n} disabled={blocked} onClick={() => setSteps(n)}>{n}</Button>)}</div>
    </aside>
    <section className="flex min-h-0 flex-col items-center gap-2 [grid-area:board]">
      <div className="board">
        {Array.from({ length: 36 }, (_, i) => <div key={i} className="cell" style={{ gridRow: Math.floor(i / 6) + 1, gridColumn: i % 6 + 1 }} />)}
        <div className="exit" />
        {state.cars.map((car) => <Button key={car.id} variant="ghost" draggable={false} disabled={blocked} className="car h-auto min-w-0 touch-none select-none p-0 hover:bg-transparent" aria-label={t("selectCar", { id: car.id })} data-selected={selected === car.id} onClick={() => setSelected(car.id)} onPointerDown={(event) => down(car, event)} onPointerMove={(event) => { const result = offset(car, event); if (result) setDrag({ id: car.id, offset: result.pixels }); }} onPointerUp={(event) => up(car, event)} onPointerCancel={() => { dragStart.current = null; setDrag(null); }} style={{ background: car.color, gridRow: `${car.row + 1} / span ${car.dir === "v" ? car.len : 1}`, gridColumn: `${car.col + 1} / span ${car.dir === "h" ? car.len : 1}`, transform: drag?.id === car.id ? car.dir === "h" ? `translate(${drag.offset}px,0)` : `translate(0,${drag.offset}px)` : undefined, transition: drag?.id === car.id ? "none" : undefined }}>{car.id}</Button>)}
      </div>
    </section>
    <aside className="panel flex flex-col gap-2 [grid-area:cars]">
      <h2 className="panel-title">{t("cars")}</h2><div className="grid grid-cols-4 gap-2">{state.cars.filter((car) => car.len === 2).map(palette)}</div>
      <h2 className="panel-title">{t("trucks")}</h2><div className="grid grid-cols-2 gap-2">{state.cars.filter((car) => car.len === 3).map(palette)}</div>
    </aside>
  </div>;
}