export type DuelInvitation = { id: string; name: string; code: string };
export type DuelInbox = { playerCode: string; invitations: DuelInvitation[] };export type DuelResponse = { id: string; name: string; status: "accepted" | "declined" };
export type DuelSendResult = { sent: boolean; error?: string | undefined };
