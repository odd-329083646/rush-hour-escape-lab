import { useTournamentBoard } from "@/hooks/useTournamentBoard";
import { GameArena } from "@/components/game-board";
import type { Move } from "@/engine/game";
import type { RaceState } from "@/engine/tournament";

export function TournamentBoard({
  state,
  blocked,
  onMove,
}: {
  state: RaceState;
  blocked: boolean;
  onMove: (id: string, direction: Move, steps: number) => void;
}) {
  const {
    t,
    selected,
    setSelected,
    direction,
    setDirection,
    steps,
    setSteps,
    dragStart,
    drag,
    setDrag,
    down,
    offset,
    up,
  } = useTournamentBoard({ state, blocked, onMove });

  return (
    <GameArena
      t={t}
      dir="ltr"
      controls={{
        move: direction,
        onMoveChange: (nextMove) => {
          setDirection(nextMove);
          if (selected) onMove(selected, nextMove, steps);
        },
        steps,
        onStepsChange: setSteps,
        controlsDisabled: blocked,
        showExecute: false,
      }}
      board={{
        cars: state.cars,
        selectedId: selected,
        disabled: blocked,
        drag,
        getCarLabel: (car) => t("selectCar", { id: car.id }),
        onCarClick: (car) => setSelected(car.id),
        onPointerDown: down,
        onPointerMove: (car, event) => {
          const result = offset(car, event);
          if (result) setDrag({ id: car.id, offset: result.pixels });
        },
        onPointerUp: up,
        onPointerCancel: () => {
          dragStart.current = null;
          setDrag(null);
        },
      }}
      paletteCars={state.cars}
      paletteDisabled={blocked}
      onSelectCar={setSelected}
    />
  );
}