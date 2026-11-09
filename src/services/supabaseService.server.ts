import { advanceRace, fallbackRacePuzzles, type RaceMatch, type RaceSnapshot, type GuestCredential } from "@/lib/tournament";
import type { Move } from "@/engine/game";
async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function registerGuest(data: { username: string; country: string; coins: number }) {
    const token = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = await hashToken(token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.from("tournament_guests").insert({ token_hash: tokenHash, username: data.username, country: data.country, coins: data.coins }).select("id").single();
    if (result.error || !result.data) throw new Error("Tournament unavailable");
    return { id: result.data.id, token };
}
export async function performTournamentAction(data: { credential: GuestCredential; action: "status" | "random" | "create" | "join" | "cancel" | "move" | "forfeit" | "leave"; code?: string; delta: number; username: string; country: string; move?: { id: string; direction: Move; steps: number } }) {
    const tokenHash = await hashToken(data.credential.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // The capability is verified against its device guest before any match access or mutation.
    const verified = await supabaseAdmin.from("tournament_guests").select("id,active_match").eq("id", data.credential.id).eq("token_hash", tokenHash).single();
    if (verified.error || !verified.data) throw new Error("Invalid guest");
    await supabaseAdmin.from("tournament_guests").update({ username: data.username, country: data.country }).eq("id", verified.data.id);
    let state = null;
    let expected: number | undefined;
    if (data.action === "move" && data.move && verified.data.active_match) {
      const result = await supabaseAdmin.from("tournament_matches").select("*").eq("id", verified.data.active_match).single();
      const match = result.data as unknown as RaceMatch | null;
      if (!match || (match.a !== verified.data.id && match.b !== verified.data.id)) throw new Error("Invalid match");
      const current = match.a === verified.data.id ? match.a_state : match.b_state;
      if (!current) throw new Error("Invalid match");
      const elapsed = Math.max(0, Math.floor((Date.now() - Date.parse(match.started_at ?? "")) / 1000));
      const next = advanceRace(match.puzzles, current, data.move.id, data.move.direction, data.move.steps, elapsed);
      if (next.error) return { error: next.error };
      state = next.state;
      expected = current.totalMoves;
    }
    let code = data.code;
    if (data.action === "create") {
      for (let attempt = 0; attempt < 10; attempt++) {
        const numbers = new Uint32Array(1); crypto.getRandomValues(numbers);
        code = String(100000 + (numbers[0] ?? 0) % 900000);
        const existing = await supabaseAdmin.from("tournament_matches").select("id").eq("room_code", code).maybeSingle();
        if (!existing.data) break;
      }
    }
    const result = await supabaseAdmin.rpc("tournament_action", {
      p_guest: verified.data.id, p_hash: tokenHash, p_action: data.action,
      ...(code ? { p_code: code } : {}), p_puzzles: JSON.parse(JSON.stringify(fallbackRacePuzzles())),
      ...(state ? { p_state: JSON.parse(JSON.stringify(state)) } : {}), ...(expected !== undefined ? { p_expected: expected } : {}), p_delta: data.delta,
    });
    if (result.error) throw new Error("Tournament unavailable");
    let snapshot = result.data as unknown as RaceSnapshot;
    if (snapshot.error) {
      const refreshed = await supabaseAdmin.rpc("tournament_action", { p_guest: verified.data.id, p_hash: tokenHash, p_action: "status", p_delta: 0 });
      if (refreshed.error) throw new Error("Tournament unavailable");
      snapshot = { ...(refreshed.data as unknown as RaceSnapshot), error: snapshot.error };
    }
    if (snapshot.match && data.action !== "status") {
      // Public capability topics carry only a refresh signal, never names, boards, balances or credentials.
      const channel = supabaseAdmin.channel(`race-${snapshot.match.id}`);
      try { await channel.send({ type: "broadcast", event: "refresh", payload: {} }); }
      finally { await supabaseAdmin.removeChannel(channel); }
    }
    return snapshot;
}
