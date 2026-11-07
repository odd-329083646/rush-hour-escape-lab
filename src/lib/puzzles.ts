export type Dir = "h" | "v";
export type Level = "easy" | "medium" | "hard" | "murderer";
export type Move = "up" | "down" | "left" | "right";

export type Car = { id: string; name: string; color: string; row: number; col: number; len: 2 | 3; dir: Dir };
export type ShortCar = { id: string; row: number; col: number; dir: Dir };

// משתנה דגל המציין אם האפליקציה פועלת כרגע במצב אופליין
export let IS_OFFLINE_MODE = false;

// מיפוי מרכזי לכל מכונית (שם, צבע ואורך מוגדרים פעם אחת בלבד)
const CAR_DEFAULTS: Record<string, { name: string; color: string; len: 2 | 3 }> = {
  X: { name: "Red Racer", color: "var(--car-red)", len: 2 },
  A: { name: "Green Car", color: "var(--car-green)", len: 2 },
  B: { name: "Orange Car", color: "var(--car-orange)", len: 2 },
  C: { name: "Teal Car", color: "var(--car-teal)", len: 2 },
  D: { name: "Pink Car", color: "var(--car-pink)", len: 2 },
  E: { name: "Light Purple Car", color: "var(--car-light-purple)", len: 2 },
  F: { name: "Dark Green Car", color: "var(--car-dark-green)", len: 2 },
  G: { name: "Slate Truck", color: "var(--car-slate)", len: 2 },
  H: { name: "Blue Car", color: "var(--car-blue)", len: 2 },
  I: { name: "Yellow Car", color: "var(--car-yellow)", len: 2 },
  J: { name: "Purple Car", color: "var(--car-purple)", len: 2 },
  K: { name: "Lime Car", color: "var(--car-lime)", len: 2 },
  O: { name: "Yellow Truck", color: "var(--car-yellow)", len: 3 },
  Q: { name: "Blue Truck", color: "var(--car-blue)", len: 3 },
  P: { name: "Orange Truck", color: "var(--car-orange)", len: 3 },
  R: { name: "Green Truck", color: "var(--car-green)", len: 3 },
};

function inflateCars(shortCars: ShortCar[]): Car[] {
  return shortCars.map((c) => {
    const defs = CAR_DEFAULTS[c.id] || { name: `Car ${c.id}`, color: "var(--car-slate)", len: 2 };
    return {
      ...c,
      name: defs.name,
      color: defs.color,
      len: defs.len,
    };
  });
}

const INITIAL_FALLBACK = [
  {
    par: 9,
    cars: inflateCars([
      { id: "X", row: 2, col: 0, dir: "h" },
      { id: "A", row: 0, col: 4, dir: "h" },
      { id: "O", row: 0, col: 2, dir: "v" },
      { id: "Q", row: 3, col: 5, dir: "v" },
      { id: "P", row: 3, col: 0, dir: "h" },
    ]),
  },
];

export let DEFAULT_PUZZLES: { par: number; cars: Car[] }[] = INITIAL_FALLBACK;

export interface PuzzleRaw {
  par: number;
  cars: { id: string; row: number; col: number; dir: "h" | "v" }[];
}

function isValidPuzzle(p: unknown): p is PuzzleRaw {
  if (!p || typeof p !== "object") return false;
  const { par, cars } = p as PuzzleRaw;
  if (typeof par !== "number" || !Number.isFinite(par) || !Array.isArray(cars)) return false;
  if (!cars.some((c) => c?.id === "X")) return false;
  return cars.every(
    (c) =>
      !!c &&
      typeof c.id === "string" &&
      (c.dir === "h" || c.dir === "v") &&
      Number.isInteger(c.row) && c.row >= 0 && c.row <= 5 &&
      Number.isInteger(c.col) && c.col >= 0 && c.col <= 5,
  );
}

/** 
 * מחולל שלבים אקראיים בזמן אמת בעזרת ה-BFS. 
 * מציב מכוניות באופן אקראי ומאמת שהשלב פתיר ומאתגר (par >= minPar).
 */
export function generateRandomPuzzleOnTheFly(minPar: number = 7): { par: number; cars: Car[] } {
  const availableIds = Object.keys(CAR_DEFAULTS).filter((id) => id !== "X");

  while (true) {
    const cars: Car[] = [];
    const occupied = new Set<string>();

    const canPlace = (r: number, c: number, len: number, dir: Dir) => {
      if (dir === "h" && c + len > 6) return false;
      if (dir === "v" && r + len > 6) return false;
      if (dir === "h" && r === 2) return false; // מונע חסימה רוחבית ישירה בשורת היציאה
      for (let i = 0; i < len; i++) {
        const key = dir === "h" ? `${r},${c + i}` : `${r + i},${c}`;
        if (occupied.has(key)) return false;
      }
      return true;
    };

    const place = (cid: string, r: number, c: number, dir: Dir, len: 2 | 3) => {
      const defs = CAR_DEFAULTS[cid] || { name: `Car ${cid}`, color: "var(--car-slate)", len };
      cars.push({ id: cid, name: defs.name, color: defs.color, row: r, col: c, len: defs.len, dir });
      for (let i = 0; i < len; i++) {
        occupied.add(dir === "h" ? `${r},${c + i}` : `${r + i},${c}`);
      }
    };

    // 1. המכונית האדומה X בשורה 2
    const xCol = Math.floor(Math.random() * 3);
    place("X", 2, xCol, "h", 2);

    // 2. הגרלת 6-9 מכוניות נוספות
    const shuffled = [...availableIds].sort(() => Math.random() - 0.5);
    const numCars = Math.floor(Math.random() * 4) + 6;

    for (let i = 0; i < Math.min(numCars, shuffled.length); i++) {
      const cid = shuffled[i]!;
      const len = CAR_DEFAULTS[cid]?.len ?? 2;
      for (let attempt = 0; attempt < 25; attempt++) {
        const dir: Dir = Math.random() > 0.5 ? "h" : "v";
        const r = Math.floor(Math.random() * 6);
        const c = Math.floor(Math.random() * 6);
        if (canPlace(r, c, len, dir)) {
          place(cid, r, c, dir, len);
          break;
        }
      }
    }

    // 3. אימות בעזרת ה-BFS
    const par = minSolution(cars);
    if (par >= minPar) {
      return { par, cars };
    }
  }
}

export async function loadPuzzlesAsync(): Promise<{ par: number; cars: Car[] }[]> {
  try {
    const PUZZLES_URL = "https://raw.githubusercontent.com/odd-329083646/rush-hour-escape-lab/refs/heads/main/public/puzzles.json";
    
    const response = await fetch(`${PUZZLES_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load external puzzles (${response.status})`);
    
    const data: unknown = await response.json();
    const raw = Array.isArray(data) ? data : (data as { puzzles?: unknown[] })?.puzzles;
    const loadedPuzzles = (Array.isArray(raw) ? raw : [])
      .filter(isValidPuzzle)
      .map((p) => ({ par: p.par, cars: inflateCars(p.cars) }))
      .sort((a, b) => a.par - b.par);

    if (!loadedPuzzles.length) throw new Error("No valid puzzles in puzzles.json");

    console.log(`Loaded ${loadedPuzzles.length} puzzles successfully from GitHub!`);
    IS_OFFLINE_MODE = false;
    DEFAULT_PUZZLES = loadedPuzzles;
    return loadedPuzzles;
  } catch (err) {
    console.warn("Could not load puzzles.json from network. Switching to offline generator mode:", err);
    IS_OFFLINE_MODE = true;

    // במידה ואין אינטרנט, ייצור 5 שלבים אקראיים בזמן אמת במקום להיכשל
    const offlinePuzzles = Array.from({ length: 5 }, () => generateRandomPuzzleOnTheFly(6));
    DEFAULT_PUZZLES = offlinePuzzles;
    return offlinePuzzles;
  }
}

export const LEVELS: Record<Level, { title: string; he: string }> = {
  easy: { title: "Easy", he: "קל" },
  medium: { title: "Medium", he: "בינוני" },
  hard: { title: "Hard", he: "קשה" },
  murderer: { title: "Murderer", he: "רוצח" },
};

export function runPlan(cars: Car[], plan: { id: string; move: Move; steps: number }[]): { cars: Car[]; failedAt?: number; error?: string } {
  let cur = cars;
  for (let i = 0; i < plan.length; i++) {
    const r = applyMove(cur, plan[i]!.id, plan[i]!.move, plan[i]!.steps);
    if (r.error) return { cars: cur, failedAt: i, error: r.error };
    cur = r.cars;
  }
  return { cars: cur };
}

export function getRandomPuzzle(rand: () => number = Math.random): { par: number; cars: Car[] } {
  // אם במצב אופליין - מייצר שלב חדש לגמרי בכל פעם שמבקשים
  if (IS_OFFLINE_MODE) {
    return generateRandomPuzzleOnTheFly(7);
  }
  const index = Math.floor(rand() * DEFAULT_PUZZLES.length);
  return DEFAULT_PUZZLES[index]!;
}

export function cells(c: Car): [number, number][] {
  return Array.from({ length: c.len }, (_, i) => (c.dir === "h" ? [c.row, c.col + i] : [c.row + i, c.col]));
}

export function isSolved(cars: Car[]): boolean {
  const x = cars.find((c) => c.id === "X");
  return !!x && x.row === 2 && x.col + x.len - 1 >= 5;
}

export function applyMove(cars: Car[], id: string, move: Move, steps: number): { cars: Car[]; error?: string } {
  const car = cars.find((c) => c.id === id);
  if (!car) return { cars, error: "Select a car first" };
  const horiz = move === "left" || move === "right";
  if ((car.dir === "h") !== horiz) return { cars, error: "This car can't move that way" };
  const d = move === "right" || move === "down" ? 1 : -1;
  const occ = new Set(cars.filter((c) => c.id !== id).flatMap(cells).map(([r, c]) => `${r},${c}`));
  let { row, col } = car;

  for (let s = 0; s < steps; s++) {
    const nr = horiz ? row : d > 0 ? row + car.len : row - 1;
    const nc = horiz ? (d > 0 ? col + car.len : col - 1) : col;

    if (id === "X" && row === 2 && move === "right") {
      if (occ.has(`${row},${nc}`)) return { cars, error: "Blocked by another car" };
      col += 1;
      if (col + car.len - 1 >= 5) {
        col = 6 - car.len;
        break;
      }
      continue;
    }

    if (nr < 0 || nr > 5 || nc < 0 || nc > 5) return { cars, error: "Can't leave the parking lot" };
    if (occ.has(`${nr},${nc}`)) return { cars, error: "Blocked by another car" };
    if (horiz) col += d; else row += d;
  }

  return { cars: cars.map((c) => (c.id === id ? { ...c, row, col } : c)) };
}

/** Breadth-first search; returns the minimum number of slides to solve, or -1. */
export function minSolution(start: Car[]): number {
  const key = (cs: Car[]) => cs.map((c) => `${c.row}${c.col}`).join("");
  const seen = new Set([key(start)]);
  let frontier = [start];
  for (let depth = 0; frontier.length; depth++) {
    const next: Car[][] = [];
    for (const st of frontier) {
      if (isSolved(st)) return depth;
      for (const c of st) {
        const dirs: Move[] = c.dir === "h" ? ["left", "right"] : ["up", "down"];
        for (const m of dirs) for (let s = 1; s <= 4; s++) {
          const r = applyMove(st, c.id, m, s);
          if (r.error) break;
          const k = key(r.cars);
          if (!seen.has(k)) { seen.add(k); next.push(r.cars); }
        }
      }
    }
    frontier = next;
  }
  return -1;
}

export function pickHidden(cars: Car[], level: Level, rand: () => number = Math.random): Set<string> {
  if (level === "easy") return new Set();
  if (level === "hard" || level === "murderer") return new Set(cars.map((c) => c.id));
  const pool = cars.filter((c) => c.id !== "X").map((c) => c.id).sort(() => rand() - 0.5);
  return new Set(pool.slice(0, Math.ceil(pool.length / 2)));
}

/** Today's date as YYYY-MM-DD in the player's local time zone. */
export function todayKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Loads the daily puzzle for a date from /daily_puzzles.json; random fallback on any error. */
export async function getDailyPuzzleAsync(dateStr?: string): Promise<{ par: number; cars: Car[] }> {
  const key = dateStr ?? todayKey();
  try {
    const res = await fetch(`/daily_puzzles.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`daily_puzzles.json ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    const p = data?.[key];
    if (!isValidPuzzle(p)) throw new Error(`No valid daily puzzle for ${key}`);
    return { par: p.par, cars: inflateCars(p.cars) };
  } catch (err) {
    console.warn("Daily puzzle unavailable, generating one:", err);
    return generateRandomPuzzleOnTheFly(10);
  }
}

// ==========================================
// ניהול כוכבים, התקדמות ומטבעות
// ==========================================

export interface LevelStats {
  stars: number; // 1, 2 או 3 כוכבים
  bestTime: number; // זמן בשניות
  bestMoves: number; // מספר מהלכים הכי טוב
}

/**
 * מחשב כמה כוכבים מגיעים לשחקן לפי מספר המהלכים וההתנגשויות
 */
export function calculateStars(moves: number, par: number, bumps: number = 0): number {
  if (bumps > 0) {
    // כל התנגשות מורידה כוכב
    if (bumps >= 2) return 1;
    if (moves <= par + 2) return 2;
    return 1;
  }
  if (moves <= par) return 3; // פתרון במינימום מהלכים = 3 כוכבים
  if (moves <= par + 3) return 2; // סטייה קלה = 2 כוכבים
  return 1;
}

/**
 * טוען את נתוני ההתקדמות (כוכבים וזמנים) לרמה מסוימת מ-localStorage
 */
export function getSavedProgress(levelKey: string): Record<number, LevelStats> {
  try {
    const raw = localStorage.getItem(`rush_hour_progress_${levelKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * שומר את תוצאת השלב, מעדכן שיאים ומעניק מטבעות
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

  // מעדכנים אם זו פעם ראשונה או שהתוצאה טובה יותר
  const newStars = Math.max(stars, prev?.stars ?? 0);
  const newBestTime = prev ? Math.min(timeInSeconds, prev.bestTime) : timeInSeconds;
  const newBestMoves = prev ? Math.min(moves, prev.bestMoves) : moves;

  current[puzzleIdx] = {
    stars: newStars,
    bestTime: newBestTime,
    bestMoves: newBestMoves,
  };

  localStorage.setItem(`rush_hour_progress_${levelKey}`, JSON.stringify(current));

  // חישוב מטבעות: 10 מטבעות לכל כוכב
  const coinsEarned = stars * 10;
  addCoins(coinsEarned);

  return { stars, coinsEarned };
}

/**
 * משיג את כמות המטבעות הנוכחית של השחקן
 */
export function getCoins(): number {
  return parseInt(localStorage.getItem("rush_hour_coins") ?? "0", 10) || 0;
}

/**
 * מוסיף (או מוריד) מטבעות למאזן המשתמש
 */
export function addCoins(amount: number): number {
  const newBalance = Math.max(0, getCoins() + amount);
  localStorage.setItem("rush_hour_coins", String(newBalance));
  return newBalance;
}

// ==========================================
// מנוע רמזים (Hint Engine - BFS)
// ==========================================

export interface HintResult {
  id: string;
  move: Move;
  steps: number;
}

/**
 * מוצא את המהלך הבא הטוב ביותר מהמצב הנוכחי של הלוח בעזרת BFS
 */
export function getNextBestMove(startCars: Car[]): HintResult | null {
  if (isSolved(startCars)) return null;

  const key = (cs: Car[]) => cs.map((c) => `${c.row}${c.col}`).join("");
  const seen = new Set([key(startCars)]);

  type QueueItem = {
    cars: Car[];
    firstMove: HintResult | null;
  };

  let frontier: QueueItem[] = [{ cars: startCars, firstMove: null }];

  while (frontier.length > 0) {
    const next: QueueItem[] = [];
    for (const item of frontier) {
      for (const c of item.cars) {
        const dirs: Move[] = c.dir === "h" ? ["left", "right"] : ["up", "down"];
        for (const m of dirs) {
          for (let s = 1; s <= 4; s++) {
            const r = applyMove(item.cars, c.id, m, s);
            if (r.error) break;

            const k = key(r.cars);
            if (!seen.has(k)) {
              seen.add(k);
              const moveTaken = item.firstMove ?? { id: c.id, move: m, steps: s };
              if (isSolved(r.cars)) {
                return moveTaken;
              }
              next.push({ cars: r.cars, firstMove: moveTaken });
            }
          }
        }
      }
    }
    frontier = next;
  }

  return null;
}
