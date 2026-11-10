import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const moveSchema = z.object({ id: z.string().min(1).max(3), direction: z.enum(["up", "down", "left", "right"]), steps: z.number().int().min(1).max(4) });
const credentialSchema = z.object({ id: z.string().uuid(), token: z.string().min(32).max(128) });
export const registerTournamentGuest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ username: z.string().trim().min(1).max(24), country: z.string().regex(/^([A-Z]{2})?$/), coins: z.number().int().min(0).max(100000) }).parse(input))
  .handler(async ({ data }) => {
    const { registerGuest } = await import("@/services/supabaseService.server");
    return registerGuest(data);
  });

export const tournamentAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    credential: credentialSchema,
    action: z.enum(["status", "random", "create", "join", "cancel", "move", "forfeit", "leave"]),
    code: z.string().regex(/^\d{6}$/).optional(),
    delta: z.number().int().min(-100000).max(100000).default(0),
    username: z.string().trim().min(1).max(24), country: z.string().regex(/^([A-Z]{2})?$/),
    move: moveSchema.optional(),
    // Moves made while an earlier request was in flight travel together in one ordered batch.
    moves: z.array(moveSchema).min(1).max(40).optional(),
  }).parse(input))
  .handler(async ({ data }) => {
    const { performTournamentAction } = await import("@/services/supabaseService.server");
    return performTournamentAction(data);
  });
