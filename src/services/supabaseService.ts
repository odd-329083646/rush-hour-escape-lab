// src/services/supabaseService.ts
import { supabase } from "@/integrations/supabase/client";
import type { DailyScoreDO } from "./types";

export async function readDailyBest(date: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("daily_scores")
    .select("solve_time")
    .eq("date", date)
    .order("solve_time", { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0]?.solve_time ?? null;
}

export async function writeDailyScore(score: DailyScoreDO): Promise<void> {
  const { error } = await supabase.from("daily_scores").insert(score);
  if (error) throw error;
}

export function subscribeRace(
  matchId: string,
  refresh: () => void,
  connected: (value: boolean) => void,
) {
  const channel = supabase
    .channel(`race-${matchId}`)
    .on("broadcast", { event: "refresh" }, refresh)
    .subscribe((status) => connected(status === "SUBSCRIBED"));
  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeDuelInvitations(guestId: string, refresh: () => void) {
  const channel = supabase
    .channel(`duel-${guestId}`)
    .on("broadcast", { event: "refresh" }, refresh)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}