import { describe, expect, it } from "vitest";
import { getPanelsVisible, setPanelsVisible } from "./storageService";

const setWide = (wide: boolean) => Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: () => ({ matches: wide, addEventListener() {}, removeEventListener() {} }) });

describe("control panels setting", () => {
  it("defaults to hidden on narrow screens", () => { localStorage.clear(); setWide(false); expect(getPanelsVisible()).toBe(false); });
  it("defaults to visible on wide screens", () => { localStorage.clear(); setWide(true); expect(getPanelsVisible()).toBe(true); });
  it("saved choice overrides the screen default", () => { setWide(true); setPanelsVisible(false); expect(getPanelsVisible()).toBe(false); });
});
