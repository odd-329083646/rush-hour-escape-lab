import { advanceRace, pickRacePuzzleIndices, resolveRacePuzzles, type RaceMatch, type RaceSnapshot, type GuestCredential } from "@/lib/tournament";
import type { Move } from "@/engine/game";
import type { Profile } from "@/engine/profile";
async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function registerGuest(data: { username: string; country: string; avatarId?: string; coins: number }) {
    const token = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = await hashToken(token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.from("tournament_guests").insert({ token_hash: tokenHash, username: data.username, country: data.country, avatar_id: data.avatarId ?? "car", coins: data.coins }).select("id").single();
    if (result.error || !result.data) throw new Error("Tournament unavailable");
    return { id: result.data.id, token };
}
export async function syncGuestProfile(data: { credential: GuestCredential; profile: Profile; records: { standardCompleted: number; dailySolved: number } }) {
    const tokenHash = await hashToken(data.credential.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const verified = await supabaseAdmin.from("tournament_guests").select("id").eq("id", data.credential.id).eq("token_hash", tokenHash).single();
    if (verified.error || !verified.data) throw new Error("Invalid guest");
    const result = await supabaseAdmin.from("tournament_guests").update({ username: data.profile.username, country: data.profile.country, avatar_id: data.profile.avatarId, player_records: data.records }).eq("id", verified.data.id);
    if (result.error) throw new Error("Profile unavailable");
    return { saved: true };
}
export async function performTournamentAction(data: { credential: GuestCredential; action: "status" | "random" | "create" | "join" | "cancel" | "move" | "forfeit" | "leave"; code?: string | undefined; delta: number; username: string; country: string; move?: { id: string; direction: Move; steps: number } | undefined; moves?: { id: string; direction: Move; steps: number }[] | undefined }) {
    const tokenHash = await hashToken(data.credential.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // The capability is verified against its device guest before any match access or mutation.
    const verified = await supabaseAdmin.from("tournament_guests").select("id,active_match").eq("id", data.credential.id).eq("token_hash", tokenHash).single();
    if (verified.error || !verified.data) throw new Error("Invalid guest");
    if (data.action !== "move" && data.action !== "status") await supabaseAdmin.from("tournament_guests").update({ username: data.username, country: data.country }).eq("id", verified.data.id);
    let state = null;
    let expected: number | undefined;
    const moves = data.moves ?? (data.move ? [data.move] : []);
    if (data.action === "move" && moves.length > 0 && verified.data.active_match) {
      const result = await supabaseAdmin.from("tournament_matches").select("*").eq("id", verified.data.active_match).single();
      const match = result.data as unknown as RaceMatch | null;
      if (!match || (match.a !== verified.data.id && match.b !== verified.data.id)) throw new Error("Invalid match");
      const current = match.a === verified.data.id ? match.a_state : match.b_state;
      if (!current) throw new Error("Invalid match");
      const elapsed = Math.max(0, Math.floor((Date.now() - Date.parse(match.started_at ?? "")) / 1000));
      let advanced = current;
      const puzzles = resolveRacePuzzles(match);
      for (const move of moves) {
        if (advanced.index >= 3) break;
        const next = advanceRace(puzzles, advanced, move.id, move.direction, move.steps, elapsed);
        if (next.error) return { error: next.error };
        advanced = next.state;
      }
      state = advanced;
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
    const indices = data.action === "create" || data.action === "random" ? pickRacePuzzleIndices(() => {
      const numbers = new Uint32Array(1);
      crypto.getRandomValues(numbers);
      return (numbers[0] ?? 0) / 4294967296;
    }) : undefined;
    if (indices) {
      const first = resolveRacePuzzles({ puzzle_indices: indices })[0];
      if (!first) throw new Error("Missing race puzzle");
      state = { index: 0, moves: 0, totalMoves: 0, elapsed: 0, cars: first.cars };
    }
    const result = await supabaseAdmin.rpc("tournament_action", {
      p_guest: verified.data.id, p_hash: tokenHash, p_action: data.action,
      ...(code ? { p_code: code } : {}), ...(indices ? { p_puzzles: indices } : {}),
      ...(state ? { p_state: JSON.parse(JSON.stringify(state)) } : {}), ...(expected !== undefined ? { p_expected: expected } : {}), p_delta: data.delta,
    });
    if (result.error) throw new Error("Tournament unavailable");
    let snapshot = result.data as unknown as RaceSnapshot;
    if (snapshot.error && data.action !== "move") {
      const refreshed = await supabaseAdmin.rpc("tournament_action", { p_guest: verified.data.id, p_hash: tokenHash, p_action: "status", p_delta: 0 });
      if (refreshed.error) throw new Error("Tournament unavailable");
      snapshot = { ...(refreshed.data as unknown as RaceSnapshot), error: snapshot.error };
    }
    if (snapshot.match && data.action !== "status") {
      // Public capability topics carry only a refresh signal, never names, boards, balances or credentials.
      const channel = supabaseAdmin.channel(`race-${snapshot.match.id}`);
      // REST broadcast: no socket handshake, so both clients get the refresh signal immediately.
      try { await channel.httpSend("refresh", {}); }
      finally { await supabaseAdmin.removeChannel(channel); }
    }
    // New races expose indices only; legacy in-flight races retain their original boards.
    if (snapshot.match?.puzzle_indices) {
      const { puzzles: _legacy, ...match } = snapshot.match;
      snapshot = { ...snapshot, match };
    }
    if (snapshot.match) {
      const players = [snapshot.match.a, snapshot.match.b].filter((id): id is string => Boolean(id));
      const avatars = await supabaseAdmin.from("tournament_guests").select("id,avatar_id").in("id", players);
      snapshot = { ...snapshot, match: { ...snapshot.match,
        a_avatar_id: avatars.data?.find((p) => p.id === snapshot.match?.a)?.avatar_id ?? "car",
        b_avatar_id: avatars.data?.find((p) => p.id === snapshot.match?.b)?.avatar_id ?? "car",
      } };
    }
    return snapshot;
}
