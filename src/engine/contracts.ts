// src/engine/contracts.ts

/**
 * חוזה בסיסי לאחסון מפתח-ערך (כמו LocalStorage או זיכרון).
 * שכבת ה-engine עובדת מול הממשק הזה בלבד, בלי להכיר את storageService.
 */
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

/**
 * חוזה לתקשורת מול שרת הנתונים עבור השיאים היומיים.
 * מונע מ-daily-scores.ts לייבא ישירות את supabaseService.
 */
export interface DailyScoreRemotePort {
  readDailyBest(date: string): Promise<number | null>;
  writeDailyScore(score: { date: string; solve_time: number; player_name: string }): Promise<void>;
}

/**
 * מבנה נתונים גולמי למכונית כפי שמתקבל ממקור הנתונים (DAL).
 */
export interface RawCarData {
  id: string;
  row: number;
  col: number;
  dir: "h" | "v";
  len?: number;
}

/**
 * מבנה נתונים גולמי לשלב משחק כפי שמתקבל ממקור הנתונים (DAL).
 */
export interface RawPuzzleData {
  par: number;
  cars: RawCarData[];
}

/**
 * חוזה לטעינת שלבים ממקור נתונים חיצוני (רשת / קובצי JSON).
 * מונע מ-game.ts להיות תלוי ישירות ב-puzzleRepository.
 */
export interface PuzzleRepositoryPort {
  fetchCatalogue(): Promise<RawPuzzleData[]>;
  fetchDailyPuzzle(dateKey: string): Promise<RawPuzzleData>;
}