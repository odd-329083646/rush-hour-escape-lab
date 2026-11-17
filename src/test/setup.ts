import { beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

const store = new Map<string, string>();

Object.defineProperties(Storage.prototype, {
  length: {
    get() {
      return store.size;
    },
    configurable: true,
  },
  clear: {
    value() {
      store.clear();
    },
    writable: true,
    configurable: true,
  },
  getItem: {
    value(key: string) {
      return store.get(key) ?? null;
    },
    writable: true,
    configurable: true,
  },
  key: {
    value(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    writable: true,
    configurable: true,
  },
  removeItem: {
    value(key: string) {
      store.delete(key);
    },
    writable: true,
    configurable: true,
  },
  setItem: {
    value(key: string, value: string) {
      store.set(key, String(value));
    },
    writable: true,
    configurable: true,
  },
});

const localStorageMock: Storage = Object.create(Storage.prototype);

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

import { storageService } from "@/services/storageService";

beforeEach(() => storageService.resetCache());
afterEach(() => storageService.flush());

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});