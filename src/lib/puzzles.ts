export type Dir = "h" | "v";
export type Level = "easy" | "medium" | "hard" | "murderer";
export type Move = "up" | "down" | "left" | "right";

export type Car = { id: string; name: string; color: string; row: number; col: number; len: 2 | 3; dir: Dir };
export type ShortCar = { id: string; row: number; col: number; dir: Dir };

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

// פונקציית עזר שמתרגמת את הרשימה המקוצרת לרשימה מלאה עבור המשחק
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

// שלב גיבוי ראשוני למקרה שהטעינה מהרשת תכשל
const INITIAL_FALLBACK = [
];

// מאגר השלבים שיתעדכן מטעינת הקובץ החיצוני
export let DEFAULT_PUZZLES: { par: number; cars: Car[] }[] = INITIAL_FALLBACK;

export interface PuzzleRaw {
  par: number;
  cars: { id: string; row: number; col: number; dir: "h" | "v" }[];
}

/** מחזיר true רק לשלב תקין: par מספרי, מכונית X קיימת וכל המכוניות בתוך הלוח */
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
 * טוען את השלבים מ-‎/puzzles.json‎ (קובץ סטטי בתיקיית public).
 * אפשר לערוך את הקובץ בכל עת — רענון הדף יטען את השלבים החדשים.
 * אם הקובץ חסר, פגום או ריק — משתמשים ברשימת הגיבוי המקומית.
 */
export async function loadPuzzlesAsync(): Promise<{ par: number; cars: Car[] }[]> {
  try {
    const response = await fetch("/puzzles.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load external puzzles (${response.status})`);
    const data: unknown = await response.json();

    const raw = Array.isArray(data) ? data : (data as { puzzles?: unknown[] })?.puzzles;
    // כאן הוסרה פונקציית ה-sort כדי לשמור על הסדר המקורי מהקובץ
    const loadedPuzzles = (Array.isArray(raw) ? raw : [])
      .filter(isValidPuzzle)
      .map((p) => ({ par: p.par, cars: inflateCars(p.cars) }));

    if (!loadedPuzzles.length) throw new Error("No valid puzzles in puzzles.json");

    console.log(`Loaded ${loadedPuzzles.length} puzzles successfully!`);
    DEFAULT_PUZZLES = loadedPuzzles;
    return loadedPuzzles;
  } catch (err) {
    console.error("Could not load puzzles.json, using fallback:", err);
    return INITIAL_FALLBACK;
  }
}

export const LEVELS: Record<Level, { title: string; he: string; par: number; cars: Car[] }> = {
  easy: { title: "Easy", he: "קל", par: DEFAULT_PUZZLES[0]!.par, cars: DEFAULT_PUZZLES[0]!.cars },
  medium: { title: "Medium", he: "בינוני", par: DEFAULT_PUZZLES[0]!.par, cars: DEFAULT_PUZZLES[0]!.cars },
  hard: { title: "Hard", he: "קשה", par: DEFAULT_PUZZLES[0]!.par, cars: DEFAULT_PUZZLES[0]!.cars },
  murderer: { title: "Murderer", he: "רוצח", par: DEFAULT_PUZZLES[0]!.par, cars: DEFAULT_PUZZLES[0]!.cars },
};

/** Applies a list of planned moves in order; stops at the first invalid one. */
export function runPlan(cars: Car[], plan: { id: string; move: Move; steps: number }[]): { cars: Car[]; failedAt?: number; error?: string } {
  let cur = cars;
  for (let i = 0; i < plan.length; i++) {
    const r = applyMove(cur, plan[i]!.id, plan[i]!.move, plan[i]!.steps);
    if (r.error) return { cars: cur, failedAt: i, error: r.error };
    cur = r.cars;
  }
  return { cars: cur };
}

/** פונקציה ששולפת שלב אקראי (כולל המכוניות וה-par שלו) מתוך המאגר */
export function getRandomPuzzle(rand: () => number = Math.random): { par: number; cars: Car[] } {
  const index = Math.floor(rand() * DEFAULT_PUZZLES.length);
  return DEFAULT_PUZZLES[index]!;
}

export function cells(c: Car): [number, number][] {
  return Array.from({ length: c.len }, (_, i) => (c.dir === "h" ? [c.row, c.col + i] : [c.row + i, c.col]));
}

/** Solved when the red car's front bumper reaches or passes the exit cell (row 2, col 5). */
export function isSolved(cars: Car[]): boolean {
  const x = cars.find((c) => c.id === "X");
  return !!x && x.row === 2 && x.col + x.len - 1 >= 5;
}

/** Moves a car exactly `steps` cells; never through other cars or off the grid. */
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
    const nc = horiz ? (d > 0 ? col + car.
