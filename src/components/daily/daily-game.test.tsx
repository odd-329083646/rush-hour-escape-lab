import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DailyGame } from "./daily-game";

vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock("./daily-calendar", () => ({ DailyCalendar: () => null }));
vi.mock("@/lib/puzzles", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/puzzles")>(),
  getDailyPuzzleAsync: vi.fn().mockResolvedValue({ par: 2, cars: [
    { id: "X", name: "Red Racer", color: "var(--car-red)", row: 2, col: 0, len: 2, dir: "h" },
    { id: "A", name: "Green Car", color: "var(--car-green)", row: 0, col: 0, len: 2, dir: "h" },
    { id: "Q", name: "Blue Truck", color: "var(--car-blue)", row: 3, col: 5, len: 3, dir: "v" },
  ] }),
  pickHidden: () => new Set(),
}));

afterEach(cleanup);

async function startGame() {
  render(<DailyGame date="2026-11-07" />);
  const start = screen.getByRole("button", { name: /Start Solving/ });
  await waitFor(() => expect(start).toBeEnabled());
  fireEvent.click(start);
}

describe("Daily gameplay controls", () => {
  it("requires starting before keyboard moves", async () => {
    render(<DailyGame date="2026-11-07" />);
    await screen.findByRole("button", { name: "Red Racer" });
    fireEvent.keyDown(window, { key: "x", code: "KeyX" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByRole("button", { name: "Red Racer" }).style.gridColumn).toBe("1 / span 2");
  });

  it.each([1, 2, 3, 4])("uses letter selection, %i steps, direction and Enter without moving on arrow alone", async (steps) => {
    await startGame();
    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    fireEvent.keyDown(window, { key: String(steps) });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    const car = screen.getByRole("button", { name: "Green Car" });
    expect(car.style.gridColumn).toBe("1 / span 2");
    fireEvent.keyDown(window, { key: "Enter" });
    expect(car.style.gridColumn).toBe(`${steps + 1} / span 2`);
  });

  it("executes an arrow move for a car selected from the palette", async () => {
    await startGame();
    fireEvent.click(screen.getByRole("button", { name: "Select A · Green Car" }));
    fireEvent.click(screen.getByRole("button", { name: "right" }));
    expect(screen.getByRole("button", { name: "Green Car" }).style.gridColumn).toBe("2 / span 2");
  });
});