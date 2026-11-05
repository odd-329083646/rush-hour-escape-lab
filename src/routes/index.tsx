import { createFileRoute, Link } from "@tanstack/react-router";
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
  title: string;
  he: string;
  desc: string;
  tag: string;
  Icon: LucideIcon;
};

const ENTRIES: Entry[] = [
  {
    to: "/play",
    title: "Regular Games",
    he: "משחקים רגילים",
    desc: "Hand-checked parking lots in four difficulty modes, from Easy to Murderer.",
    tag: "4 modes",
    Icon: Gamepad2,
  },
  {
    to: "/daily",
    title: "Daily Challenge",
    he: "משחק יומי",
    desc: "One fresh lot every day — the same puzzle for everyone who plays it.",
    tag: "Coming soon",
    Icon: CalendarDays,
  },
  {
    to: "/competitions",
    title: "Competitions",
    he: "תחרויות",
    desc: "Race other drivers on timed solves and climb the standings.",
    tag: "Coming soon",
    Icon: Trophy,
  },
];

function Index() {
  return (
    <main className="lot-bg flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-4 sm:gap-8 sm:px-5 sm:py-10">
      <header className="text-center">
        <p className="font-display text-[10px] uppercase tracking-[0.4em] text-primary sm:text-sm">
          Parking Puzzle
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:mt-3 sm:text-5xl md:text-6xl lg:text-7xl">
          Rush Hour
        </h1>
        <p className="mt-1 font-display text-base text-muted-foreground sm:mt-2 sm:text-xl">
          Vanishing Cars Edition
        </p>
      </header>

      <nav
        aria-label="Main menu"
        className="grid w-full max-w-4xl gap-3 md:grid-cols-3 md:gap-5 lg:max-w-5xl"
      >
        {ENTRIES.map(({ to, title, he, desc, tag, Icon }) => (
          <Link key={to} to={to} className="menu-card">
            <span className="menu-icon">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <span>
              <span className="block font-display text-lg font-bold sm:text-xl">{title}</span>
              <span dir="rtl" className="block text-left text-sm text-muted-foreground">
                {he}
              </span>
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {desc}
            </span>
            <span className="mt-auto flex items-center justify-between gap-2 pt-1">
              <span className="chip px-2.5 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs">
                {tag}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            </span>
          </Link>
        ))}
      </nav>

      <p className="max-w-md text-center text-[11px] text-muted-foreground sm:text-sm">
        Slide the cars out of the lot and free the red one.
      </p>
    </main>
  );
}
