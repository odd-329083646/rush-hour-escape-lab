import type { Car, HintResult } from "@/engine/game";

/** Expensive BFS runs on a separate worker, never during a pointer event. */
function analyze<T>(request: { kind: "generate" | "hint"; cars?: Car[]; minPar?: number }): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof Worker === "undefined") { reject(new Error("Worker unavailable")); return; }
    const worker = new Worker(new URL("../engine/puzzle.worker.ts", import.meta.url), { type: "module" });
    const timeout = setTimeout(() => { worker.terminate(); reject(new Error("Analysis timed out")); }, 60000);
    const close = () => { clearTimeout(timeout); worker.terminate(); };
    worker.onmessage = (event: MessageEvent<{ result: T; error?: string }>) => {
      close(); if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.result);
    };
    worker.onerror = () => { close(); reject(new Error("Analysis unavailable")); };
    worker.postMessage({ ...request, id: 1 });
  });
}
export const generatePuzzle = (minPar = 7) => analyze<{ par: number; cars: Car[] }>({ kind: "generate", minPar });
export const findNextMove = (cars: Car[]) => analyze<HintResult | null>({ kind: "hint", cars });