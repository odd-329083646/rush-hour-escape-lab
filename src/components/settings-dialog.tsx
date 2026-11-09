import { usePlayerSettings } from "@/hooks/usePlayerSettings";
import { useEffect, useState } from "react";
import { GraduationCap, Settings, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { setLang, useI18n, type Lang } from "@/lib/i18n";
import { COUNTRIES, flag, getProfile, levelBests, saveProfile } from "@/lib/profile";
import { LEVELS, type Level } from "@/lib/puzzles";
import { fmtTime } from "@/lib/daily-scores";
import { tournamentStats } from "@/lib/tournament-device";

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
  const { t, lang, username, setUsername, country, setCountry, saved, setSaved, commit, stats, raceStats } = usePlayerSettings();

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/80 p-3 backdrop-blur" onClick={onClose}>
      <div className="panel flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-auto" role="dialog" aria-label={t("settings")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{t("settings")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("close")}><X /></Button>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="panel-title mb-0">{t("profile")}</h3>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{t("username")}</span>
            <div className="flex gap-2">
              <input value={username} maxLength={24} onChange={(e) => { setUsername(e.target.value); setSaved(false); }}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") commit(); }}
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground" />
              <Button onClick={() => commit()} className="execute">{saved ? t("saved") : t("save")}</Button>
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{t("country")}</span>
            <select value={country} onChange={(e) => { setCountry(e.target.value); commit(username, e.target.value); }}
              className="rounded-md border border-input bg-background px-3 py-2 text-foreground">
              <option value="">—</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{flag(c.code)} {lang === "he" ? c.he : c.en}</option>)}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{t("language")}</span>
            <div className="grid grid-cols-2 gap-2">
              {([["en", "English"], ["he", "עברית"]] as [Lang, string][]).map(([l, name]) => (
                <Button key={l} variant="ghost" data-active={lang === l} onClick={() => setLang(l)} className="ctrl">{name}</Button>
              ))}
            </div>
          </div>
        </section>

        <Link to="/tutorial" onClick={onClose} className="palette-item border-border"><GraduationCap className="h-4 w-4 text-primary" /><span><span className="block font-medium">{t("tutorial")}</span><span className="text-xs text-muted-foreground">{t("tutorialDesc")}</span></span></Link>

        <section>
          <h3 className="panel-title">{t("stats")}</h3>
          <div className="mb-3 flex justify-between gap-3 text-sm"><span>{t("raceWins")}: {raceStats.wins}</span><span>{t("raceLosses")}: {raceStats.losses}</span></div>
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-3 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span /> <span className="text-center">{t("bestTime")}</span><span className="text-center">{t("minMoves")}</span>
            </div>
            {stats.map(({ level: l, ...b }) => {
              return (
                <div key={l} className="grid grid-cols-3 border-t px-3 py-2 text-sm">
                  <span className="font-medium">{t(`level.${l}`)}</span>
                  <span className="text-center font-display">{b.bestTime != null ? fmtTime(b.bestTime) : t("noSolves")}</span>
                  <span className="text-center font-display">{b.bestMoves ?? t("noSolves")}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
