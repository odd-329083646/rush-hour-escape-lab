import { useSettings } from "@/hooks/useSettings";
import { useStandardGame } from "@/hooks/useStandardGame";
import { useExitAnimation } from "@/hooks/useExitAnimation";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, ChevronDown, ChevronUp, Eye, Home, Layers, Lightbulb, Lock, Play, Plus, RotateCcw, Send, Star, Timer, Trash2, Trophy, WifiOff, Shuffle, X } from "lucide-react";
import { LEVELS, IS_OFFLINE_MODE, TIERS, type Car, type Level, type Move } from "@/lib/puzzles";
import { Button } from "@/components/ui/button";
import { SettingsButton } from "@/components/settings-dialog";
import { HintSelection } from "@/components/hint-selection";
import { VictoryOverlay, FailureOverlay } from "@/components/victory-overlay";
import { CoinsBadge } from "@/components/coins-badge";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/game/$level")({
  beforeLoad: ({ params }) => {
    if (!(params.level in LEVELS)) throw notFound();
  },
  head: ({ params }) => {
    const t = `${LEVELS[params.level as Level]?.title ?? "Game"} — Rush Hour Vanishing Cars`;
    return {
      meta: [
        { title: t },
        { name: "description", content: "Pick a car, choose a direction and steps, and execute." },
        { property: "og:title", content: t },
        { property: "og:description", content: "Pick a car, choose a direction and steps, and execute." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Game,
});

const DIRS: { m: Move; Icon: typeof ArrowUp; cls: string }[] = [
  { m: "up", Icon: ArrowUp, cls: "col-start-2 row-start-1" },
  { m: "left", Icon: ArrowLeft, cls: "col-start-1 row-start-2" },
  { m: "right", Icon: ArrowRight, cls: "col-start-3 row-start-2" },
  { m: "down", Icon: ArrowDown, cls: "col-start-2 row-start-3" },
];
const ARROW: Record<Move, string> = { up: "↑", down: "↓", left: "←", right: "→" };

function Game() {
  const { panelsVisible } = useSettings();
  const { level } = Route.useParams() as { level: Level };
  const { openHints, tiers, drawRandom, t, murderer, idx, puzzle, cars, moves, sel, setSel, move, setMove, steps, setSteps, msg, warn, started, hidden, plan, setPlan, levelsOpen, setLevelsOpen, failed, failReason, simulating, invisibleBumps, wonStars, coins, hints, boardRevealed, boardCars, murdererBoard, setMurdererBoard, collapsedTiers, won, wonAt, clock, progress, toggleTier, formatTime, loadPuzzle, jumpTo, start, useHint, execute, submitPlan, isLast, standard, trucks, showBoard, dragStart, drag, setDrag, handlePointerDown, handlePointerMove, handlePointerUp } = useStandardGame(level);
  const victoryReady = useExitAnimation(wonAt);

  // רפרנס לגלילה אוטומטית לסוף רשימת המהלכים בשלב רוצח
  const planEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (murderer && plan.length > 0) {
      planEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [plan, murderer]);

  const carBtn = (c: Car) => (
    <Button variant="ghost" key={c.id} onClick={() => setSel(c.id)} data-active={sel === c.id} title={c.name} className="palette-cell" disabled={simulating}>
      <span className="h-3 rounded-sm" style={{ background: c.color, width: c.len === 3 ? "2.5rem" : "1.5rem" }} />
      <span className="text-xs">{c.id} {c.dir === "h" ? "↔" : "↕"}</span>
    </Button>
  );

  return (
    <main className="lot-bg flex h-dvh flex-col gap-2 overflow-hidden px-2 py-2 sm:px-4">
      {/* באנר התראה למצב אופליין */}
      {IS_OFFLINE_MODE && (
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 sm:text-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>{t("offline")}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={drawRandom}
            className="h-7 gap-1 text-xs"
          >
            <Shuffle className="h-3 w-3" /> {t("randomLevel")}
          </Button>
        </div>
      )}

     <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-2 overflow-x-auto">
