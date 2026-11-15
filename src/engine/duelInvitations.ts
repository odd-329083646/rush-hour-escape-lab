export type DuelInvitation = { id: string; name: string; code: string };
export type DuelInbox = { playerCode: string; invitations: DuelInvitation[] };