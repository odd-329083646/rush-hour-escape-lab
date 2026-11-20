// src/engine/daily-scores.ts
import type { DailyScoreRemotePort, StoragePort } from "./contracts";

export type DailyScore = { date: string; solve_time: number; player_name: string };

const MINE_KEY = "daily_my_solves";
const RECORDS_KEY = "daily_world_records";

const fallbackStorage: StoragePort = {
  getItem: () => null,
  setItem: () => {},
};

const fallbackRemote: DailyScoreRemotePort = {
  readDailyBest: async () => null,
  writeDailyScore: async () => {},
};

/** Number of daily solves that set a new world record on this device. */
export function getWorldRecordCount(storage: StoragePort = fallbackStorage): number {
  const n = Number(storage.getItem(RECORDS_KEY));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** הזמן הכי מהיר שנרשם בשרת לחידה של תאריך מסוים */
export async function getBestTime(
  date: string,
  remote: DailyScoreRemotePort = fallbackRemote,
): Promise<number | null> {
  return remote.readDailyBest(date);
}

/** בדיקה אם הזמן הנוכחי שובר את השיא העולמי */
export function isRecord(time: number, best: number | null): boolean {
  return best === null || time < best;
}

/** הגשת התוצאה לשרת ושמירתה במכשיר */
export async function submitScore(
  score: DailyScore,
  storage: StoragePort = fallbackStorage,
  remote: DailyScoreRemotePort = fallbackRemote,
): Promise<{ best: number | null; isRecord: boolean }> {
  let best: number | null = null;
  try {
    best = await getBestTime(score.date, remote);
  } catch {
    saveMine(score, storage);
    return { best: null, isRecord: false };
  }

  const beaten = isRecord(score.solve_time, best);

  // שמירה בשרת הנתונים ובאחסון המקומי
  try {
    await remote.writeDailyScore(score);
  } catch {
    saveMine(score, storage);
    return { best, isRecord: false };
  }
  saveMine(score, storage);
  if (beaten) storage.setItem(RECORDS_KEY, String(getWorldRecordCount(storage) + 1));

  return { best, isRecord: beaten };
}

function saveMine(score: DailyScore, storage: StoragePort = fallbackStorage) {
  const mine = getMySolves(storage);
  const previous = mine[score.date];
  if (previous == null || score.solve_time < previous) {
    mine[score.date] = score.solve_time;
  }
  storage.setItem(MINE_KEY, JSON.stringify(mine));
}

/** מחזיר את הפתירות של השחקן מתוך האחסון המקומי (מתוקן ללא שגיאות parse) */
export function getMySolves(storage: StoragePort = fallbackStorage): Record<string, number> {
  try {
    const raw = storage.getItem(MINE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isSolvedOn(date: string, storage: StoragePort = fallbackStorage): boolean {
  return getMySolves(storage)[date] != null;
}

export function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
