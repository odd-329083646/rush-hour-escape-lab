import type { PointerEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Car } from "@/lib/puzzles";

export interface GameBoardProps {
    cars: Car[];
    selectedId?: string | null;
    hiddenIds?: Set<string>;
    revealed?: boolean;
    won?: boolean;
    disabled?: boolean;
    warn?: { key?: number | string; text: string } | string | null;
    drag?: { id: string; offset: number } | null;
    getCarLabel?: (car: Car, isHidden: boolean) => string;
    onCarClick?: (car: Car) => void;
    onPointerDown?: (car: Car, event: PointerEvent<HTMLButtonElement>) => void;
    onPointerMove?: (car: Car, event: PointerEvent<HTMLButtonElement>) => void;
    onPointerUp?: (car: Car, event: PointerEvent<HTMLButtonElement>) => void;
    onPointerCancel?: () => void;
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
                        aria-label={getCarLabel ? getCarLabel(car, isHidden) : car.name}
                        className="car h-auto min-w-0 touch-none select-none p-0 hover:bg-transparent"
                        style={{
                            background: car.color,
                            gridRow: `${car.row + 1} / span ${car.dir === "v" ? car.len : 1}`,
                            gridColumn: `${car.col + 1} / span ${car.dir === "h" ? car.len : 1}`,
                            transform: isDragging
                                ? car.dir === "h"
                                    ? `translate(${drag!.offset}px, 0)`
                                    : `translate(0, ${drag!.offset}px)`
                                : undefined,
                            transition: isDragging ? "none" : undefined,
                            zIndex: isDragging ? 5 : undefined,
                        }}
                    >
                        {car.id}
                    </Button>
                );
            })}

            {children}
        </div>
    );
}