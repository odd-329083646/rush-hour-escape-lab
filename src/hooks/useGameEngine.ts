import { useEffect, useRef, useState } from "react";
import { applyMove, isSolved, cells, type Car, type Move } from "@/engine/game";

export function movementRange(cars: Car[], car: Car, plan = false) {
  const position = car.dir === "h" ? car.col : car.row;
  if (plan) return { back: position, fwd: 6 - position - car.len };
  let back = 0, fwd = 0;
  while (back < position && !applyMove(cars, car.id, car.dir === "h" ? "left" : "up", back + 1).error) back++;
  while (fwd < 6 - position - car.len && !applyMove(cars, car.id, car.dir === "h" ? "right" : "down", fwd + 1).error) fwd++;
  return { back, fwd };
}
export function blockerOf(cars: Car[], car: Car, move: Move, steps: number) {
  if ((car.dir === "h") !== (move === "left" || move === "right")) return undefined;
  const d = move === "right" || move === "down" ? 1 : -1;
  for (let s = 0; s < steps; s++) {
    const front = (d > 0 ? car.len : -1) + s * d;
    const row = car.dir === "h" ? car.row : car.row + front;
    const col = car.dir === "h" ? car.col + front : car.col;
    if (row < 0 || row > 5 || col < 0 || col > 5) return undefined;
    const hit = cars.find((other) => other.id !== car.id && cells(other).some(([r, c]) => r === row && c === col));
    if (hit) return hit.id;
  }
  return undefined;
}

/** Shared synchronous, network-free board state. Mode hooks own completion policies. */
export function useGameEngine(initialCars: Car[] = []) {
  const [cars, updateCars] = useState(initialCars);
  const current = useRef(cars);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [wonAt, setWonAt] = useState<number | null>(null);
  const setCars: typeof updateCars = (value) => {
    current.current = typeof value === "function" ? value(current.current) : value;
    updateCars(current.current);
  };
  const commitMove = (id: string, move: Move, steps: number) => {
    const result = applyMove(current.current, id, move, steps);
    if (!result.error) { setCars(result.cars); setMoves((count) => count + 1); }
    return result;
  };
  useEffect(() => {
    if (startedAt === null || wonAt !== null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [startedAt, wonAt]);
  return { cars, currentCars: current, setCars, moves, setMoves, startedAt, setStartedAt, now, setNow, wonAt, setWonAt, commitMove, solved: isSolved(cars) };
}