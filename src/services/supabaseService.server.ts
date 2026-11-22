// src/services/supabaseService.server.ts
import type { GuestCredentialDO, MoveDO, ProfileDO, RawCarDO, RawPuzzleDO } from "./types";

export interface RaceBoardStateDO {
  index: number;
  moves: number;
  totalMoves: number;
  elapsed: number;
  cars: RawCarDO[];
}

export interface RaceMatchDO {
  id: string;
  a: string | null;
  b: string | null;
  a_state: RaceBoardStateDO | null;
  b_state: RaceBoardStateDO | null;
  started_at: string | null;
  status: string;
  room_code?: string;
  puzzle_indices?: number[];
  puzzles?: RawPuzzleDO[];
  a_avatar_id?: string;
  b_avatar_id?: string;
}

export interface RaceSnapshotDO {
  match?: RaceMatchDO | null;
  error?: string;
  guest?: { id: string; coins: number; wins: number; losses: number };
  serverNow?: string;
}

export interface TournamentEngineHooks {
  pickPuzzleIndices: (randomFn: () => number) => number[];
  getInitialCars: (indices: number[]) => RawCarDO[];
  advanceMoves: (
    match: RaceMatchDO,
    currentState: RaceBoardStateDO,
    moves: MoveDO[],
    elapsed: number,
  ) => { state?: RaceBoardStateDO; error?: string };
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function duelInvitationAction(data: {
  credential: GuestCredentialDO;
  action: "inbox" | "send" | "dismiss" | "accept";
  recipientCode?: string | undefined;
  invitationId?: string | undefined;
}) {
  const tokenHash = await hashToken(data.credential.token);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: guest, error } = await supabaseAdmin
    .from("tournament_guests")
    .select("id,invitation_code")
    .eq("id", data.credential.id)
    .eq("token_hash", tokenHash)
    .single();
  if (error || !guest) throw new Error("Invalid guest");

  if (data.action === "send") {
    const username = data.recipientCode?.trim();
    if (!username) return { sent: false, error: "not_found" };
    const escaped = username.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    const named = await supabaseAdmin
      .from("tournament_guests")
      .select("id")
      .ilike("username", escaped)
      .limit(2);
    if (named.error) throw new Error("Invitation unavailable");
    if (!named.data?.length) return { sent: false, error: "not_found" };
    if (named.data.length > 1) return { sent: false, error: "ambiguous" };
    const result = await supabaseAdmin.rpc("send_duel_invitation_to", {
      p_guest: guest.id,
      p_hash: tokenHash,
      p_recipient: username,
    });
    if (result.error) throw new Error("Invitation unavailable");
    const response = result.data as { sent?: boolean; topic?: string; error?: string };
    if (response.sent && response.topic) {
      const channel = supabaseAdmin.channel(`duel-${response.topic}`);
      try {
        await channel.httpSend("refresh", {});
      } finally {
        await supabaseAdmin.removeChannel(channel);
      }
    }
    return { sent: Boolean(response.sent), error: response.error };
  }

  if ((data.action === "dismiss" || data.action === "accept") && data.invitationId) {
    const result = await supabaseAdmin
      .from("duel_invitations")
      .update({
        dismissed: true,
        status: data.action === "accept" ? "accepted" : "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", data.invitationId)
      .eq("recipient", guest.id)
      .eq("status", "pending")
      .select("sender");
    if (result.error) throw new Error("Invitation unavailable");
    const sender = result.data?.[0]?.sender;
    if (sender) {
      const channel = supabaseAdmin.channel(`duel-${sender}`);
      try {
        await channel.httpSend("refresh", {});
      } finally {
        await supabaseAdmin.removeChannel(channel);
      }
    }
  }

  const answered = await supabaseAdmin
    .from("duel_invitations")
    .select("id,recipient,status")
    .eq("sender", guest.id)
    .eq("sender_seen", false)
    .in("status", ["accepted", "declined"])
    .limit(5);
  let responses: { id: string; name: string; status: "accepted" | "declined" }[] = [];
  if (answered.data?.length) {
    await supabaseAdmin
      .from("duel_invitations")
      .update({ sender_seen: true })
      .in(
        "id",
        answered.data.map((row) => row.id),
      );
    const names = await supabaseAdmin
      .from("tournament_guests")
      .select("id,username")
      .in(
        "id",
        answered.data.map((row) => row.recipient),
      );
    responses = answered.data.map((row) => ({
      id: row.id,
      name: names.data?.find((n) => n.id === row.recipient)?.username ?? "",
      status: row.status as "accepted" | "declined",
    }));
  }

  const result = await supabaseAdmin
    .from("duel_invitations")
    .select("id,sender,match_id")
    .eq("recipient", guest.id)
    .eq("dismissed", false)
    .eq("status", "pending")
    .gte("created_at", new Date(Date.now() - 30_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(5);
  if (result.error) throw new Error("Invitation unavailable");
  const rows = result.data ?? [];
  if (!rows.length) return { playerCode: guest.invitation_code, invitations: [], responses };

  const [matches, players] = await Promise.all([
    supabaseAdmin
      .from("tournament_matches")
      .select("id,room_code,status,created_at")
      .in(
        "id",
        rows.map((row) => row.match_id),
      )
      .eq("status", "waiting")
      .gte("created_at", new Date(Date.now() - 30_000).toISOString()),
    supabaseAdmin
      .from("tournament_guests")
      .select("id,username")
      .in(
        "id",
        rows.map((row) => row.sender),
      ),
  ]);
  if (matches.error || players.error) throw new Error("Invitation unavailable");

  return {
    playerCode: guest.invitation_code,
    invitations: rows.flatMap((row) => {
      const match = matches.data?.find((m) => m.id === row.match_id);
      const player = players.data?.find((p) => p.id === row.sender);
      return match?.room_code && player
        ? [{ id: row.id, name: player.username, code: match.room_code }]
        : [];
    }),
    responses,
  };
}

export async function registerGuest(data: {
  username: string;
  country: string;
  avatarId?: string;
  coins: number;
}): Promise<GuestCredentialDO> {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await hashToken(token);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin
    .from("tournament_guests")
    .insert({
      token_hash: tokenHash,
      username: data.username,
      country: data.country,
      avatar_id: data.avatarId ?? "car",
      coins: data.coins,
    })
    .select("id")
    .single();
  if (result.error || !result.data) throw new Error("Tournament unavailable");
  return { id: result.data.id, token };
}

export async function syncGuestProfile(data: {
  credential: GuestCredentialDO;
  profile: ProfileDO;
  records: { standardCompleted: number; dailySolved: number };
}) {
  const tokenHash = await hashToken(data.credential.token);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const verified = await supabaseAdmin
    .from("tournament_guests")
    .select("id")
    .eq("id", data.credential.id)
    .eq("token_hash", tokenHash)
    .single();
  if (verified.error || !verified.data) throw new Error("Invalid guest");
  const result = await supabaseAdmin
    .from("tournament_guests")
    .update({
      username: data.profile.username,
      country: data.profile.country,
      avatar_id: data.profile.avatarId,
      player_records: data.records,
    })
    .eq("id", verified.data.id);
  if (result.error) throw new Error("Profile unavailable");
  return { saved: true };
}

export async function performTournamentAction(
  data: {
    credential: GuestCredentialDO;
    action: "status" | "random" | "create" | "join" | "cancel" | "move" | "forfeit" | "leave";
    code?: string | undefined;
    delta: number;
    username: string;
    country: string;
    move?: MoveDO | undefined;
    moves?: MoveDO[] | undefined;
  },
  engineHooks?: TournamentEngineHooks,
) {
  const tokenHash = await hashToken(data.credential.token);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const verified = await supabaseAdmin
    .from("tournament_guests")
    .select("id,active_match")
    .eq("id", data.credential.id)
    .eq("token_hash", tokenHash)
    .single();
  if (verified.error || !verified.data) throw new Error("Invalid guest");

  if (data.action !== "move" && data.action !== "status") {
    await supabaseAdmin
      .from("tournament_guests")
      .update({ username: data.username, country: data.country })
      .eq("id", verified.data.id);
  }

  let state: RaceBoardStateDO | null = null;
  let expected: number | undefined;
  const moves = data.moves ?? (data.move ? [data.move] : []);

  if (data.action === "move" && moves.length > 0 && verified.data.active_match && engineHooks) {
    const result = await supabaseAdmin
      .from("tournament_matches")
      .select("*")
      .eq("id", verified.data.active_match)
      .single();
    const match = result.data as unknown as RaceMatchDO | null;
    if (!match || (match.a !== verified.data.id && match.b !== verified.data.id))
      throw new Error("Invalid match");
    const current = match.a === verified.data.id ? match.a_state : match.b_state;
    if (!current) throw new Error("Invalid match");
    const elapsed = Math.max(
      0,
      Math.floor((Date.now() - Date.parse(match.started_at ?? "")) / 1000),
    );
    const next = engineHooks.advanceMoves(match, current, moves, elapsed);
    if (next.error) return { error: next.error };
    state = next.state ?? null;
    expected = current.totalMoves;
  }

  let code = data.code;
  if (data.action === "create") {
    for (let attempt = 0; attempt < 10; attempt++) {
      const numbers = new Uint32Array(1);
      crypto.getRandomValues(numbers);
      code = String(100000 + ((numbers[0] ?? 0) % 900000));
      const existing = await supabaseAdmin
        .from("tournament_matches")
        .select("id")
        .eq("room_code", code)
        .maybeSingle();
      if (!existing.data) break;
    }
  }

  const indices =
    (data.action === "create" || data.action === "random") && engineHooks
      ? engineHooks.pickPuzzleIndices(() => {
          const numbers = new Uint32Array(1);
          crypto.getRandomValues(numbers);
          return (numbers[0] ?? 0) / 4294967296;
        })
      : undefined;

  if (indices && engineHooks) {
    const cars = engineHooks.getInitialCars(indices);
    if (!cars.length) throw new Error("Missing race puzzle");
    state = { index: 0, moves: 0, totalMoves: 0, elapsed: 0, cars };
  }

  const result = await supabaseAdmin.rpc("tournament_action", {
    p_guest: verified.data.id,
    p_hash: tokenHash,
    p_action: data.action,
    ...(code ? { p_code: code } : {}),
    ...(indices ? { p_puzzles: indices } : {}),
    ...(state ? { p_state: JSON.parse(JSON.stringify(state)) } : {}),
    ...(expected !== undefined ? { p_expected: expected } : {}),
    p_delta: data.delta,
  });
  if (result.error) throw new Error("Tournament unavailable");

  let snapshot = result.data as unknown as RaceSnapshotDO;
  if (data.action === "cancel" && snapshot.match?.status === "cancelled") {
    const cleared = await supabaseAdmin.rpc("tournament_action", {
      p_guest: verified.data.id,
      p_hash: tokenHash,
      p_action: "leave",
      p_delta: 0,
    });
    if (cleared.error) throw new Error("Tournament unavailable");
    snapshot = cleared.data as unknown as RaceSnapshotDO;
  }
  if (snapshot.error && data.action !== "move") {
    const refreshed = await supabaseAdmin.rpc("tournament_action", {
      p_guest: verified.data.id,
      p_hash: tokenHash,
      p_action: "status",
      p_delta: 0,
    });
    if (refreshed.error) throw new Error("Tournament unavailable");
    snapshot = { ...(refreshed.data as unknown as RaceSnapshotDO), error: snapshot.error };
  }
  if (snapshot.match && data.action !== "status") {
    const channel = supabaseAdmin.channel(`race-${snapshot.match.id}`);
    try {
      await channel.httpSend("refresh", {});
    } finally {
      await supabaseAdmin.removeChannel(channel);
    }
  }
  if (snapshot.match?.puzzle_indices) {
    const { puzzles: _legacy, ...match } = snapshot.match;
    snapshot = { ...snapshot, match };
  }
  if (snapshot.match) {
    const players = [snapshot.match.a, snapshot.match.b].filter((id): id is string => Boolean(id));
    const avatars = await supabaseAdmin
      .from("tournament_guests")
      .select("id,avatar_id")
      .in("id", players);
    snapshot = {
      ...snapshot,
      match: {
        ...snapshot.match,
        a_avatar_id: avatars.data?.find((p) => p.id === snapshot.match?.a)?.avatar_id ?? "car",
        b_avatar_id: avatars.data?.find((p) => p.id === snapshot.match?.b)?.avatar_id ?? "car",
      },
    };
  }
  return snapshot;
}