import { describe, expect, it } from "vitest";
import { commitWalletDelta, saveGuestCredential, walletDelta } from "./tournament-device";
import { addCoins } from "./rewards";

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe("cloud coin delta", () => {
  it("is not resent after a successful sync", () => {
    const s = mem();
    saveGuestCredential({ guestId: "g", token: "t" } as never, s);
    addCoins(90, s);
    expect(walletDelta(s)).toBe(90);
    commitWalletDelta(90, s);
    expect(walletDelta(s)).toBe(0);
    addCoins(-50, s);
    expect(walletDelta(s)).toBe(-50);
  });
});
