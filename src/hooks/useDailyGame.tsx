import { storageService } from "@/services/storageService";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarDays, Coins, Home, Lightbulb, Play, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsButton } from "@/components/settings-dialog";
import { useI18n } from "@/lib/i18n";
import { HintSelection } from "@/components/hint-selection";
import { useHints } from "@/hooks/use-hints";
import { HINT_COSTS, hintAvailable, peekBoardCars, type HintType } from "@/lib/hints";
import { DailyCalendar } from "@/components/daily/daily-calendar";
import { addCoins, applyMove, cells, getCoins, getDailyPuzzleAsync, getNextBestMove, isSolved, pickHidden, type Car, type Move } from "@/lib/puzzles";
import { fmtTime, isSolvedOn, submitScore } from "@/lib/daily-scores";

import { useGameEngine, movementRange, blockerOf as findBlocker } from "@/hooks/useGameEngine";
const DIRS: { m: Move; Icon: typeof ArrowUp; cls: string }[] = [
  { m: "up", Icon: ArrowUp, cls: "col-start-2 row-start-1" },
  { m: "left", Icon: ArrowLeft, cls: "col-start-1 row-start-2" },
  { m: "right", Icon: ArrowRight, cls: "col-start-3 row-start-2" },
  { m: "down", Icon: ArrowDown, cls: "col-start-2 row-start-3" },
];
const ARROW: Record<Move, string> = { up: "↑", down: "↓", left: "←", right: "→" };

export function useDailyGame({ date, openCalendar = false }: { date: string; openCalendar?: boolean }) {
  const { t, te, lang } = useI18n();
  const [start, setStart] = useState<Car[]>([]);
  const [par, setPar] = useState(0);
  const { cars, setCars, moves, setMoves, startedAt, setStartedAt, now, setNow, wonAt, setWonAt, commitMove } = useGameEngine();
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [steps, setSteps] = useState(1);
  const [move, setMove] = useState<Move | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());



  const [bumps, setBumps] = useState(0);
  const [warn, setWarn] = useState<string | null>(null);
  const [coins, setCoins] = useState(getCoins());
  const [result, setResult] = useState<{ time: number; best: number | null; isRecord: boolean; coinsEarned: number; isFirstSolve: boolean } | null>(null);
  const hints = useHints(setCoins);
  const boardCars = peekBoardCars(start, cars, hints.peek);
  const [calOpen, setCalOpen] = useState(openCalendar);
  const dragStart = useRef<{ id: string; pointerId: number; x: number; y: number; pitch: number; min: number; max: number } | null>(null);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  const submitting = useRef(false);
  const failed = bumps >= 3 && !result;

  const reset = (cs: Car[]) => {
    hints.reset();
    setCars(cs); setSel(null); setHidden(new Set()); setStartedAt(null);
    setMoves(0); setWonAt(null); setBumps(0); setResult(null); setWarn(null);
    setMove(null); setSteps(1); setDrag(null); dragStart.current = null; submitting.current = false;
    setCoins(getCoins());
  };

  useEffect(() => {
    let live = true;
    setLoading(true);
    getDailyPuzzleAsync(date).then((p) => {
      if (!live) return;
      setStart(p.cars); setPar(p.par); reset(p.cars); setLoading(false);
    });
    return () => { live = false; };
  }, [date]);

  const elapsed = startedAt ? Math.floor(((result ? startedAt + result.time * 1000 : now) - startedAt) / 1000) : 0;
  const started = startedAt !== null;

  const flash = useCallback((t: string) => { setWarn(t); setTimeout(() => setWarn((w) => (w === t ? null : w)), 1600); }, []);

  const useHint = (type: HintType, id?: string): string | void => {
    if (!started || result || failed || !hintAvailable(type, "medium", hidden, [])) return t("noHint");
    if (getCoins() < HINT_COSTS[type]) return t("hintCost", { cost: HINT_COSTS[type], have: getCoins() });
    if (type === "next") {
      const nextMove = getNextBestMove(cars);
      if (!nextMove) return t("noHint");
      if (!hints.charge(type)) return t("noHint");
      setSel(nextMove.id); setMove(nextMove.move); setSteps(nextMove.steps);
      flash(t("hintMsg", { id: nextMove.id, arrow: ARROW[nextMove.move], steps: nextMove.steps }));
    } else if (type === "peek") {
      if (!hints.charge(type)) return t("noHint");
      hints.startPeek();
    } else if (type === "reveal") {
      if (!id || !hidden.has(id)) return t("noHint");
      if (!hints.charge(type)) return t("noHint");
      setHidden((previous) => { const next = new Set(previous); next.delete(id); return next; });
    }
  };

  const blockerOf = useCallback((car: Car, direction: Move, count: number) => findBlocker(cars, car, direction, count), [cars]);

  const go = useCallback(async (m: Move, id = sel, count = steps) => {
    if (startedAt === null || result || failed || submitting.current || hints.peek) return;
    const c = cars.find((x) => x.id === id);
    if (!c) return flash(t("needCar"));
    const r = commitMove(c.id, m, count);
    if (r.error) {
      const b = r.error.startsWith("Blocked") ? blockerOf(c, m, count) : undefined;
      if (b && hidden.has(b) && !hints.peek) { setBumps((n) => n + 1); return flash(t("bumpedInvisible")); }
      return flash(te(r.error));
    }
    setWarn(null);
    if (isSolved(r.cars)) {
      submitting.current = true;
      setWonAt(Date.now());
      const time = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const name = storageService.getItem("player_name") || "Player";

      // 1. בדיקה האם זו פתירה ראשונה של החידה היומית הזו במכשיר זה
      const isFirstSolve = !isSolvedOn(date);

      // 2. הגשת התוצאה לשרת
      const res = await submitScore({ date, solve_time: time, player_name: name });

      // 3. חישוב תגמול מטבעות
      let coinsEarned = 0;
      if (isFirstSolve) {
        coinsEarned += 30; // 30 מטבעות בפתירה ראשונה
      }
      if (res.isRecord) {
        coinsEarned += 50; // 50 מטבעות בונוס על שבירת שיא עולמי
      }

      if (coinsEarned > 0) {
        addCoins(coinsEarned);
        setCoins(getCoins());
      }

      setResult({ time, ...res, coinsEarned, isFirstSolve });
    }
  }, [sel, steps, startedAt, result, failed, cars, blockerOf, hidden, flash, date, t, te, hints.peek]);

  const execute = () => {
    if (!started) return flash(t("needStart"));
    if (!sel) return flash(t("needCar"));
    if (!move) return flash(t("needDir"));
    void go(move);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat || hints.open || hints.peek || calOpen || result || failed || !started || submitting.current) return;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [role='dialog']"))) return;
      const char = e.code.startsWith("Key") ? e.code.slice(3) : e.key.toUpperCase();
      if (cars.some((c) => c.id === char)) { e.preventDefault(); setSel(char); return; }
      if (["1", "2", "3", "4"].includes(e.key)) { e.preventDefault(); setSteps(Number(e.key)); return; }
      const arrows: Record<string, Move> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      const direction = arrows[e.key];
      if (direction) { e.preventDefault(); setMove(direction); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        execute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cars, calOpen, result, failed, started, move, go, flash, hints.open, hints.peek]);

  const handlePointerDown = (c: Car, e: PointerEvent<HTMLButtonElement>) => {
    if (!started || result || failed || hints.open || hints.peek || calOpen || submitting.current || !e.isPrimary || e.button !== 0 || dragStart.current) return;
    const board = e.currentTarget.parentElement;
    const cell = board?.querySelector(".cell");
    if (!board || !cell) return;
    const pitch = cell.getBoundingClientRect().width + (parseFloat(getComputedStyle(board).columnGap) || 0);
    if (pitch <= 0) return;
    const { back, fwd } = movementRange(cars, c);
    e.currentTarget.setPointerCapture(e.pointerId);
    setSel(c.id);
    dragStart.current = { id: c.id, pointerId: e.pointerId, x: e.clientX, y: e.clientY, pitch, min: -back * pitch, max: fwd * pitch };
  };

  const handlePointerMove = (c: Car, e: PointerEvent<HTMLButtonElement>) => {
    const d = dragStart.current;
    if (!d || d.id !== c.id || d.pointerId !== e.pointerId) return;
    const raw = c.dir === "h" ? e.clientX - d.x : e.clientY - d.y;
    setDrag({ id: c.id, offset: Math.max(d.min, Math.min(d.max, raw)) });
  };

  const handlePointerUp = (c: Car, e: PointerEvent<HTMLButtonElement>) => {
    const d = dragStart.current;
    if (!d || d.id !== c.id || d.pointerId !== e.pointerId) return;
    dragStart.current = null; setDrag(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    const raw = c.dir === "h" ? e.clientX - d.x : e.clientY - d.y;
    const offset = Math.max(d.min, Math.min(d.max, raw));
    const count = Math.round(offset / d.pitch);
    const direction: Move = c.dir === "h" ? (raw > 0 ? "right" : "left") : (raw > 0 ? "down" : "up");
    if (Math.abs(raw - offset) > 20) {
      const blocker = blockerOf(c, direction, Math.abs(count) + 1);
      if (blocker && hidden.has(blocker) && !hints.peek) { setBumps((n) => n + 1); flash(t("bumpedInvisible")); }
    }
    if (!count) return;
    setMove(direction); setSteps(Math.abs(count));
    void go(direction, c.id, Math.abs(count));
  };

  const carBtn = (c: Car) => (
    <Button variant="ghost" key={c.id} onClick={() => setSel(c.id)} data-active={sel === c.id}
      title={c.name} aria-label={`Select ${c.id} · ${c.name}`} disabled={!started || !!result} className="palette-cell h-auto">
      <span className={`h-3 rounded-sm ${c.len === 3 ? "w-10" : "w-6"}`} style={{ background: c.color }} />
      <span className="text-xs">{c.id} {c.dir === "h" ? "↔" : "↕"}</span>
    </Button>
  );

  const label = new Date(`${date}T12:00:00`).toLocaleDateString(lang === "he" ? "he-IL" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  return { t, te, lang, start, setStart, par, setPar, cars, setCars, moves, setMoves, startedAt, setStartedAt, now, setNow, wonAt, setWonAt, commitMove, loading, setLoading, sel, setSel, steps, setSteps, move, setMove, hidden, setHidden, bumps, setBumps, warn, setWarn, coins, setCoins, result, setResult, hints, boardCars, calOpen, setCalOpen, dragStart, drag, setDrag, submitting, failed, reset, elapsed, started, flash, useHint, blockerOf, go, execute, handlePointerDown, handlePointerMove, handlePointerUp, carBtn, label };
}
