import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundEngine } from "@/audio/soundEngine";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function SoundToggle() {
  const { t } = useI18n();
  const [muted, setMuted] = useState(() => soundEngine.isMuted());
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  return (
    <Button
      ref={buttonRef}
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
