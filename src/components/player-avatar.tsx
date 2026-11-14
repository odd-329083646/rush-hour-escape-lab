import { useState } from "react";
import { resolveAvatar } from "@/config/avatars";

export function PlayerAvatar({ avatarId, className = "", label }: { avatarId?: string | undefined; className?: string; label?: string }) {
  const avatar = resolveAvatar(avatarId);
  const [failedImage, setFailedImage] = useState<string>();
  if (!avatar) return null;
  const Icon = avatar.icon;
  return (
    <span className={`player-avatar ${avatar.theme} ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {avatar.imageUrl && failedImage !== avatar.imageUrl
        ? <img src={avatar.imageUrl} alt="" className="h-full w-full object-cover" onError={() => setFailedImage(avatar.imageUrl)} />
        : <Icon className="h-1/2 w-1/2" strokeWidth={1.8} />}
    </span>
  );
}