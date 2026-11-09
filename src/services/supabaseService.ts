import { supabase } from "@/integrations/supabase/client";

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