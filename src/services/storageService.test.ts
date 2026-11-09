import { expect, it, vi } from "vitest";
import { storageService } from "./storageService";

it("updates memory immediately and coalesces persistent writes in the background", () => {
  vi.useFakeTimers();
  const write = vi.spyOn(Storage.prototype, "setItem");
  storageService.setItem("layer_test", "1");
  storageService.setItem("layer_test", "2");
  expect(storageService.getItem("layer_test")).toBe("2");
  expect(write).not.toHaveBeenCalled();
  vi.runOnlyPendingTimers();
  expect(write).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem("layer_test")).toBe("2");
  write.mockRestore(); vi.useRealTimers(); localStorage.removeItem("layer_test");
});
it("reads existing device data once and then serves gameplay from memory", () => {
  localStorage.setItem("legacy_layer", "saved");
  const read = vi.spyOn(Storage.prototype, "getItem");
  expect(storageService.getItem("legacy_layer")).toBe("saved");
  expect(storageService.getItem("legacy_layer")).toBe("saved");
  expect(read).toHaveBeenCalledTimes(1);
  read.mockRestore(); localStorage.removeItem("legacy_layer");
});