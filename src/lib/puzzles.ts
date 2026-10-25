export type Dir = "h" | "v";
export type Car = { id: string; name: string; color: string; row: number; col: number; len: 2 | 3; dir: Dir };
export type Level = "beginner" | "advanced" | "champions";
export type Move = "up" | "down" | "left" | "right";

export const LEVELS: Record<Level, { title: string; he: string; cars: Car[] }> = {
  beginner: {
    title: "Beginner",
    he: "מתחילים",
    cars: [
      { id: "X", name: "Red Racer", color: "var(--car-red)", row: 2, col: 1, len: 2, dir: "h" },
      { id: "A", name: "Blue Truck", color: "var(--car-blue)", row: 0, col: 3, len: 3, dir: "v" },
      { id: "B", name: "Green Coupe", color: "var(--car-green)", row: 4, col: 2, len: 2, dir: "h" },
      { id: "C", name: "Yellow Cab", color: "var(--car-yellow)", row: 3, col: 5, len: 2, dir: "v" },
    ],
  },
  advanced: {
    title: "Advanced",
    he: "מתקדמים",
    cars: [
      { id: "X", name: "Red Racer", color: "var(--car-red)", row: 2, col: 0, len: 2, dir: "h" },
      { id: "A", name: "Blue Truck", color: "var(--car-blue)", row: 0, col: 2, len: 3, dir: "v" },
      { id: "B", name: "Orange Van", color: "var(--car-orange)", row: 1, col: 4, len: 3, dir: "v" },
      { id: "C", name: "Green Coupe", color: "var(--car-green)", row: 0, col: 4, len: 2, dir: "h" },
      { id: "D", name: "Yellow Cab", color: "var(--car-yellow)", row: 4, col: 0, len: 3, dir: "h" },
      { id: "E", name: "Teal Mini", color: "var(--car-teal)", row: 3, col: 5, len: 2, dir: "v" },
      { id: "F", name: "Pink Bug", color: "var(--car-pink)", row: 5, col: 3, len: 2, dir: "h" },
    ],
  },
  champions: {
    title: "Champions",
    he: "אלופים",
    cars: [
      { id: "X", name: "Red Racer", color: "var(--car-red)", row: 2, col: 1, len: 2, dir: "h" },
      { id: "A", name: "Blue Truck", color: "var(--car-blue)", row: 0, col: 0, len: 3, dir: "v" },
      { id: "B", name: "Orange Van", color: "var(--car-orange)", row: 1, col: 3, len: 3, dir: "v" },
      { id: "C", name: "Green Coupe", color: "var(--car-green)", row: 0, col: 1, len: 2, dir: "h" },
      { id: "D", name: "Yellow Cab", color: "var(--car-yellow)", row: 4, col: 2, len: 3, dir: "h" },
      { id: "E", name: "Teal Mini", color: "var(--car-teal)", row: 0, col: 5, len: 3, dir: "v" },
      { id: "F", name: "Pink Bug", color: "var(--car-pink)", row: 3, col: 4, len: 2, dir: "v" },
      { id: "G", name: "Slate Jeep", color: "var(--car-slate)", row: 5, col: 0, len: 2, dir: "h" },
      { id: "H", name: "Lime Kart", color: "var(--car-lime)", row: 3, col: 0, len: 2, dir: "h" },
    ],
  },
};

export function cells(c: Car): [number, number][] {
  return Array.from({ length: c.len }, (_, i) => (c.dir === "h" ? [c.row, c.col + i] : [c.row + i, c.col]));
}

/** Moves car exactly `steps`. Only the red car (X) may leave, through the right exit on row 2. */
export function applyMove(cars: Car[], id: string, move: Move, steps: number): { cars: Car[]; error?: string; vanished?: boolean } {
  const car = cars.find((c) => c.id === id);
  if (!car) return { cars, error: "Select a car first" };
  const horiz = move === "left" || move === "right";
  if ((car.dir === "h") !== horiz) return { cars, error: "This car can't move that way" };
  const d = move === "right" || move === "down" ? 1 : -1;
  const occ = new Set(cars.filter((c) => c.id !== id).flatMap(cells).map(([r, c]) => `${r},${c}`));
  let { row, col } = car;
  for (let s = 0; s < steps; s++) {
    const lead = d > 0 ? car.len : -1;
    const nr = horiz ? row : row + (d > 0 ? lead : -1);
    const nc = horiz ? col + (d > 0 ? lead : -1) : col;
    if (nr < 0 || nr > 5 || nc < 0 || nc > 5) {
      if (id === "X" && move === "right" && row === 2) return { cars: cars.filter((c) => c.id !== id), vanished: true };
      return { cars, error: "Can't leave the parking lot" };
    }
    if (occ.has(`${nr},${nc}`)) return { cars, error: "Blocked by another car" };
    if (horiz) col += d; else row += d;
  }
  return { cars: cars.map((c) => (c.id === id ? { ...c, row, col } : c)) };
}
