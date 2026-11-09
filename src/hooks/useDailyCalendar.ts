import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getMySolves } from "@/engine/daily-scores";
import { todayKey } from "@/engine/game";
import { useI18n } from "@/lib/i18n";
const FIRST = "2026-01-01";
export function useDailyCalendar(open: boolean, current: string, onClose: () => void) {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [month, setMonth] = useState(() => new Date(`${current}T12:00:00`));
  const [solves, setSolves] = useState<Record<string, number>>({});
  const [today, setToday] = useState(current);

  useEffect(() => {
    if (open) { setSolves(getMySolves()); setToday(todayKey()); setMonth(new Date(`${current}T12:00:00`)); }
  }, [open, current]);


  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const shift = (d: number) => setMonth(new Date(y, m + d, 1));
  const key = (d: number) => todayKey(new Date(y, m, d));

  const entries = Array.from({ length: days }, (_, i) => { const d = i + 1; const k = key(d); return { d, k, locked: k > today || k < FIRST, time: solves[k] }; });
  const select = (date: string) => { onClose(); void navigate({ to: "/daily/$date", params: { date } }); };
  return { t, lang, month, first, days, shift, key, today, entries, select };
}
