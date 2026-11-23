import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GameBoard } from "./game-board";

afterEach(cleanup);

it("announces an active board warning and removes it when the warning clears", () => {
  const { rerender } = render(
    <GameBoard cars={[]} warn={{ key: 1, text: "Blocked by another car" }} />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Blocked by another car");

  rerender(<GameBoard cars={[]} warn={null} />);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
