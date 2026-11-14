import { supabase } from "@/integrations/supabase/client";
import { getGuestCredential, saveGuestCredential } from "@/engine/tournament-device";
import { getProfile } from "@/engine/profile";
import { getCoins } from "@/engine/rewards";
import type { GuestCredential } from "@/engine/tournament";

let registration: Promise<GuestCredential> | null = null;
export function ensureGuestCredential(register: (input: { data: { username: string; country: string; avatarId: string; coins: number } }) => Promise<GuestCredential>): Promise<GuestCredential> {
  const existing = getGuestCredential();
  if (existing) return Promise.resolve(existing);
  if (!registration) registration = register({ data: { ...getProfile(), coins: Math.min(100000, Math.max(0, getCoins())) } })
    .then((guest) => { saveGuestCredential(guest); return guest; })
    .finally(() => { registration = null; });
  return registration;
}

export async function readDailyBest(date: string): Promise<number | null> {
  const { data, error } = await supabase.from("daily_scores").select("solve_time")
    .eq("date", date).order("solve_time", { ascending: true }).limit(1);
  if (error) throw error;
  return data?.[0]?.solve_time ?? null;
}
export async function writeDailyScore(score: { date: string; solve_time: number; player_name: string }) {
  const { error } = await supabase.from("daily_scores").insert(score);
  if (error) throw error;
}
export function subscribeRace(matchId: string, refresh: () => void, connected: (value: boolean) => void) {
  const channel = supabase.channel(`race-${matchId}`)
    .on("broadcast", { event: "refresh" }, refresh)
    .subscribe((status) => connected(status === "SUBSCRIBED"));
  return () => { void supabase.removeChannel(channel); };
}