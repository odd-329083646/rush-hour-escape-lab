import { storageService } from "@/services/storageService";
import { calculateStars, type LevelStats } from "./game";
export function getSavedProgress(levelKey: string): Record<number, LevelStats> {
  try {
    const raw = storageService.getItem(`rush_hour_progress_${levelKey}`);
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
  bumps: number = 0
): { stars: number; coinsEarned: number } {
  const stars = calculateStars(moves, par, bumps);
  const current = getSavedProgress(levelKey);
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

  storageService.setItem(`rush_hour_progress_${levelKey}`, JSON.stringify(current));

  // חישוב מטבעות: 10 מטבעות לכל כוכב — מוענקים אך ורק בפתירה הראשונה
  let coinsEarned = 0;
  if (isFirstSolve) {
    coinsEarned = stars * 10;
    addCoins(coinsEarned);
  }

  return { stars: newStars, coinsEarned };
}

/**
 * משיג את כמות המטבעות הנוכחית של השחקן
 */
export function getCoins(): number {
  return parseInt(storageService.getItem("rush_hour_coins") ?? "0", 10) || 0;
}

/**
 * מוסיף (או מוריד) מטבעות למאזן המשתמש
 */
export function addCoins(amount: number): number {
  if (!Number.isSafeInteger(amount)) return getCoins();
  const newBalance = Math.max(0, getCoins() + amount);
  storageService.setItem("rush_hour_coins", String(newBalance));
  return newBalance;
}

