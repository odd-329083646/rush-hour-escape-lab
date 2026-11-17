import { useTournamentBoard } from "@/hooks/useTournamentBoard";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Car, type Move } from "@/lib/puzzles";
import type { RaceState } from "@/lib/tournament";
import { GameBoard } from "@/components/game-board";

const directions: { move: Move; Icon: typeof ArrowUp; position: string }[] = [
  { move: "up", Icon: ArrowUp, position: "col-start-2 row-start-1" },
  { move: "down", Icon: ArrowDown, position: "col-start-2 row-start-3" },
  { move: "left", Icon: ArrowLeft, position: "col-start-1 row-start-2" },
  { move: "right", Icon: ArrowRight, position: "col-start-3 row-start-2" },
];
export function TournamentBoard({ state, blocked, onMove }: { state: RaceState; blocked: boolean; onMove: (id: string, direction: Move, steps: number) => void }) {
  const { t, selected, setSelected, direction, setDirection, steps, setSteps, dragStart, drag, setDrag, down, offset, up } = useTournamentBoard({ state, blocked, onMove });
  const palette = (car: Car) => <Button key={car.id} variant="ghost" disabled={blocked} className="palette-cell h-auto" data-active={selected === car.id} aria-label={t("selectCar", { id: car.id })} onClick={() => setSelected(car.id)}><span className="h-3 rounded-sm" style={{ background: car.color, width: car.len === 3 ? "2.5rem" : "1.5rem" }} /><span className="text-xs">{car.id} {car.dir === "h" ? "↔" : "↕"}</span></Button>;
  return <div className="game-grid" dir="ltr">
    <aside className="panel flex flex-col gap-2 [grid-area:ctrl]">
      <h2 className="panel-title">{t("direction")}</h2>
      <div className="grid grid-cols-3 grid-rows-3 gap-2">{directions.map(({ move, Icon, position }) => <Button key={move} variant="ghost" className={`ctrl ${position}`} disabled={blocked} data-active={direction === move} aria-label={move} title={move} onClick={() => { setDirection(move); if (selected) onMove(selected, move, steps); }}><Icon className="h-5 w-5" /></Button>)}</div>
      <h2 className="panel-title">{t("steps")}</h2>
      <div className="grid grid-cols-4 gap-2">{[1, 2, 3, 4].map((n) => <Button key={n} variant="ghost" className="ctrl px-0" data-active={steps === n} disabled={blocked} onClick={() => setSteps(n)}>{n}</Button>)}</div>
    </aside>
    <section className="flex min-h-0 flex-col items-center gap-2 [grid-area:board]">
      <GameBoard
        cars={state.cars}
        selectedId={selected}
        disabled={blocked}
        drag={drag}
        getCarLabel={(car) => t("selectCar", { id: car.id })}
        onCarClick={(car) => setSelected(car.id)}
        onPointerDown={down}
        onPointerMove={(car, event) => {
          const result = offset(car, event);
          if (result) setDrag({ id: car.id, offset: result.pixels });
        }}
        onPointerUp={up}
        onPointerCancel={() => { dragStart.current = null; setDrag(null); }}
      />
    </section>
    <aside className="panel flex flex-col gap-2 [grid-area:cars]">
      <h2 className="panel-title">{t("cars")}</h2><div className="grid grid-cols-4 gap-2">{state.cars.filter((car) => car.len === 2).map(palette)}</div>
      <h2 className="panel-title">{t("trucks")}</h2><div className="grid grid-cols-2 gap-2">{state.cars.filter((car) => car.len === 3).map(palette)}</div>
    </aside>
  </div>;
}
