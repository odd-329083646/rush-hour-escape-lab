import type { Car } from "./game";
import type { TKey } from "@/lib/i18n";
export type Lesson = { title: TKey; body: TKey; cars: Car[]; hidden?: string[]; plan?: boolean };
const X: Car = { id: "X", name: "Red Car", color: "var(--car-red)", row: 2, col: 0, len: 2, dir: "h" };
const O: Car = { id: "O", name: "Yellow Truck", color: "var(--car-yellow)", row: 0, col: 3, len: 3, dir: "v" };
const A: Car = { id: "A", name: "Blue Car", color: "var(--car-blue)", row: 2, col: 3, len: 2, dir: "v" };
const B: Car = { id: "B", name: "Lime Car", color: "var(--car-lime)", row: 5, col: 0, len: 2, dir: "h" };
export const LESSONS: Lesson[] = [
 { title: "tut1Title", body: "tut1Body", cars: [X] },
 { title: "tut2Title", body: "tut2Body", cars: [X, O, B] },
 { title: "tut3Title", body: "tut3Body", cars: [X, A, B], hidden: ["A"] },
 { title: "tut4Title", body: "tut4Body", cars: [X, O], plan: true },
];
