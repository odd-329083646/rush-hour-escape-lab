import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SoundToggle } from "./sound-toggle";

const engine = vi.hoisted(() => ({
  isMuted: vi.fn(),
  setMuted: vi.fn(),
  startMusic: vi.fn(),
  stopMusic: vi.fn(),
}));

vi.mock("@/audio/soundEngine", () => ({ soundEngine: engine }));

beforeEach(() => {
  vi.clearAllMocks();
  engine.isMuted.mockReturnValue(false);
});

afterEach(cleanup);

it("mutes and unmutes sound and music with an accessible pressed state", () => {
  render(<SoundToggle />);
  const toggle = screen.getByRole("button", { name: "Sound and music" });

  expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(toggle).toHaveAttribute("title", "Mute sound and music");

  fireEvent.click(toggle);
  expect(engine.setMuted).toHaveBeenLastCalledWith(true);
  expect(engine.stopMusic).toHaveBeenCalled();
  expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(toggle).toHaveAttribute("title", "Turn on sound and music");

  fireEvent.click(toggle);
  expect(engine.setMuted).toHaveBeenLastCalledWith(false);
  expect(engine.startMusic).toHaveBeenCalledTimes(1);
  expect(toggle).toHaveAttribute("aria-pressed", "true");
});
