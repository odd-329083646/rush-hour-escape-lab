import { Car, Truck, Trophy, Flame, Zap, Shield, Crown, Flag, type LucideIcon } from "lucide-react";
import type { TKey } from "@/lib/i18n";

export type PlayerAvatarConfig = { id: string; label: TKey; icon: LucideIcon; theme: string; imageUrl?: string };
export const AVATARS: PlayerAvatarConfig[] = [
  { id: "car", label: "avatarCar", icon: Car, theme: "avatar-car" },
  { id: "truck", label: "avatarTruck", icon: Truck, theme: "avatar-truck" },
  { id: "trophy", label: "avatarTrophy", icon: Trophy, theme: "avatar-trophy" },
  { id: "flame", label: "avatarFlame", icon: Flame, theme: "avatar-flame" },
  { id: "zap", label: "avatarZap", icon: Zap, theme: "avatar-zap" },
  { id: "shield", label: "avatarShield", icon: Shield, theme: "avatar-shield" },
  { id: "crown", label: "avatarCrown", icon: Crown, theme: "avatar-crown" },
  { id: "flag", label: "avatarFlag", icon: Flag, theme: "avatar-flag" },
];
export const DEFAULT_AVATAR_ID = "car";
export function resolveAvatar(id?: string) { return AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0]; }