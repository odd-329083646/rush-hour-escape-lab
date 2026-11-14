import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Coins, Flag, Grid2X2, CalendarCheck, Trophy, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/player-avatar";
import { SettingsButton } from "@/components/settings-dialog";
import { AVATARS } from "@/config/avatars";
import { flag } from "@/lib/profile";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Player Profile - Rush Hour Vanishing Cars" },
    { name: "description", content: "Your Rush Hour racing avatar, player name, puzzle achievements, and tournament records." },
    { property: "og:title", content: "Player Profile - Rush Hour Vanishing Cars" },
    { property: "og:description", content: "Personal racing avatars and achievements across standard games, daily challenges, and live tournaments." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const { t, profile, records, username, setUsername, updateUsername, updateAvatar } = useProfile();
  const stats = [
    { label: "standardCompleted" as const, value: records.standardCompleted, icon: Grid2X2 },
    { label: "dailySolved" as const, value: records.dailySolved, icon: CalendarCheck },
    { label: "raceWins" as const, value: records.wins, icon: Trophy },
    { label: "raceLosses" as const, value: records.losses, icon: Medal },
    { label: "coinBalance" as const, value: records.coins, icon: Coins },
  ];
  return (
    <main className="profile-page lot-bg flex flex-col gap-4 p-4 sm:p-6" dir="ltr">
      <header className="mx-auto flex w-full max-w-4xl shrink-0 items-center justify-between gap-3">
        <Button asChild variant="ghost" className="chip"><Link to="/"><ArrowLeft className="h-4 w-4" />{t("back")}</Link></Button>
        <h1 className="font-display text-lg font-bold sm:text-xl">{t("profile")}</h1>
        <SettingsButton />
      </header>
      <div className="profile-content">
        <section className="flex items-center gap-4 border-b border-border pb-4 sm:gap-6" aria-label={t("profile")}>
          <PlayerAvatar avatarId={profile.avatarId} className="profile-avatar-large" />
          <form className="min-w-0 flex-1" onSubmit={(event) => { event.preventDefault(); updateUsername(username); }}>
            <label htmlFor="profile-username" className="mb-2 block text-sm text-muted-foreground">{t("username")}</label>
            <div className="flex gap-2">
              <input id="profile-username" value={username} maxLength={20} onChange={(event) => setUsername(event.target.value)} className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground" />
              <Button type="submit" className="execute"><Check className="h-4 w-4" />{t("save")}</Button>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Flag className="h-3 w-3" />{profile.country ? flag(profile.country) : "—"}{profile.country}</p>
          </form>
        </section>
        <section aria-labelledby="avatar-title">
          <h2 id="avatar-title" className="mb-3 font-display text-sm font-semibold">{t("avatarPicker")}</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {AVATARS.map((avatar) => <Button key={avatar.id} variant="ghost" aria-label={t(avatar.label)} title={t(avatar.label)} aria-pressed={profile.avatarId === avatar.id} onClick={() => updateAvatar(avatar.id)} className={`h-auto flex-col gap-2 rounded-lg border py-2 ${profile.avatarId === avatar.id ? "border-primary bg-primary/10" : "border-border"}`}>
              <PlayerAvatar avatarId={avatar.id} className="profile-avatar-choice" />
              <span className="w-full whitespace-normal text-center text-[10px] leading-tight">{t(avatar.label)}</span>
            </Button>)}
          </div>
        </section>
        <section aria-labelledby="records-title">
          <h2 id="records-title" className="mb-3 font-display text-sm font-semibold">{t("playerRecords")}</h2>
          <div className="profile-records">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="profile-record">
            <Icon className="mb-2 h-4 w-4 text-primary" />
            <strong className="block font-display text-2xl tabular-nums">{value}</strong>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{t(label)}</span>
          </div>)}</div>
        </section>
      </div>
    </main>
  );
}