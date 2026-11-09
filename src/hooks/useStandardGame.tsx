import { storageService } from "@/services/storageService";
import { useEffect, useState, useRef } from "react";
import { applyMove, isSolved, LEVELS, pickHidden, runPlan, DEFAULT_PUZZLES, IS_OFFLINE_MODE, getRandomPuzzle, saveLevelProgress, getSavedProgress, getCoins, addCoins, getNextBestMove, TIERS, isTierUnlocked, getSolvesCountInTier, getPuzzlesForTier, type Car, type Level, type Move } from "@/lib/puzzles";
import { useI18n } from "@/lib/i18n";
import { useHints } from "@/hooks/use-hints";
import { HINT_COSTS, hintAvailable, peekBoardCars, validateHintPlan, type HintType } from "@/lib/hints";

import { useGameEngine, movementRange, blockerOf } from "@/hooks/useGameEngine";
import { loadPuzzlesAsync } from "@/services/puzzleRepository";

const ARROW: Record<Move, string> = { up: "↑", down: "↓", left: "←", right: "→" };
type Planned = { id: string; move: Move; steps: number };

export function useStandardGame(level: Level) {
  const { t, te, lang } = useI18n();
  const murderer = level === "murderer";
  const idxKey = `rush_hour_puzzle_index_${level}`;
  const maxKey = `rush_hour_max_solved_${level}`;

  const [puzzles, setPuzzles] = useState(DEFAULT_PUZZLES);
  const [idx, setIdx] = useState(0);
  const [maxSolved, setMaxSolved] = useState(-1);
  const puzzle = puzzles[idx] ?? puzzles[0] ?? { par: 0, cars: [] as Car[] };
  const { cars, setCars, moves, setMoves, startedAt, setStartedAt, now, setNow, wonAt, setWonAt, commitMove } = useGameEngine(puzzle?.cars ?? []);
  const [initialCars, setInitialCars] = useState<Car[]>(puzzle?.cars ?? []);
  const [sel, setSel] = useState<string | null>(null);
  const [move, setMove] = useState<Move | null>(null);
  const [steps, setSteps] = useState(1);

  const [msg, setMsg] = useState<string>(t("msgStudy"));
  const [warn, setWarn] = useState<{ text: string; key: number } | null>(null);
  const [started, setStarted] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());



  const [plan, setPlan] = useState<Planned[]>([]);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [invisibleBumps, setInvisibleBumps] = useState(0);
  const [wonStars, setWonStars] = useState(3);
  const [coins, setCoinsState] = useState(0);
  const hints = useHints(setCoinsState);
  const boardRevealed = hints.peek;
  const boardCars = peekBoardCars(initialCars, cars, hints.peek);
  const [murdererBoard, setMurdererBoard] = useState(false);
  const [collapsedTiers, setCollapsedTiers] = useState<Record<string, boolean>>({});

  const won = wonAt !== null;
  // Re-render the idle hint in the newly chosen language.
  useEffect(() => { if (!started) setMsg(t("msgStudy")); }, [lang]);
  const elapsed = startedAt ? Math.floor(((wonAt ?? now) - startedAt) / 1000) : 0;
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

  const progress = getSavedProgress(level);

  const toggleTier = (tierId: string) => {
    setCollapsedTiers((prev) => ({ ...prev, [tierId]: !prev[tierId] }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const loadPuzzle = (i: number, currentPuzzles = puzzles) => {
    const p = currentPuzzles[i] ?? currentPuzzles[0];
    if (!p) return;
    hints.reset();
    setMurdererBoard(false);
    setIdx(currentPuzzles.indexOf(p));
    setCars(p.cars);
    setInitialCars(p.cars);
    setSel(null); setMove(null); setSteps(1); setMoves(0);
    setMsg(t("msgStudy"));
    setWarn(null); setStarted(false); setHidden(new Set());
    setStartedAt(null); setWonAt(null); setPlan([]); setFailed(false); setSimulating(false);
    setInvisibleBumps(0);
    setWonStars(3);
    setCoinsState(getCoins());
  };

  useEffect(() => {
    setPuzzles(DEFAULT_PUZZLES);
    let live = true;
    void loadPuzzlesAsync().then((loaded) => { if (live && !started) { setPuzzles(loaded); loadPuzzle(Math.min(idx, loaded.length - 1), loaded); } });
    setCoinsState(getCoins());
    
    const maxS = Number.isFinite(parseInt(storageService.getItem(maxKey) ?? "", 10))
      ? parseInt((storageService.getItem(maxKey) ?? ""), 10)
      : -1;
    
    setMaxSolved(maxS);
    
    const nextLevelIdx = Math.max(0, Math.min(maxS + 1, DEFAULT_PUZZLES.length - 1));
    loadPuzzle(nextLevelIdx, DEFAULT_PUZZLES);
    return () => { live = false; };
  }, [level]);

  const markWon = () => {
    setWonAt(Date.now());
    setSel(null);

    const timeInSeconds = elapsed;
    const { stars, coinsEarned } = saveLevelProgress(
      level,
      idx,
      moves,
      puzzle.par,
      timeInSeconds,
      invisibleBumps
    );

    setWonStars(stars);
    setCoinsState(getCoins());
    setMsg(t("msgWon", { stars, coins: coinsEarned }));

    if (idx > maxSolved) {
      setMaxSolved(idx);
      storageService.setItem(maxKey, String(idx));
    }
  };

  const jumpTo = (i: number) => {
    storageService.setItem(idxKey, String(i));
    loadPuzzle(i);
    setLevelsOpen(false);
  };

  const start = () => {
    setHidden(pickHidden(cars, level));
    setStarted(true);
    setStartedAt(Date.now());
    setMsg(t(murderer ? "msgMurderer" : level === "hard" ? "msgHard" : level === "medium" ? "msgMedium" : "msgEasy"));
  };

  const flash = (text: string) => {
    const key = Date.now();
    setWarn({ text, key });
    setTimeout(() => setWarn((w) => (w?.key === key ? null : w)), 1800);
  };

  const useHint = (type: HintType, id?: string): string | void => {
    if (!started || won || failed || simulating || !hintAvailable(type, level, hidden, plan)) return t("noHint");
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
      if (murderer) setMurdererBoard(true);
    } else {
      const result = validateHintPlan(cars, plan);
      if (!hints.charge(type)) return t("noHint");
      return result.error ? t("hintPlanInvalid", { n: (result.failedAt ?? 0) + 1, error: te(result.error) }) : t("hintPlanValid");
    }
  };

  const checkInvisibleBump = (car: Car, direction: Move, count: number) => {
    if (level !== "medium" && level !== "hard") return false;
    const blocker = blockerOf(cars, car, direction, count);
    return !!blocker && hidden.has(blocker) && !boardRevealed;
  };

  const execute = () => {
    if (hints.peek) return;
    if (!started) return flash(t("needStart"));
    if (!sel) return flash(t("needCar"));
    if (!move) return flash(t("needDir"));
    if (murderer) { setPlan((p) => [...p, { id: sel, move, steps }]); return; }

    const c = cars.find((x) => x.id === sel);
    if (c && checkInvisibleBump(c, move, steps)) {
      const newBumps = invisibleBumps + 1;
      setInvisibleBumps(newBumps);
      if (newBumps >= 3) {
        setFailed(true);
      } else {
        flash(t("invisibleBump", { n: newBumps }));
      }
      return;
    }

    const r = commitMove(sel, move, steps);
    if (r.error) return flash(te(r.error));
    setWarn(null);
    if (isSolved(r.cars)) markWon(); else setMsg(t("msgMoved"));
  };

  const submitPlan = async () => {
    if (simulating || hints.peek) return;
    if (!plan.length) return flash(t("needPlan"));
    
    setSimulating(true);
    setHidden(new Set());
    setMsg(t("msgSimulating"));

    let currentCars = [...cars];

    for (let i = 0; i < plan.length; i++) {
      const p = plan[i];
      if (!p) continue;
      const r = applyMove(currentCars, p.id, p.move, p.steps);
      
      if (r.error) {
        setFailed(true);
        setSimulating(false);
        return;
      }
      
      currentCars = r.cars;
      setCars(currentCars);
      setMoves(i + 1);
      
      await new Promise((res) => setTimeout(res, 700));
    }

    if (isSolved(currentCars)) {
      markWon();
    } else {
      setFailed(true);
    }
    setSimulating(false);
  };

  const isLast = idx >= puzzles.length - 1;
  const standard = cars.filter((c) => c.len === 2);
  const trucks = cars.filter((c) => c.len === 3);
  
  const showBoard = hints.peek || murdererBoard || simulating || !(murderer && started && !won && !failed);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || simulating || hints.open || hints.peek) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [role=dialog]")) return;

      let char = e.key.toUpperCase();
      if (e.code.startsWith("Key")) char = e.code.replace("Key", "");

      const carExists = cars.some((c) => c.id === char);
      if (carExists) {
        setSel(char);
        return;
      }

      if (["1", "2", "3", "4"].includes(e.key)) {
        setSteps(parseInt(e.key, 10));
        return;
      }

      if (e.key === "ArrowUp") { e.preventDefault(); setMove("up"); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setMove("down"); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); setMove("left"); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); setMove("right"); return; }

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (murderer && started) submitPlan();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (!started) {
          start();
        } else if (murderer) {
          if (sel && move) {
            setPlan((p) => [...p, { id: sel, move, steps }]);
          } else {
            flash(t("needCarDir"));
          }
        } else {
          execute();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cars, sel, move, steps, started, murderer, plan, simulating, invisibleBumps, hints.open, hints.peek, hidden, boardRevealed]);

  const dragStart = useRef<{ id: string; x: number; y: number; pitch: number; min: number; max: number } | null>(null);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);

  const freeRange = (car: Car) => movementRange(cars, car);

  const handlePointerDown = (c: Car, e: React.PointerEvent) => {
    if (simulating || (murderer && started) || hints.open || hints.peek) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch (err) {}
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const gap = 6;
    const size = c.dir === "h" ? rect.width : rect.height;
    const pitch = (size + gap) / c.len;
    const { back, fwd } = started && !won ? freeRange(c) : { back: 0, fwd: 0 };
    dragStart.current = { id: c.id, x: e.clientX, y: e.clientY, pitch, min: -back * pitch, max: fwd * pitch };
  };

  const handlePointerMove = (c: Car, e: React.PointerEvent) => {
    if (simulating || hints.peek) return;
    const d = dragStart.current;
    if (!d || d.id !== c.id) return;
    const raw = c.dir === "h" ? e.clientX - d.x : e.clientY - d.y;
    const offset = Math.max(d.min, Math.min(d.max, raw));
    setDrag({ id: c.id, offset });
  };

  const handlePointerUp = (c: Car, e: React.PointerEvent) => {
    if (simulating || hints.peek) return;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
    const d = dragStart.current;
    dragStart.current = null;
    setDrag(null);
    if (!d || d.id !== c.id) return;

    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) { setSel(c.id); return; }
    if (!started) { flash(t("needStart")); return; }

    setSel(c.id);
    const raw = c.dir === "h" ? dx : dy;
    const offset = Math.max(d.min, Math.min(d.max, raw));
    const cellsMoved = Math.round(offset / d.pitch);

    if ((raw > offset + 20 || raw < offset - 20) && (level === "medium" || level === "hard")) {
      const intendedDir: Move = c.dir === "h" ? (raw > 0 ? "right" : "left") : (raw > 0 ? "down" : "up");
      if (checkInvisibleBump(c, intendedDir, Math.abs(cellsMoved) + 1)) {
        const newBumps = invisibleBumps + 1;
        setInvisibleBumps(newBumps);
        if (newBumps >= 3) {
          setFailed(true);
          return;
        } else {
          flash(t("invisibleBump", { n: newBumps }));
        }
      }
    }

    if (cellsMoved === 0) return;
    const moveDir: Move = c.dir === "h" ? (cellsMoved > 0 ? "right" : "left") : (cellsMoved > 0 ? "down" : "up");
    const calculatedSteps = Math.abs(cellsMoved);
    setMove(moveDir);
    setSteps(Math.min(4, calculatedSteps));

    if (murderer) {
      setPlan((p) => [...p, { id: c.id, move: moveDir, steps: calculatedSteps }]);
      return;
    }

    const r = commitMove(c.id, moveDir, calculatedSteps);
    if (r.error) return flash(te(r.error));
    setWarn(null);
    if (isSolved(r.cars)) markWon(); else setMsg(t("msgMoved"));
  };

  return { t, te, lang, murderer, idxKey, maxKey, puzzles, setPuzzles, idx, setIdx, maxSolved, setMaxSolved, puzzle, cars, setCars, moves, setMoves, startedAt, setStartedAt, now, setNow, wonAt, setWonAt, commitMove, initialCars, setInitialCars, sel, setSel, move, setMove, steps, setSteps, msg, setMsg, warn, setWarn, started, setStarted, hidden, setHidden, plan, setPlan, levelsOpen, setLevelsOpen, failed, setFailed, simulating, setSimulating, invisibleBumps, setInvisibleBumps, wonStars, setWonStars, coins, setCoinsState, hints, boardRevealed, boardCars, murdererBoard, setMurdererBoard, collapsedTiers, setCollapsedTiers, won, elapsed, clock, progress, toggleTier, formatTime, loadPuzzle, markWon, jumpTo, start, flash, useHint, checkInvisibleBump, execute, submitPlan, isLast, standard, trucks, showBoard, dragStart, drag, setDrag, freeRange, handlePointerDown, handlePointerMove, handlePointerUp };
}
