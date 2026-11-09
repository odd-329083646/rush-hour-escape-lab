/** Compatibility facade; rules, persistence and repositories have separate owners. */
export * from "@/engine/game";
export * from "@/engine/rewards";
export { loadPuzzlesAsync, getDailyPuzzleAsync } from "@/services/puzzleRepository";
