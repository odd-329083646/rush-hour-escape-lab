// Daily scores. Stored on this device until an online scoreboard is connected.
export type DailyScore = { date: string; solve_time: number; player_name: string };

const ALL_KEY = "daily_scores";
const MINE_KEY = "daily_my_solves";

function read<T>(k: string, fb: T): T {
  try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return fb; }
}

/** Fastest recorded time (seconds) for a date, or null. */
export async function getBestTime(date: string): Promise<number | null> {
  const times = read<DailyScore[]>(ALL_KEY, []).filter((s) => s.date === date).map((s) => s.solve_time);
  return times.length ? Math.min(...times) : null;
}

/** Saves a solve and reports whether it beat the previous best for that date. */
export async function submitScore(score: DailyScore): Promise<{ best: number | null; isRecord: boolean }> {
  const prev = await getBestTime(score.date);
  const all = read<DailyScore[]>(ALL_KEY, []);
  all.push(score);
  localStorage.setItem(ALL_KEY, JSON.stringify(all));
  const mine = getMySolves();
  if (mine[score.date] == null || score.solve_time < mine[score.date]!) mine[score.date] = score.solve_time;
  localStorage.setItem(MINE_KEY, JSON.stringify(mine));
  return { best: prev, isRecord: prev === null || score.solve_time < prev };
}

/** The player's own best time per date. */
export function getMySolves(): Record<string, number> {
  return read<Record<string, number>>(MINE_KEY, {});
}

export function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
