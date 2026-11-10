import { useMainMenu } from "@/hooks/useMainMenu";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n, type TKey } from "@/lib/i18n";
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
  return (
    <main className="lot-bg relative flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-4 sm:gap-8 sm:px-5 sm:py-10">
      {/* סרגל עליון: תג מטבעות והגדרות */}
      <div className="absolute end-3 top-3 flex items-center gap-2">
        <CoinsBadge />
        <SettingsButton />
      </div>

      <header className="text-center">
        <p className="font-display text-[10px] uppercase tracking-[0.4em] text-primary sm:text-sm">
          {t("parkingPuzzle")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:mt-3 sm:text-5xl md:text-6xl lg:text-7xl">
          Rush Hour
        </h1>
        <p className="mt-1 font-display text-base text-muted-foreground sm:mt-2 sm:text-xl">
          {t("edition")}
        </p>
      </header>

      <nav
        aria-label={t("mainMenu")}
        className="grid w-full max-w-4xl gap-3 md:grid-cols-3 md:gap-5 lg:max-w-5xl"
      >
        {ENTRIES.map(({ to, title, desc, tag, Icon }) => (
          <Link key={to} to={to} search={(to === "/daily" && dailySolved ? { calendar: true } : {}) as never} className="menu-card">
            <span className="menu-icon">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <span>
              <span className="block font-display text-lg font-bold sm:text-xl">{t(title)}</span>
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t(desc)}
            </span>
            <span className="mt-auto flex items-center justify-between gap-2 pt-1">
              <span className="chip px-2.5 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs">
                {to === "/daily" && dailySolved ? t("solvedBadge") : t(tag)}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-primary rtl:rotate-180" aria-hidden />
            </span>
          </Link>
        ))}
      </nav>

      <p className="max-w-md text-center text-[11px] text-muted-foreground sm:text-sm">
        {t("tagline")}
      </p>
    </main>
  );
}
