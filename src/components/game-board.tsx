import type { PointerEvent, ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Lightbulb, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Car, Move } from "@/engine/game";
import type { TKey } from "@/lib/i18n";
import { VehicleArt } from "@/components/vehicle-art";

export type TranslateFn = (key: TKey, vars?: Record<string, string | number>) => string;

const DEFAULT_DIRS: { move: Move; Icon: typeof ArrowUp; cls: string }[] = [
  { move: "up", Icon: ArrowUp, cls: "col-start-2 row-start-1" },
  { move: "left", Icon: ArrowLeft, cls: "col-start-1 row-start-2" },
  { move: "right", Icon: ArrowRight, cls: "col-start-3 row-start-2" },
  { move: "down", Icon: ArrowDown, cls: "col-start-2 row-start-3" },
];

export interface GameBoardProps {
  cars: Car[];
  selectedId?: string | null | undefined;
  hiddenIds?: Set<string> | undefined;
  revealed?: boolean | undefined;
  won?: boolean | undefined;
  disabled?: boolean | undefined;
  warn?: { key?: number | string | undefined; text: string } | string | null | undefined;
  drag?: { id: string; offset: number } | null | undefined;
  getCarLabel?: ((car: Car, isHidden: boolean) => string) | undefined;
  onCarClick?: ((car: Car) => void) | undefined;
  onPointerDown?: ((car: Car, event: PointerEvent<HTMLButtonElement>) => void) | undefined;
  onPointerMove?: ((car: Car, event: PointerEvent<HTMLButtonElement>) => void) | undefined;
  onPointerUp?: ((car: Car, event: PointerEvent<HTMLButtonElement>) => void) | undefined;
  onPointerCancel?: (() => void) | undefined;
  children?: ReactNode;
}

export function GameBoard({
  cars,
  selectedId,
  hiddenIds,
  revealed = false,
  won = false,
  disabled = false,
  warn,
  drag,
  getCarLabel,
  onCarClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  children,
}: GameBoardProps) {
  const warnText = typeof warn === "string" ? warn : warn?.text;
  const warnKey = typeof warn === "object" && warn !== null ? warn.key : undefined;

  return (
    <div className="board">
      {warnText && (
        <div key={warnKey} className="warn" role="alert">
          {warnText}
        </div>
      )}

      {Array.from({ length: 36 }).map((_, i) => (
        <div
          key={i}
          className="cell"
          style={{
            gridRow: Math.floor(i / 6) + 1,
            gridColumn: (i % 6) + 1,
          }}
        />
      ))}

      <div className="exit" data-escaping={won} />

      {cars.map((car) => {
        const isSelected = selectedId === car.id;
        const isEscaping = won && car.id === "X";
        const isHidden = Boolean(hiddenIds?.has(car.id) && !revealed && !isEscaping);
        const isDragging = drag?.id === car.id;

        return (
          <Button
            key={car.id}
            variant="ghost"
            draggable={false}
            disabled={disabled}
            onClick={() => onCarClick?.(car)}
            onPointerDown={(e) => onPointerDown?.(car, e)}
            onPointerMove={(e) => onPointerMove?.(car, e)}
            onPointerUp={(e) => onPointerUp?.(car, e)}
            onPointerCancel={onPointerCancel}
            onLostPointerCapture={onPointerCancel}
            data-shake={isSelected && Boolean(warnText)}
            data-selected={isSelected}
            data-hidden={isHidden}
            data-escaping={isEscaping}
            data-dragging={isDragging}
            data-orientation={car.dir}
            data-length={car.len}
            aria-label={getCarLabel ? getCarLabel(car, isHidden) : car.name}
            className="car h-auto min-w-0 touch-none select-none p-0 hover:bg-transparent"
            style={{
              gridRow: `${car.row + 1} / span ${car.dir === "v" ? car.len : 1}`,
              gridColumn: `${car.col + 1} / span ${car.dir === "h" ? car.len : 1}`,
              transform: isDragging
                ? car.dir === "h"
                  ? `translate(${drag?.offset}px, 0)`
                  : `translate(0, ${drag?.offset}px)`
                : undefined,
              transition: isDragging ? "none" : undefined,
              zIndex: isDragging ? 5 : undefined,
            }}
          >
            <VehicleArt car={car} />
            <span className="vehicle-id">{car.id}</span>
          </Button>
        );
      })}

      {children}
    </div>
  );
}

export interface ControlPanelProps {
  t: TranslateFn;
  started?: boolean | undefined;
  startLabel?: string | undefined;
  startDisabled?: boolean | undefined;
  onStart?: (() => void) | undefined;
  move: Move | null;
  onMoveChange: (move: Move) => void;
  steps: number;
  onStepsChange: (steps: number) => void;
  directionPositions?: Partial<Record<Move, string>> | undefined;
  controlsDisabled?: boolean | undefined;
  showHint?: boolean | undefined;
  hintDisabled?: boolean | undefined;
  onHintClick?: (() => void) | undefined;
  showExecute?: boolean | undefined;
  executeLabel?: string | undefined;
  executeIcon?: "play" | "plus" | undefined;
  executeDisabled?: boolean | undefined;
  onExecute?: (() => void) | undefined;
}

export function ControlPanel({
  t,
  started = true,
  startLabel,
  startDisabled = false,
  onStart,
  move,
  onMoveChange,
  steps,
  onStepsChange,
  directionPositions,
  controlsDisabled = false,
  showHint = false,
  hintDisabled = false,
  onHintClick,
  showExecute = true,
  executeLabel,
  executeIcon = "play",
  executeDisabled = false,
  onExecute,
}: ControlPanelProps) {
  return (
    <aside className="panel flex flex-col gap-2" style={{ gridArea: "ctrl" }}>
      {!started ? (
        <Button
          disabled={startDisabled}
          onClick={onStart}
          className="execute start-control whitespace-normal"
        >
          <Play className="h-4 w-4" />
          <span>{startLabel ?? t("startSolving")}</span>
        </Button>
      ) : (
        <div className="solving-controls flex flex-col gap-2">
          <div>
            <h2 className="panel-title">{t("direction")}</h2>
            <div className="grid grid-cols-3 grid-rows-3 gap-2">
              {DEFAULT_DIRS.map(({ move: dir, Icon, cls }) => (
                <Button
                  key={dir}
                  variant="ghost"
                  aria-label={dir}
                  title={dir}
                  disabled={controlsDisabled}
                  data-active={move === dir}
                  onClick={() => onMoveChange(dir)}
                  className={`ctrl ${directionPositions?.[dir] ?? cls}`}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              ))}

              {showHint && (
                <Button
                  onClick={onHintClick}
                  variant="outline"
                  disabled={hintDisabled}
                  title={t("hintMenu")}
                  aria-label={t("hintMenu")}
                  className="ctrl col-start-2 row-start-2 flex flex-col items-center justify-center gap-0.5 border-amber-500/40 bg-amber-500/10 p-0 font-bold text-amber-500 hover:bg-amber-500/20"
                >
                  <Lightbulb className="h-4 w-4 shrink-0 fill-amber-500" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <h2 className="panel-title">{t("steps")}</h2>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => (
                <Button
                  key={n}
                  variant="ghost"
                  disabled={controlsDisabled}
                  onClick={() => onStepsChange(n)}
                  data-active={steps === n}
                  className="ctrl px-0 font-display"
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          {showExecute && onExecute && (
            <Button onClick={onExecute} disabled={executeDisabled} className="execute mt-1">
              {executeIcon === "plus" ? (
                <Plus className="h-4 w-4 shrink-0" />
              ) : (
                <Play className="h-4 w-4 shrink-0" />
              )}
              <span>{executeLabel ?? t("execute")}</span>
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}

export interface CarPaletteProps {
  t: TranslateFn;
  cars: Car[];
  selectedId?: string | null | undefined;
  disabled?: boolean | undefined;
  getPaletteCarLabel?: ((car: Car) => string) | undefined;
  onSelect: (id: string) => void;
  children?: ReactNode;
}

export function CarPalette({
  t,
  cars,
  selectedId,
  disabled = false,
  getPaletteCarLabel,
  onSelect,
  children,
}: CarPaletteProps) {
  const standardCars = cars.filter((c) => c.len === 2);
  const trucks = cars.filter((c) => c.len === 3);

  const renderCarButton = (c: Car) => (
    <Button
      variant="ghost"
      key={c.id}
      onClick={() => onSelect(c.id)}
      data-active={selectedId === c.id}
      title={c.name}
      aria-label={getPaletteCarLabel ? getPaletteCarLabel(c) : t("selectCar", { id: c.id })}
      disabled={disabled}
      className="palette-cell h-auto"
    >
      <span
        className="vehicle-preview"
        data-orientation={c.dir}
        data-length={c.len}
        aria-hidden="true"
      >
        <VehicleArt car={c} />
      </span>
      <span className="text-xs">
        {c.id} {c.dir === "h" ? "↔" : "↕"}
      </span>
    </Button>
  );

  return (
    <aside className="panel flex flex-col gap-2" style={{ gridArea: "cars" }}>
      <div>
        <h2 className="panel-title">{t("cars")}</h2>
        <div className="grid grid-cols-4 gap-2">{standardCars.map(renderCarButton)}</div>
      </div>

      {trucks.length > 0 && (
        <div>
          <h2 className="panel-title mt-1">{t("trucks")}</h2>
          <div className="grid grid-cols-2 gap-2">{trucks.map(renderCarButton)}</div>
        </div>
      )}

      {children}
    </aside>
  );
}

export interface GameArenaProps {
  t: TranslateFn;
  dir?: "ltr" | "rtl" | undefined;
  showControlsPanel?: boolean | undefined;
  showCarsPanel?: boolean | undefined;
  controls: Omit<ControlPanelProps, "t">;
  board: GameBoardProps;
  customCenter?: ReactNode;
  boardHeader?: ReactNode;
  boardFooter?: ReactNode;
  paletteCars: Car[];
  paletteDisabled?: boolean | undefined;
  getPaletteCarLabel?: ((car: Car) => string) | undefined;
  onSelectCar: (id: string) => void;
  paletteFooter?: ReactNode;
}

export function GameArena({
  t,
  dir,
  showControlsPanel = true,
  showCarsPanel = true,
  controls,
  board,
  customCenter,
  boardHeader,
  boardFooter,
  paletteCars,
  paletteDisabled = false,
  getPaletteCarLabel,
  onSelectCar,
  paletteFooter,
}: GameArenaProps) {
  return (
    <div className="game-grid" dir={dir}>
      {showControlsPanel && <ControlPanel t={t} {...controls} />}

      <section className="flex min-h-0 flex-col items-center gap-2" style={{ gridArea: "board" }}>
        {boardHeader}
        {customCenter ?? <GameBoard {...board} />}
        {boardFooter}
      </section>

      {showCarsPanel && (
        <CarPalette
          t={t}
          cars={paletteCars}
          selectedId={board.selectedId}
          disabled={paletteDisabled}
          getPaletteCarLabel={getPaletteCarLabel}
          onSelect={onSelectCar}
        >
          {paletteFooter}
        </CarPalette>
      )}
    </div>
  );
}
