export type Dir = "h" | "v";
export type Car = { id: string; name: string; color: string; row: number; col: number; len: 2 | 3; dir: Dir };
export type Level = "beginner" | "advanced" | "champions";
export type Move = "up" | "down" | "left" | "right";

// מאגר משותף של כל השלבים המקוריים
export const DEFAULT_PUZZLES: Car[][] = [
  // שלב 1 (השלושה שהיו מקוריים)
  [
    { id: "X", name: "Red Racer", color: "var(--car-red)", row: 2, col: 1, len: 2, dir: "h" },
    { id: "A", name: "Blue Car", color: "var(--car-blue)", row: 0, col: 0, len: 2, dir: "h" },
    { id: "B", name: "Green Truck", color: "var(--car-green)", row: 0, col: 5, len: 3, dir: "v" },
    { id: "C", name: "Yellow Truck", color: "var(--car-yellow)", row: 1, col: 0, len: 3, dir: "v" },
    { id: "D", name: "Orange Truck", color: "var(--car-orange)", row: 1, col: 3, len: 3, dir: "v" },
    { id: "E", name: "Teal Car", color: "var(--car-teal)", row: 4, col: 0, len: 2, dir: "v" },
    { id: "F", name: "Pink Car", color: "var(--car-pink)", row: 4, col: 4, len: 2, dir: "h" },
    { id: "G", name: "Slate Truck", color: "var(--car-slate)", row: 5, col: 2, len: 3, dir: "h" },
  ],
  // שלב 2
  [
    { id: "X", name: "Red Racer", color: "var(--car-red)", row: 2, col: 0, len: 2, dir: "h" },
    { id: "A", name: "Blue Car", color: "var(--car-blue)", row: 0, col: 1, len: 2, dir: "h" },
    { id: "B", name: "Green Car", color: "var(--car-green)", row: 4, col: 4, len: 2, dir: "h" },
    { id: "C", name: "Yellow Truck", color: "var(--car-yellow)", row: 5, col: 3, len: 3, dir: "h" },
    { id: "D", name: "Orange Car", color: "var(--car-orange)", row: 0, col: 5, len: 2, dir: "v" },
    { id: "E", name: "Teal Car", color: "var(--car-teal)", row: 3, col: 1, len: 2, dir: "h" },
    { id: "F", name: "Pink Truck", color: "var(--car-pink)", row: 0, col: 3, len: 3, dir: "v" },
    { id: "G", name: "Slate Car", color: "var(--car-slate)", row: 4, col: 0, len: 2, dir: "v" },
    { id: "H", name: "Lime Car", color: "var(--car-lime)", row: 3, col: 3, len: 2, dir: "h" },
    { id: "I", name: "Brown Car", color: "var(--car-brown)", row: 0, col: 4, len: 2, dir: "v" },
    { id: "J", name: "Navy Car", color: "var(--car-navy)", row: 4, col: 2, len: 2, dir: "v" },
    { id: "K", name: "Sky Car", color: "var(--car-sky)", row: 0, col: 0, len: 2, dir: "v" },
  ],
  // שלב 3
  [
    { id: "X", name: "Red Racer", color: "var(--car-red)", row: 2, col: 1, len: 2, dir: "h" },
    { id: "A", name: "Blue Car", color: "var(--car-blue)", row: 0, col: 1, len: 2, dir: "v" },
    { id: "B", name: "Green Car", color: "var(--car-green)", row: 4, col: 3, len: 2, dir: "h" },
    { id: "C", name: "Yellow Car", color: "var(--car-yellow)", row: 0, col: 2, len: 2, dir: "h" },
    { id: "D", name: "Orange Car", color: "var(--car-orange)", row: 0, col: 4, len: 2, dir: "h" },
    { id: "E", name: "Teal Car", color: "var(--car-teal)", row: 4, col: 0, len: 2, dir: "v" },
    { id: "F", name: "Pink Truck", color: "var(--car-pink)", row: 3, col: 2, len: 3, dir: "v" },
    { id: "G", name: "Slate Car", color: "var(--car-slate)", row: 3, col: 0, len: 2, dir: "h" },
    { id: "H", name: "Lime Car", color: "var(--car-lime)", row: 5, col: 3, len: 2, dir: "h" },
    { id: "I", name: "Brown Truck", color: "var(--car-brown)", row: 1, col: 3, len: 3, dir: "v" },
    { id: "J", name: "Navy Truck", color: "var(--car-navy)", row: 2, col: 5, len: 3, dir: "v" },
  ],
];

export const LEVELS: Record<Level, { title: string; he: string; par: number; cars: Car[] }> = {
  beginner: {
    title: "Beginner",
    he: "מתחילים",
    par: 8,
    cars: DEFAULT_PUZZLES[0],
  },
  advanced: {
    title: "Advanced",
    he: "מתקדמים",
    par: 14,
    cars: DEFAULT_PUZZLES[0],
  },
  champions: {
    title: "Champions",
    he: "אלופים",
    par: 24,
    cars: DEFAULT_PUZZLES[0],
  },
};

/** פונקציה ששולפת שלב אקראי מתוך כלל השלבים במאגר */
export function getRandomPuzzleCars(rand: () => number = Math.random): Car[] {
  const index = Math.floor(rand() * DEFAULT_PUZZLES.length);
  return DEFAULT_PUZZLES[index];
}

export function cells(c: Car): [number, number][] {
  return Array.from({ length: c.len }, (_, i) => (c.dir === "h" ? [c.row, c.col + i] : [c.row + i, c.col]));
}

/** Solved when the red car's front bumper reaches the exit cell (row 2, col 5). */
export function isSolved(cars: Car[]): boolean {
  const x = cars.find((c) => c.id === "X");
  return !!x && x.row === 2 && x.col + x.len - 1 === 5;
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
    const nc = horiz ? (d > 0 ? col + car.len : col - 1) : col;
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

/** Beginner: none. Advanced: random half of the non-red cars. Champions: every car. */
export function pickHidden(cars: Car[], level: Level, rand: () => number = Math.random): Set<string> {
  if (level === "beginner") return new Set();
  if (level === "champions") return new Set(cars.map((c) => c.id));
  const pool = cars.filter((c) => c.id !== "X").map((c) => c.id).sort(() => rand() - 0.5);
  return new Set(pool.slice(0, Math.ceil(pool.length / 2)));
}
