// src/services/storageService.ts
/** Device DAL: synchronous persistence with immediate memory cache. */
const cache = new Map<string, string | null>();
const listeners = new Set<() => void>();

function writeToDevice(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    /* Fallback to cookie if localStorage throws (e.g., strict private mode) */
    try {
      if (value === null) {
        document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
      } else {
        document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {
      /* Keep in-memory value only */
    }
  }
}

function readFromDevice(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const val = window.localStorage.getItem(key);
    if (val !== null) return val;
  } catch {
    /* Try cookie fallback */
  }
  try {
    const prefix = `${encodeURIComponent(key)}=`;
    const match = document.cookie.split("; ").find((row) => row.startsWith(prefix));
    if (match) return decodeURIComponent(match.slice(prefix.length));
  } catch {
    /* Ignore */
  }
  return null;
}

export const storageService = {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    if (cache.has(key)) return cache.get(key) ?? null;
    const value = readFromDevice(key);
    cache.set(key, value);
    return value;
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    cache.set(key, value);
    writeToDevice(key, value);
    listeners.forEach((listener) => listener());
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    cache.set(key, null);
    writeToDevice(key, null);
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  flush() {
    /* Kept for backward compatibility; writes are now immediate. */
  },
  resetCache() {
    cache.clear();
  },
};

export function initializeStorage() {
  if (typeof window === "undefined") return;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && !cache.has(key)) cache.set(key, window.localStorage.getItem(key));
    }
  } catch {
    /* Device storage may be unavailable. */
  }

  window.addEventListener("storage", (event) => {
    if (event.key) cache.set(event.key, event.newValue);
    else cache.clear();
    listeners.forEach((listener) => listener());
  });
}

export type ControlSetting = "dragEnabled" | "keyboardEnabled";

export function getControlSetting(key: ControlSetting): boolean {
  return storageService.getItem(key) !== "false";
}

export function getPanelsVisible(): boolean {
  const saved = storageService.getItem("panelsVisible");
  if (saved === "true" || saved === "false") return saved === "true";
  return false;
}

export function setPanelsVisible(visible: boolean) {
  storageService.setItem("panelsVisible", String(visible));
}

export function setControlSetting(key: ControlSetting, enabled: boolean) {
  storageService.setItem(key, String(enabled));
}