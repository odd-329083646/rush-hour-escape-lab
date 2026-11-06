import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtTime, getMySolves } from "@/lib/daily-scores";
import { todayKey } from "@/lib/puzzles";

const FIRST = "2026-01-01";
const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DailyCalendar({ open, onClose, current }: { open: boolean; onClose: () => void; current: string }) {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => new Date(`${current}T12:00:00`));
  const [solves, setSolves] = useState<Record<string, number>>({});
  const [today, setToday] = useState(current);

  useEffect(() => {
    if (open) { setSolves(getMySolves()); setToday(todayKey()); setMonth(new Date(`${current}T12:00:00`)); }
  }, [open, current]);
  if (!open) return null;

  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const shift = (d: number) => setMonth(new Date(y, m + d, 1));
  const key = (d: number) => todayKey(new Date(y, m, d));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-3 backdrop-blur" onClick={onClose}>
      <div className="panel w-full max-w-md" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Calendar">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => shift(-1)} disabled={key(1) <= FIRST} aria-label="Previous month"><ChevronLeft /></Button>
          <h2 className="font-display font-bold">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} · לוח שנה</h2>
          <div className="flex">
            <Button variant="ghost" size="icon" onClick={() => shift(1)} disabled={key(days) >= today} aria-label="Next month"><ChevronRight /></Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {WEEK.map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
            const k = key(d);
            const locked = k > today || k < FIRST;
            const t = solves[k];
            return (
              <button
                key={k}
                disabled={locked}
                onClick={() => { onClose(); navigate({ to: "/daily/$date", params: { date: k } }); }}
                data-active={k === current}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border border-border text-sm transition-colors hover:bg-accent disabled:opacity-35 disabled:hover:bg-transparent data-[active=true]:border-primary"
              >
                <span className="font-display">{d}</span>
                {locked ? <Lock className="h-3 w-3" /> : t != null ? (
                  <span className="flex items-center text-[10px] text-primary"><Check className="h-3 w-3" />{fmtTime(t)}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
