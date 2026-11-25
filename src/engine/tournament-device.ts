// src/engine/tournament-device.ts
import type { StoragePort } from "./contracts";
import { addCoins, getCoins } from "./rewards";
import type { GuestCredential, RaceSnapshot } from "@/engine/tournament";

const KEY = "rush_hour_guest_capability";
const BASELINE = "rush_hour_tournament_balance";

const fallbackStorage: StoragePort = {
  getItem: () => null,
  setItem: () => {},
};

export function getGuestCredential(storage: StoragePort = fallbackStorage): GuestCredential | null {
  try {
    const raw = storage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGuestCredential(
  guest: GuestCredential,
  storage: StoragePort = fallbackStorage,
) {
  storage.setItem(KEY, JSON.stringify(guest));
  storage.setItem(BASELINE, String(getCoins(storage)));
}

export function walletDelta(storage: StoragePort = fallbackStorage): number {
  const current = getCoins(storage);
  return current - Number(storage.getItem(BASELINE) ?? current);
}

/** Advance the baseline by a delta the cloud accepted, so it is never resent. */
export function commitWalletDelta(sent: number, storage: StoragePort = fallbackStorage) {
  if (!sent) return;
  const base = Number(storage.getItem(BASELINE) ?? getCoins(storage) - sent);
  storage.setItem(BASELINE, String(base + sent));
}

export function applyTournamentSnapshot(
  snapshot: RaceSnapshot,
  balanceAtRequest: number,
  storage: StoragePort = fallbackStorage,
) {
  if (!snapshot.guest) return;
  const current = getCoins(storage);
  const balance = snapshot.guest.coins + current - balanceAtRequest;
  addCoins(balance - current, storage);
  storage.setItem(BASELINE, String(snapshot.guest.coins));
  storage.setItem(
    "rush_hour_tournament_stats",
    JSON.stringify({ wins: snapshot.guest.wins, losses: snapshot.guest.losses }),
  );
}

export function tournamentStats(storage: StoragePort = fallbackStorage): {
  wins: number;
  losses: number;
} {
  try {
    return JSON.parse(storage.getItem("rush_hour_tournament_stats") ?? '{"wins":0,"losses":0}');
  } catch {
    return { wins: 0, losses: 0 };
  }
}