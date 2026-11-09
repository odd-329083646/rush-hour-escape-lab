import { useEffect, useRef, useState, type PointerEvent } from "react";
import { applyMove, isSolved, runPlan, type Car, type Move } from "@/lib/puzzles";
import { setLang, translate, useI18n, type Lang, type TKey } from "@/lib/i18n";
import { completeTutorial, hasSeenTutorial, markTutorialSeen } from "@/lib/tutorial";

import { useGameEngine, movementRange } from "@/hooks/useGameEngine";
export type Lesson = { title: TKey; body: TKey; cars: Car[]; hidden?: string[]; plan?: boolean };


export function useTutorialLesson({ lesson, onNext }: { lesson: Lesson; onNext: () => void }) {
  const { t, te, lang } = useI18n();
  const { cars, setCars, commitMove } = useGameEngine(lesson.cars);
  const [sel, setSel] = useState<string | null>(null);
  const [steps, setSteps] = useState(1);
  const [move, setMove] = useState<Move | null>(null);
  const [started, setStarted] = useState(!lesson.hidden);
  const [plan, setPlan] = useState<{ id: string; move: Move; steps: number }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const dragStart = useRef<{ id: string; pointerId: number; x: number; y: number; pitch: number; min: number; max: number } | null>(null);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  const done = isSolved(cars);
  const hidden = new Set(started && !done ? lesson.hidden ?? [] : []);

  const act = (id: string | null, direction: Move | null, count = steps) => {
    if (done) return;
    if (!started) { setMsg(t("needStart")); return; }
    if (!id) { setMsg(t("needCar")); return; }
    if (!direction) { setMsg(t("needDir")); return; }
    if (lesson.plan) { setPlan((queue) => [...queue, { id, move: direction, steps: count }]); setMsg(null); return; }
    const result = commitMove(id, direction, count);
    setMsg(result.error ? te(result.error) : null);
    if (!result.error && isSolved(result.cars)) onNext();
  };
  const submit = () => {
    const result = runPlan(cars, plan);
    if (result.failedAt === undefined && isSolved(result.cars)) { setCars(result.cars); setMsg(null); onNext(); }
    else setMsg(t("tutPlanFail"));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || done) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [role=dialog]")) return;
      const id = event.code.startsWith("Key") ? event.code.slice(3) : event.key.toUpperCase();
      if (cars.some((car) => car.id === id)) { setSel(id); return; }
      if (["1", "2", "3", "4"].includes(event.key)) { setSteps(Number(event.key)); return; }
      const directions: Record<string, Move> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      const direction = directions[event.key];
      if (direction) { event.preventDefault(); setMove(direction); return; }
      if (event.key === "Enter") {
        event.preventDefault();
        if (!started) setStarted(true);
        else act(sel, move);
      }
      if (event.code === "Space" && lesson.plan && started) { event.preventDefault(); submit(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cars, sel, steps, move, started, done, plan, lang]);

  const handlePointerDown = (car: Car, event: PointerEvent<HTMLButtonElement>) => {
    if (done || !started || event.button !== 0) return;
    setSel(car.id);
    const target = event.currentTarget;
    const board = target.parentElement;
    if (!board) return;
    const cell = board.querySelector<HTMLElement>(".cell");
    if (!cell) return;
    const gap = parseFloat(getComputedStyle(board).columnGap) || 4;
    const pitch = cell.getBoundingClientRect().width + gap;
    if (pitch <= 0) return;
    const { back, fwd: forward } = movementRange(cars, car, lesson.plan);
    target.setPointerCapture?.(event.pointerId);
    dragStart.current = { id: car.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, pitch, min: -back * pitch, max: forward * pitch };
  };
  const handlePointerMove = (car: Car, event: PointerEvent<HTMLButtonElement>) => {
    const current = dragStart.current;
    if (!current || current.id !== car.id || current.pointerId !== event.pointerId) return;
    const raw = car.dir === "h" ? event.clientX - current.x : event.clientY - current.y;
    setDrag({ id: car.id, offset: Math.max(current.min, Math.min(current.max, raw)) });
  };
  const handlePointerUp = (car: Car, event: PointerEvent<HTMLButtonElement>) => {
    const current = dragStart.current;
    if (!current || current.id !== car.id || current.pointerId !== event.pointerId) return;
    dragStart.current = null; setDrag(null);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const raw = car.dir === "h" ? event.clientX - current.x : event.clientY - current.y;
    const cells = Math.round(Math.max(current.min, Math.min(current.max, raw)) / current.pitch);
    if (!cells) return;
    const direction: Move = car.dir === "h" ? (cells > 0 ? "right" : "left") : (cells > 0 ? "down" : "up");
    setMove(direction); act(car.id, direction, Math.abs(cells));
  };
  const directionPosition: Record<Move, string> = { up: "col-start-2 row-start-1", down: "col-start-2 row-start-3", left: "col-start-1 row-start-2", right: "col-start-3 row-start-2" };

  return { t, te, lang, cars, setCars, commitMove, sel, setSel, steps, setSteps, move, setMove, started, setStarted, plan, setPlan, msg, setMsg, dragStart, drag, setDrag, done, hidden, act, submit, handlePointerDown, handlePointerMove, handlePointerUp, directionPosition };
}
