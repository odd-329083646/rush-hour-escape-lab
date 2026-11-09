import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Tutorial } from "./tutorial";
import { getCoins } from "@/lib/puzzles";
import { getLang, setLang } from "@/lib/i18n";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

afterEach(() => { cleanup(); localStorage.clear(); setLang("en"); });

function chooseEnglish() {
  render(<Tutorial />);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
}
function move(id: string, direction: string, steps: number) {
  fireEvent.keyDown(window, { key: id.toLowerCase(), code: `Key${id}` });
  fireEvent.keyDown(window, { key: String(steps) });
  fireEvent.keyDown(window, { key: `Arrow${direction}` });
  fireEvent.keyDown(window, { key: "Enter" });
}

it("persists Hebrew globally before the first lesson", () => {
  render(<Tutorial />);
  fireEvent.click(screen.getByRole("button", { name: "עברית" }));
  expect(getLang()).toBe("he");
  expect(localStorage.getItem("rush_hour_lang")).toBe("he");
  expect(document.documentElement.dir).toBe("ltr");
});

it("moves through keyboard selection, direction and Enter without moving on arrow alone", () => {
  chooseEnglish();
  const car = document.querySelector<HTMLButtonElement>(".board .car");
  fireEvent.keyDown(window, { key: "x", code: "KeyX" });
  fireEvent.keyDown(window, { key: "4" });
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(car?.style.gridColumn).toBe("1 / span 2");
  fireEvent.keyDown(window, { key: "Enter" });
  expect(car?.style.gridColumn).toBe("5 / span 2");
});

it("preserves hidden obstacles and queues plans without moving until submission, awarding 50 coins once", () => {
  localStorage.setItem("rush_hour_coins", "0");
  chooseEnglish();
  move("X", "Right", 4);
  fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
  move("O", "Down", 3);
  move("X", "Right", 4);
  fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
  fireEvent.click(screen.getByRole("button", { name: "Start puzzle" }));
  move("X", "Right", 4);
  expect(screen.getByRole("alert")).toHaveTextContent("Blocked by another car");
  move("A", "Down", 2);
  move("X", "Right", 4);
  fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
  move("O", "Down", 3);
  move("X", "Right", 4);
  const redCar = document.querySelector<HTMLButtonElement>(".board .car");
  expect(redCar?.style.gridColumn).toBe("1 / span 2");
  fireEvent.click(screen.getByRole("button", { name: "Execute" }));
  expect(redCar?.style.gridColumn).toBe("5 / span 2");
  fireEvent.click(screen.getByRole("button", { name: "Tutorial complete!" }));
  expect(getCoins()).toBe(50);
});