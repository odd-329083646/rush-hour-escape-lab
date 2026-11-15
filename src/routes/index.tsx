import { useProfile } from "@/hooks/useProfile";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { useMainMenu } from "@/hooks/useMainMenu";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type TKey } from "@/lib/i18n";
import { SettingsButton } from "@/components/settings-dialog";
import { CoinsBadge } from "@/components/coins-badge";
import { CalendarDays, ChevronRight, Gamepad2, Trophy, type LucideIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rush Hour - Vanishing Cars Edition | Main Menu" },
      {
        name: "description",
        content:
          "Pick how you want to play: regular parking lots, the daily challenge, or competitions.",
      },
      { property: "og:title", content: "Rush Hour - Vanishing Cars Edition" },
      {
        property: "og:description",
        content: "Regular games, a daily challenge and competitions — pick your way in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Entry = {
  to: "/play" | "/daily" | "/competitions";
  title: TKey;
  desc: TKey;
  tag: TKey;
  Icon: LucideIcon;
};

const ENTRIES: Entry[] = [
  {
    to: "/play",
    title: "regularGames",
    desc: "regularDesc",
    tag: "regularTag",
    Icon: Gamepad2,
  },
  {
    to: "/daily",
    title: "daily",
    desc: "dailyDesc",
    tag: "dailyTag",
    Icon: CalendarDays,
  },
  {
    to: "/competitions",
    title: "raceTitle",
    desc: "raceDescription",
    tag: "raceEntry",
    Icon: Trophy,
  },
];

function Index() {
  const { dailySolved, t } = useMainMenu();
  const { profile } = useProfile();
  return (
    <main className="home-screen lot-bg relative flex h-dvh flex-col items-center overflow-hidden px-4 py-4 sm:px-5">
      {/* סרגל עליון: תג מטבעות והגדרות */}
      <div className="home-tools absolute end-3 top-3 flex items-center gap-2">
        <CoinsBadge />
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0" aria-label={t("profile")} title={t("profile")}><Link to="/profile"><PlayerAvatar avatarId={profile.avatarId} className="h-9 w-9" /></Link></Button>
        <SettingsButton />
      </div>

      <header className="home-title text-center">
        <p className="home-eyebrow font-display text-xs font-semibold sm:text-sm">
          {t("parkingPuzzle")}
        </p>
        <h1 className="font-display text-5xl font-bold sm:text-6xl lg:text-7xl">
          Rush Hour
        </h1>
        <p className="home-edition mt-1 font-display text-base font-semibold sm:text-xl">
          {t("edition")}
        </p>
      </header>

      <nav
        aria-label={t("mainMenu")}
        className="home-menu mt-auto grid w-full max-w-5xl gap-3 md:grid-cols-3 md:gap-4"
      >
        {ENTRIES.map(({ to, title, desc, tag, Icon }) => (
          <Button asChild key={to} className={`home-entry ${to === "/play" ? "entry-play" : to === "/daily" ? "entry-daily" : "entry-race"}`}>
          <Link to={to} search={(to === "/daily" && dailySolved ? { calendar: true } : {}) as never}>
            <span className="menu-icon">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block font-display text-lg font-bold sm:text-xl">{t(title)}</span>
            </span>
            <span className="sr-only">
              {t(desc)}
            </span>
            <span className="home-entry-end flex shrink-0 items-center gap-2">
              <span className="home-tag text-[10px] sm:text-xs">
                {to === "/daily" && dailySolved ? t("solvedBadge") : t(tag)}
              </span>
               <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
            </span>
          </Link>
          </Button>
        ))}
      </nav>

      <p className="home-tagline mt-4 max-w-md text-center text-[11px] font-medium sm:text-sm">
        {t("tagline")}
      </p>
    </main>
  );
}
