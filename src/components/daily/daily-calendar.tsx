import { useDailyCalendar } from "@/hooks/useDailyCalendar";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtTime, getMySolves } from "@/lib/daily-scores";
import { todayKey } from "@/lib/puzzles";
import { useI18n } from "@/lib/i18n";

const FIRST = "2026-01-01";

export function DailyCalendar({ open, onClose, current }: { open: boolean; onClose: () => void; current: string }) {
  const { t, lang, month, first, days, shift, key, today, entries, select } = useDailyCalendar(open, current, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-3 backdrop-blur" onClick={onClose}>
      <div className="panel w-full max-w-md" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t("calendar")}>
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => shift(-1)} disabled={key(1) <= FIRST} aria-label={t("prevMonth")}><ChevronLeft className="rtl:rotate-180" /></Button>
          <h2 className="font-display font-bold">{month.toLocaleDateString(lang === "he" ? "he-IL" : "en-GB", { month: "long", year: "numeric" })}</h2>
          <div className="flex">
            <Button variant="ghost" size="icon" onClick={() => shift(1)} disabled={key(days) >= today} aria-label={t("nextMonth")}><ChevronRight className="rtl:rotate-180" /></Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("close")}><X /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {t("week").split(",").map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
          {entries.map(({ d, k, locked, time: t }) => {
            return (
              <button
                key={k}
                disabled={locked}
                onClick={() => select(k)}
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
