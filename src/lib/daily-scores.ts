// Daily scores: the global record lives in the shared daily_scores table;
// the player's own solves are also kept on this device for the calendar.
import { supabase } from "@/integrations/supabase/client";

export type DailyScore = { date: string; solve_time: number; player_name: string };

const MINE_KEY = "daily_my_solves";

/** Fastest recorded time (seconds) for a date across all players, or null. */
export async function getBestTime(date: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("daily_scores").select("solve_time").eq("date", date)
    .order("solve_time", { ascending: true }).limit(1);
  if (error) throw error;
  return data?.[0]?.solve_time ?? null;
}

/** A record only when strictly faster than the global best, or the first score of the date. */
export function isRecord(time: number, best: number | null): boolean {
  return best === null || time < best;
}

/** Reads the global best, then saves the solve. Reports the previous best and whether it was beaten. */
export async function submitScore(score: DailyScore): Promise<{ best: number | null; isRecord: boolean }> {
  saveMine(score);
  let best: number | null = null;
  try {
    best = await getBestTime(score.date);
  } catch {
    return { best: null, isRecord: false }; // can't verify a world record offline
  }
  await supabase.from("daily_scores").insert(score);
  return { best, isRecord: isRecord(score.solve_time, best) };
}

function saveMine(score: DailyScore) {
  const mine = getMySolves();
  if (mine[score.date] == null || score.solve_time < mine[score.date]!) mine[score.date] = score.solve_time;
  localStorage.setItem(MINE_KEY, JSON.stringify(mine));
}

/** The player's own best time per date. */
export function getMySolves(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(MINE_KEY) ?? "") ?? {}; } catch { return {}; }
}

export function isSolvedOn(date: string): boolean {
  return getMySolves()[date] != null;
}

export function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
