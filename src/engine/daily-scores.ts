import { storageService } from "@/services/storageService";
import { readDailyBest, writeDailyScore } from "@/services/supabaseService";

export type DailyScore = { date: string; solve_time: number; player_name: string };

const MINE_KEY = "daily_my_solves";
const RECORDS_KEY = "daily_world_records";

/** Number of daily solves that set a new world record on this device. */
export function getWorldRecordCount(): number {
  const n = Number(storageService.getItem(RECORDS_KEY));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** הזמן הכי מהיר שנרשם בשרת לחידה של תאריך מסוים */
export async function getBestTime(date: string): Promise<number | null> {
  return readDailyBest(date);
}

/** בדיקה אם הזמן הנוכחי שובר את השיא העולמי */
export function isRecord(time: number, best: number | null): boolean {
  return best === null || time < best;
}

/** הגשת התוצאה לשרת ושמירתה במכשיר */
export async function submitScore(score: DailyScore): Promise<{ best: number | null; isRecord: boolean }> {
  let best: number | null = null;
  try {
    best = await getBestTime(score.date);
  } catch {
    saveMine(score);
    return { best: null, isRecord: false };
  }

  const beaten = isRecord(score.solve_time, best);
  
  // שמירה ב-Supabase וב-LocalStorage המקומי
  try { await writeDailyScore(score); } catch { saveMine(score); return { best, isRecord: false }; }
  saveMine(score);
  if (beaten) storageService.setItem(RECORDS_KEY, String(getWorldRecordCount() + 1));

  return { best, isRecord: beaten };
}

function saveMine(score: DailyScore) {
  const mine = getMySolves();
  const previous = mine[score.date];
  if (previous == null || score.solve_time < previous) {
    mine[score.date] = score.solve_time;
  }
  storageService.setItem(MINE_KEY, JSON.stringify(mine));
}

/** מחזיר את הפתירות של השחקן מתוך LocalStorage (מתוקן ללא שגיאות parse) */
export function getMySolves(): Record<string, number> {
  try {
    const raw = storageService.getItem(MINE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isSolvedOn(date: string): boolean {
  return getMySolves()[date] != null;
}

export function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
