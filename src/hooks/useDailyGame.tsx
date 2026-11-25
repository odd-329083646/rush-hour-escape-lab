import { useSettings } from "@/hooks/useSettings";
import { useRewardSystem } from "./useRewardSystem";
import { blApi } from "@/engine/blApi";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { useI18n } from "@/lib/i18n";
import { useHints } from "@/hooks/use-hints";
import type { HintType } from "@/engine/hints";
import type { Car, Move } from "@/engine/game";
import { useGameEngine, movementRange, blockerOf as findBlocker } from "@/hooks/useGameEngine";

const ARROW: Record<Move, string> = { up: "↑", down: "↓", left: "←", right: "→" };

export function useDailyGame({
  date,
  openCalendar = false,
}: {
  date: string;
  openCalendar?: boolean;
}) {
  const { dragEnabled, keyboardEnabled } = useSettings();
  const { t, te, lang } = useI18n();
  const storage = blApi.ports.storage;
  const remoteScore = blApi.ports.remoteScore;
  const [start, setStart] = useState<Car[]>([]);
  const [par, setPar] = useState(0);
  const {
    cars,
    currentCars,
    setCars,
    moves,
    setMoves,
    startedAt,
    setStartedAt,
    now,
    setNow,
    wonAt,
    setWonAt,
    commitMove,
  } = useGameEngine();
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [steps, setSteps] = useState(1);
  const [move, setMove] = useState<Move | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const [bumps, setBumps] = useState(0);
  const [warn, setWarn] = useState<string | null>(null);
  const rewards = useRewardSystem();
  const [coins, setCoins] = useState(0);
  useEffect(() => setCoins(rewards.coins), [rewards.coins]);
  const spendCoins = (amount: number) => {
    const spent = rewards.spend(amount, storage);
    setCoins(blApi.rewards.getCoins(storage));
    return spent;
  };
  const [result, setResult] = useState<{
    time: number;
    best: number | null;
    isRecord: boolean;
    coinsEarned: number;
    isFirstSolve: boolean;
  } | null>(null);
  const hints = useHints(setCoins);
  const boardCars = blApi.hints.peekBoardCars(start, cars, hints.peek);
  const [calOpen, setCalOpen] = useState(openCalendar);
  const dragStart = useRef<{
    id: string;
    pointerId: number;
    x: number;
    y: number;
    pitch: number;
    min: number;
    max: number;
  } | null>(null);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  useEffect(() => {
    if (!dragEnabled) {
      dragStart.current = null;
      setDrag(null);
    }
  }, [dragEnabled]);
  const submitting = useRef(false);

  const failReason: "bumps" | "moves" | null =
    result || wonAt !== null
      ? null
      : bumps >= 3
        ? "bumps"
        : blApi.game.isOutOfMoves(moves, par)
          ? "moves"
          : null;

  const failed = failReason !== null;

  const reset = (cs: Car[]) => {
    hints.reset();
    setCars(cs);
    setSel(null);
    setHidden(new Set());
    setStartedAt(null);
    setMoves(0);
    setWonAt(null);
    setBumps(0);
    setResult(null);
    setWarn(null);
    setMove(null);
    setSteps(1);
    setDrag(null);
    dragStart.current = null;
    submitting.current = false;
    setCoins(blApi.rewards.getCoins(storage));
  };

  useEffect(() => {
    let live = true;
    setLoading(true);
    blApi.game.getDailyPuzzle(date).then((p) => {
      if (!live) return;
      setStart(p.cars);
      setPar(p.par);
      reset(p.cars);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [date]);

  const elapsed = startedAt
    ? Math.floor(((result ? startedAt + result.time * 1000 : (wonAt ?? now)) - startedAt) / 1000)
    : 0;
  const started = startedAt !== null;

  const flash = useCallback((t: string) => {
    setWarn(t);
    setTimeout(() => setWarn((w) => (w === t ? null : w)), 1600);
  }, []);

  const useHint = async (type: HintType, id?: string): Promise<string | void> => {
    if (!started || result || failed || !blApi.hints.available(type, "medium", hidden, []))
      return t("noHint");
    const currentCoins = blApi.rewards.getCoins(storage);
    if (currentCoins < blApi.constants.hintCosts[type])
      return t("hintCost", { cost: blApi.constants.hintCosts[type], have: currentCoins });
    if (type === "next") {
      const before = cars;
      const nextMove =
        typeof Worker === "undefined"
          ? blApi.game.getNextBestMove(cars)
          : await blApi.game.findNextMove(cars).catch(() => null);
      if (!nextMove || before !== currentCars.current) return t("noHint");
      if (!hints.charge(type)) return t("noHint");
      setSel(nextMove.id);
      setMove(nextMove.move);
      setSteps(nextMove.steps);
      flash(t("hintMsg", { id: nextMove.id, arrow: ARROW[nextMove.move], steps: nextMove.steps }));
    } else if (type === "peek") {
      if (!hints.charge(type)) return t("noHint");
      hints.startPeek();
    } else if (type === "reveal") {
      if (!id || !hidden.has(id)) return t("noHint");
      if (!hints.charge(type)) return t("noHint");
      setHidden((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    }
  };

  const blockerOf = useCallback(
    (car: Car, direction: Move, count: number) => findBlocker(cars, car, direction, count),
    [cars],
  );

  const go = useCallback(
    (m: Move, id = sel, count = steps) => {
      if (startedAt === null || result || failed || wonAt !== null || hints.peek) return;
      const c = cars.find((x) => x.id === id);
      if (!c) return flash(t("needCar"));
      const r = commitMove(c.id, m, count);
      if (r.error) {
        const b = r.error.startsWith("Blocked") ? blockerOf(c, m, count) : undefined;
        if (b && hidden.has(b) && !hints.peek) {
          setBumps((n) => n + 1);
          return flash(t("bumpedInvisible"));
        }
        return flash(te(r.error));
      }
      setWarn(null);
      if (blApi.game.isSolved(r.cars)) {
        submitting.current = true;
        setWonAt(Date.now());
        const time = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const name = storage.getItem("player_name") || "Player";

        const isFirstSolve = !blApi.dailyScores.isSolvedOn(date, storage);

        void blApi.dailyScores
  .submitScore({ date, solve_time: time, player_name: name }, storage, remoteScore)
  .then((res) => {
            let coinsEarned = 0;
            if (isFirstSolve) {
              coinsEarned += 30;
            }
            if (res.isRecord) {
              coinsEarned += 50;
            }

            if (coinsEarned > 0) {
              blApi.rewards.addCoins(coinsEarned, storage);
              setCoins(blApi.rewards.getCoins(storage));
            }

            setResult({ time, ...res, coinsEarned, isFirstSolve });
          });
      }
    },
    [
      sel,
      steps,
      startedAt,
      result,
      failed,
      cars,
      blockerOf,
      hidden,
      flash,
      date,
      t,
      te,
      hints.peek,
      wonAt,
      storage,
remoteScore,
    ],
  );

  const execute = () => {
    if (!started) return flash(t("needStart"));
    if (!sel) return flash(t("needCar"));
    if (!move) return flash(t("needDir"));
    void go(move);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        !keyboardEnabled ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.repeat ||
        hints.open ||
        hints.peek ||
        calOpen ||
        result ||
        failed ||
        !started ||
        wonAt !== null
      )
        return;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, select, [role='dialog']"))
      )
        return;
      const char = e.code.startsWith("Key") ? e.code.slice(3) : e.key.toUpperCase();
      if (cars.some((c) => c.id === char)) {
        e.preventDefault();
        setSel(char);
        return;
      }
      if (["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        setSteps(Number(e.key));
        return;
      }
      const arrows: Record<string, Move> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      const direction = arrows[e.key];
      if (direction) {
        e.preventDefault();
        setMove(direction);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        execute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cars,
    calOpen,
    result,
    failed,
    started,
    move,
    go,
    flash,
    hints.open,
    hints.peek,
    keyboardEnabled,
  ]);

  const handlePointerDown = (c: Car, e: PointerEvent<HTMLButtonElement>) => {
    if (
      !dragEnabled ||
      !started ||
      result ||
      failed ||
      hints.open ||
      hints.peek ||
      calOpen ||
      wonAt !== null ||
      !e.isPrimary ||
      e.button !== 0 ||
      dragStart.current
    )
      return;
    const board = e.currentTarget.parentElement;
    const cell = board?.querySelector(".cell");
    if (!board || !cell) return;
    const pitch =
      cell.getBoundingClientRect().width + (parseFloat(getComputedStyle(board).columnGap) || 0);
    if (pitch <= 0) return;
    const { back, fwd } = movementRange(cars, c);
    e.currentTarget.setPointerCapture(e.pointerId);
    setSel(c.id);
    dragStart.current = {
      id: c.id,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      pitch,
      min: -back * pitch,
      max: fwd * pitch,
    };
  };

  const handlePointerMove = (c: Car, e: PointerEvent<HTMLButtonElement>) => {
    const d = dragStart.current;
    if (!dragEnabled || !d || d.id !== c.id || d.pointerId !== e.pointerId) return;
    const raw = c.dir === "h" ? e.clientX - d.x : e.clientY - d.y;
    setDrag({ id: c.id, offset: Math.max(d.min, Math.min(d.max, raw)) });
  };

  const handlePointerUp = (c: Car, e: PointerEvent<HTMLButtonElement>) => {
    const d = dragStart.current;
    if (!dragEnabled || !d || d.id !== c.id || d.pointerId !== e.pointerId) return;
    dragStart.current = null;
    setDrag(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    const raw = c.dir === "h" ? e.clientX - d.x : e.clientY - d.y;
    const offset = Math.max(d.min, Math.min(d.max, raw));
    const count = Math.round(offset / d.pitch);
    const direction: Move = c.dir === "h" ? (raw > 0 ? "right" : "left") : raw > 0 ? "down" : "up";
    if (Math.abs(raw - offset) > 20) {
      const blocker = blockerOf(c, direction, Math.abs(count) + 1);
      if (blocker && hidden.has(blocker) && !hints.peek) {
        setBumps((n) => n + 1);
        flash(t("bumpedInvisible"));
      }
    }
    if (!count) return;
    setMove(direction);
    setSteps(Math.abs(count));
    void go(direction, c.id, Math.abs(count));
  };

  const label = new Date(`${date}T12:00:00`).toLocaleDateString(lang === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    t,
    te,
    lang,
    start,
    setStart,
    par,
    setPar,
    cars,
    setCars,
    moves,
    setMoves,
    startedAt,
    setStartedAt,
    now,
    setNow,
    wonAt,
    setWonAt,
    commitMove,
    loading,
    setLoading,
    sel,
    setSel,
    steps,
    setSteps,
    move,
    setMove,
    hidden,
    setHidden,
    bumps,
    setBumps,
    warn,
    setWarn,
    coins,
    setCoins,
    spendCoins,
    result,
    setResult,
    hints,
    boardCars,
    calOpen,
    setCalOpen,
    dragStart,
    drag,
    setDrag,
    submitting,
    failed,
    failReason,
    reset,
    elapsed,
    started,
    flash,
    useHint,
    blockerOf,
    go,
    execute,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    label,
  };
}