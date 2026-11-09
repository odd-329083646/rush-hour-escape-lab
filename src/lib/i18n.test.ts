import { afterEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { applyDocumentLang, getLang, setLang, translate, useI18n } from "./i18n";

afterEach(() => {
  setLang("en");
  localStorage.clear();
});

describe("text-only language switching", () => {
  it("selects and persists Hebrew without changing layout direction", () => {
    setLang("he");
    expect(getLang()).toBe("he");
    expect(document.documentElement.lang).toBe("he");
    expect(document.documentElement.dir).toBe("ltr");
    expect(translate(getLang(), "startSolving")).toBe("התחל פתירה");
    const { result } = renderHook(() => useI18n());
    expect(result.current.lang).toBe("he");
    expect(result.current.dir).toBe("ltr");
  });

  it("restores persisted Hebrew with LTR layout on reload", () => {
    localStorage.setItem("rush_hour_lang", "he");
    document.documentElement.dir = "rtl";
    applyDocumentLang();
    expect(document.documentElement.lang).toBe("he");
    expect(document.documentElement.dir).toBe("ltr");
  });
});