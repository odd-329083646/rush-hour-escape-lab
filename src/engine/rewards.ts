// src/engine/rewards.ts
import type { StoragePort } from "./contracts";
import { calculateStars, type LevelStats } from "./game";

const fallbackStorage: StoragePort = {
  getItem: () => null,
  setItem: () => {},
};

export function getSavedProgress(
  levelKey: string,
  storage: StoragePort = fallbackStorage,
): Record<number, LevelStats> {
  try {
    const raw = storage.getItem(`rush_hour_progress_${levelKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * שומר את תוצאת השלב, מעדכן שיאים ומעניק מטבעות (בפתירה ראשונה בלבד)
 */
export function saveLevelProgress(
  levelKey: string,
  puzzleIdx: number,
  moves: number,
  par: number,
  timeInSeconds: number,
  bumps: number = 0,
  storage: StoragePort = fallbackStorage,
): { stars: number; coinsEarned: number; isRecord: boolean } {
  const stars = calculateStars(moves, par, bumps);
  const current = getSavedProgress(levelKey, storage);
  const prev = current[puzzleIdx];

  // בדיקה האם זו הפעם הראשונה שהשלב נפתר
  const isFirstSolve = !prev || (prev.stars ?? 0) === 0;

  // מעדכנים אם זו פעם ראשונה או שהתוצאה טובה יותר
  const newStars = Math.max(stars, prev?.stars ?? 0);
  const newBestTime = prev ? Math.min(timeInSeconds, prev.bestTime) : timeInSeconds;
  const newBestMoves = prev ? Math.min(moves, prev.bestMoves) : moves;

  current[puzzleIdx] = {
    stars: newStars,
    bestTime: newBestTime,
    bestMoves: newBestMoves,
  };

  storage.setItem(`rush_hour_progress_${levelKey}`, JSON.stringify(current));

  // חישוב מטבעות: 10 מטבעות לכל כוכב — מוענקים אך ורק בפתירה הראשונה
  let coinsEarned = 0;
  if (isFirstSolve) {
    coinsEarned = stars * 10;
    addCoins(coinsEarned, storage);
  }

  const isRecord =
    !!prev && (prev.stars ?? 0) > 0 && (moves < prev.bestMoves || timeInSeconds < prev.bestTime);
  return { stars: newStars, coinsEarned, isRecord };
}

/**
 * משיג את כמות המטבעות הנוכחית של השחקן
 */
export function getCoins(storage: StoragePort = fallbackStorage): number {
  return parseInt(storage.getItem("rush_hour_coins") ?? "0", 10) || 0;
}

/**
 * מוסיף (או מוריד) מטבעות למאזן המשתמש ומפיץ אירוע עדכון
 */
export function addCoins(amount: number, storage: StoragePort = fallbackStorage): number {
  if (!Number.isSafeInteger(amount)) return getCoins(storage);
  const newBalance = Math.max(0, getCoins(storage) + amount);
  storage.setItem("rush_hour_coins", String(newBalance));

  // שליחת אירוע בדפדפן כדי לעדכן רכיבי React בזמן אמת
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rush_hour_coins_updated"));
  }

  return newBalance;
}
