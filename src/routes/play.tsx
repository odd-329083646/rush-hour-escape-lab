import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Eye, EyeOff, Ghost, Skull } from "lucide-react";
import { LEVELS, type Level } from "@/engine/game";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { SettingsButton } from "@/components/settings-dialog";
import { CoinsBadge } from "@/components/coins-badge";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Regular Games - Rush Hour Vanishing Cars" },
      {
        name: "description",
        content: "Choose a difficulty mode: Easy, Medium, Hard or Murderer, then start solving.",
      },
      { property: "og:title", content: "Regular Games - Rush Hour Vanishing Cars" },
      {
        property: "og:description",
        content: "Four difficulty modes of parking-lot puzzles, from Easy to Murderer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Play,
});

const MODE_ICONS = { easy: Eye, medium: Ghost, hard: EyeOff, murderer: Skull } as const;

function Play() {
  const { t } = useI18n();

  return (
    <main className="mode-screen lot-bg flex h-dvh flex-col items-center justify-center gap-5 overflow-hidden px-5 py-5">
      <header className="flex w-full max-w-sm items-center justify-between">
        <Button asChild variant="ghost" className="chip px-3">
          <Link to="/" aria-label={t("backMenu")} title={t("backMenu")}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{t("menu")}</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <CoinsBadge />
          <SettingsButton />
        </div>
      </header>

      <div className="home-title text-center !pt-0">
        <p className="home-edition font-display text-sm font-semibold">{t("regularGames")}</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("chooseMode")}</h1>
      </div>

      <nav className="mode-panel flex w-full max-w-sm flex-col gap-3" aria-label={t("chooseMode")}>
        {(Object.keys(LEVELS) as Level[]).map((l, i) => {
          const Icon = MODE_ICONS[l];
          return (
            <Button asChild key={l} className={`mode-entry mode-${l} h-auto min-h-16 justify-start gap-3 px-4 py-2`}>
              <Link to="/game/$level" params={{ level: l }}>
                <span className="mode-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="flex min-w-0 flex-1 flex-col items-start text-start">
                  <span className="font-display text-lg font-bold leading-tight">{t(`level.${l}`)}</span>
                  <span className="mode-desc truncate text-xs font-semibold" dir="auto">{t(`modeDesc.${l}`)}</span>
                </span>
                <span className="mode-pips" aria-hidden="true">
                  {[0, 1, 2, 3].map((p) => <span key={p} data-on={p <= i} />)}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
              </Link>
            </Button>
          );
        })}
      </nav>
    </main>
  );
}
