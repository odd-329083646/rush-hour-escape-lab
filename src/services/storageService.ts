/** Device DAL: immediate memory updates, coalesced persistence after the current frame. */
const cache = new Map<string, string | null>();
const pending = new Map<string, string | null>();
const listeners = new Set<() => void>();
let scheduled = false;

function flush() {
  scheduled = false;
  if (typeof window === "undefined") return;
  for (const [key, value] of pending) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
      pending.delete(key);
    } catch {
      /* Keep the in-memory value; retry on the next write. */
    }
  }
}
function schedule() {
  if (scheduled || typeof window === "undefined") return;
  scheduled = true;
  window.setTimeout(flush, 0);
}
export const storageService = {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    if (cache.has(key)) return cache.get(key) ?? null;
    // One cold read preserves legacy device data; all gameplay reads use memory.
    try {
      const value = window.localStorage.getItem(key);
      cache.set(key, value);
      return value;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    cache.set(key, value);
    pending.set(key, value);
    schedule();
    listeners.forEach((listener) => listener());
  },
  removeItem(key: string) {
    cache.set(key, null);
    pending.set(key, null);
    schedule();
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  flush,
  resetCache() {
    cache.clear();
    pending.clear();
    scheduled = false;
  },
};

export function initializeStorage() {
  if (typeof window === "undefined") return;
  const hydrate = () => {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && !cache.has(key)) cache.set(key, window.localStorage.getItem(key));
      }
    } catch {
      /* Device storage may be unavailable. */
    }
  };
  window.setTimeout(hydrate, 0);
  window.addEventListener("pagehide", flush);
  window.addEventListener("storage", (event) => {
    if (event.key && !pending.has(event.key)) cache.set(event.key, event.newValue);
    else if (!event.key) cache.clear();
    listeners.forEach((listener) => listener());
  });
}
export type ControlSetting = "dragEnabled" | "keyboardEnabled";

/** Missing or invalid device settings retain the ON default. */
export function getControlSetting(key: ControlSetting): boolean {
  return storageService.getItem(key) !== "false";
}
/** Unset panel preference defaults to visible on wide screens and hidden on narrow ones. */
export function getPanelsVisible(): boolean {
  const saved = storageService.getItem("panelsVisible");
  if (saved === "true" || saved === "false") return saved === "true";
  return (
    typeof window === "undefined" || window.matchMedia?.("(min-width: 768px)").matches !== false
  );
}
export function setPanelsVisible(visible: boolean) {
  storageService.setItem("panelsVisible", String(visible));
}
export function setControlSetting(key: ControlSetting, enabled: boolean) {
  storageService.setItem(key, String(enabled));
}
