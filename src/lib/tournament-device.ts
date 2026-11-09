import { addCoins, getCoins } from "./puzzles";
import type { GuestCredential, RaceSnapshot } from "./tournament";

const KEY = "rush_hour_guest_capability";
const BASELINE = "rush_hour_tournament_balance";
export function getGuestCredential(): GuestCredential | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveGuestCredential(guest: GuestCredential) {
  localStorage.setItem(KEY, JSON.stringify(guest));
  localStorage.setItem(BASELINE, String(getCoins()));
}
export function walletDelta(): number { return getCoins() - Number(localStorage.getItem(BASELINE) ?? getCoins()); }
export function applyTournamentSnapshot(snapshot: RaceSnapshot, balanceAtRequest: number) {
  if (!snapshot.guest) return;
  const balance = snapshot.guest.coins + getCoins() - balanceAtRequest;
  addCoins(balance - getCoins());
  localStorage.setItem(BASELINE, String(snapshot.guest.coins));
  localStorage.setItem("rush_hour_tournament_stats", JSON.stringify({ wins: snapshot.guest.wins, losses: snapshot.guest.losses }));
}
export function tournamentStats(): { wins: number; losses: number } {
  try { return JSON.parse(localStorage.getItem("rush_hour_tournament_stats") ?? '{"wins":0,"losses":0}'); } catch { return { wins: 0, losses: 0 }; }
}