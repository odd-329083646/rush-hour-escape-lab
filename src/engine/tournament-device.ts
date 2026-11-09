import { storageService } from "@/services/storageService";
import { addCoins, getCoins } from "@/lib/puzzles";
import type { GuestCredential, RaceSnapshot } from "@/engine/tournament";

const KEY = "rush_hour_guest_capability";
const BASELINE = "rush_hour_tournament_balance";
export function getGuestCredential(): GuestCredential | null {
  try { const raw = storageService.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveGuestCredential(guest: GuestCredential) {
  storageService.setItem(KEY, JSON.stringify(guest));
  storageService.setItem(BASELINE, String(getCoins()));
}
export function walletDelta(): number { return getCoins() - Number(storageService.getItem(BASELINE) ?? getCoins()); }
export function applyTournamentSnapshot(snapshot: RaceSnapshot, balanceAtRequest: number) {
  if (!snapshot.guest) return;
  const balance = snapshot.guest.coins + getCoins() - balanceAtRequest;
  addCoins(balance - getCoins());
  storageService.setItem(BASELINE, String(snapshot.guest.coins));
  storageService.setItem("rush_hour_tournament_stats", JSON.stringify({ wins: snapshot.guest.wins, losses: snapshot.guest.losses }));
}
export function tournamentStats(): { wins: number; losses: number } {
  try { return JSON.parse(storageService.getItem("rush_hour_tournament_stats") ?? '{"wins":0,"losses":0}'); } catch { return { wins: 0, losses: 0 }; }
}