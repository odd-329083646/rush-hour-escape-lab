import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundEngine } from "@/audio/soundEngine";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";

function useSoundState() {
  const [muted, setMuted] = useState(() => soundEngine.isMuted());
  const buttonRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (muted) {
      soundEngine.stopMusic();
      return;
    }

    const startMusic = (event: Event) => {
      if (soundEngine.isMuted()) return;
      if (event.target instanceof Node && buttonRef.current?.contains(event.target)) return;
      soundEngine.startMusic();
    };

    window.addEventListener("pointerdown", startMusic);
    window.addEventListener("keydown", startMusic);
    return () => {
      window.removeEventListener("pointerdown", startMusic);
      window.removeEventListener("keydown", startMusic);
    };
  }, [muted]);

  const toggleSound = () => {
    const nextMuted = !muted;
    soundEngine.setMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) soundEngine.startMusic();
  };
  return { muted, toggleSound, buttonRef };
}

export function SoundSwitch() {
  const { t } = useI18n();
  const { muted, toggleSound, buttonRef } = useSoundState();
  return (
    <label className="flex items-center justify-between gap-3 text-sm" htmlFor="sound-enabled">
      <span className="flex items-center gap-2">
        {muted ? <VolumeX className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground" />}
        {t("soundAndMusic")}
      </span>
      <Switch
        ref={(el) => { buttonRef.current = el; }}
        aria-label={t("soundAndMusic")}
        id="sound-enabled"
        checked={!muted}
        onCheckedChange={() => toggleSound()}
      />
    </label>
  );
}

export function SoundToggle() {
  const { t } = useI18n();
  const { muted, toggleSound, buttonRef } = useSoundState();

  return (
    <Button
      ref={(el) => { buttonRef.current = el; }}
      type="button"
      variant="ghost"
      className="sound-toggle chip shrink-0 px-2 sm:px-3"
      onClick={toggleSound}
      aria-label={t("soundAndMusic")}
      aria-pressed={!muted}
      title={t(muted ? "soundUnmute" : "soundMute")}
      data-muted={muted}
    >
      {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      <span className="hidden xl:inline">{t(muted ? "soundMuted" : "soundOn")}</span>
    </Button>
  );
}
