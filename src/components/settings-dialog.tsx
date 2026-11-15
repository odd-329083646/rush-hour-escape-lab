import { useState } from "react";
import { ChevronRight, GraduationCap, Keyboard, Move, Settings, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PlayerAvatar } from "@/components/player-avatar";
import { useProfile } from "@/hooks/useProfile";
import { useSettings } from "@/hooks/useSettings";
import { setLang, useI18n } from "@/lib/i18n";

export function SettingsButton({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} aria-label={t("settings")} title={t("settings")} className={`chip shrink-0 px-2 ${className}`}>
        <Settings className="h-4 w-4" />
      </Button>
      {open && <SettingsDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { t, lang, profile } = useProfile();
  const { dragEnabled, keyboardEnabled, setDragEnabled, setKeyboardEnabled } = useSettings();
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/80 p-3 backdrop-blur" onClick={onClose}>
      <div className="panel flex max-h-[90dvh] w-full max-w-md flex-col gap-5 overflow-auto" role="dialog" aria-modal="true" aria-label={t("settings")} dir="ltr" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{t("settings")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("close")}><X /></Button>
        </div>
        <Button asChild variant="ghost" className="h-auto justify-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <Link to="/profile" onClick={onClose}>
            <PlayerAvatar avatarId={profile.avatarId} className="settings-avatar" />
            <span className="min-w-0 flex-1 truncate text-left font-display font-semibold">{profile.username}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </Button>
        <section className="flex flex-col gap-3">
          <h3 className="panel-title mb-0">{t("language")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "he"] as const).map((language) => <Button key={language} variant="ghost" data-active={lang === language} aria-pressed={lang === language} onClick={() => setLang(language)} className="ctrl">{t(language === "en" ? "languageEnglish" : "languageHebrew")}</Button>)}
          </div>
        </section>
        <section className="flex flex-col gap-3 border-t border-border pt-4">
          <h3 className="panel-title mb-0">{t("controls")}</h3>
          <label className="flex items-center justify-between gap-3 text-sm" htmlFor="drag-enabled">
            <span className="flex items-center gap-2"><Move className="h-4 w-4 shrink-0 text-muted-foreground" />{t("vehicleDragging")}</span>
            <Switch aria-label={t("vehicleDragging")} id="drag-enabled" checked={dragEnabled} onCheckedChange={setDragEnabled} />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm" htmlFor="keyboard-enabled">
            <span className="flex items-center gap-2"><Keyboard className="h-4 w-4 shrink-0 text-muted-foreground" />{t("keyboardControls")}</span>
            <Switch aria-label={t("keyboardControls")} id="keyboard-enabled" checked={keyboardEnabled} onCheckedChange={setKeyboardEnabled} />
          </label>
        </section>
        <Button asChild variant="ghost" className="justify-start gap-3 border-t border-border pt-4"><Link to="/tutorial" onClick={onClose}><GraduationCap className="h-4 w-4 text-primary" />{t("tutorial")}<ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link></Button>
      </div>
    </div>
  );
}
