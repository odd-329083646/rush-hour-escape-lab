import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LEVELS, getSavedProgress, type Level } from "@/lib/puzzles";
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
        content:
          "Choose a difficulty mode: Easy, Medium, Hard or Murderer, then start solving.",
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

function Play() {
  const { t } = useI18n();

  return (
    <main className="lot-bg flex min-h-dvh flex-col items-center justify-center gap-8 px-5 py-10">
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

      <div className="text-center">
        <p className="font-display text-xs uppercase tracking-[0.4em] text-primary sm:text-sm">
          {t("regularGames")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("chooseMode")}</h1>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {(Object.keys(LEVELS) as Level[]).map((l) => {
          const progress = getSavedProgress(l);
          const totalPuzzles = LEVELS[l]?.puzzles?.length ?? 0;
          const solvedCount = Object.values(progress).filter(
            (p) => (p.stars ?? 0) > 0
          ).length;

          return (
            <Link
              key={l}
              to="/game/$level"
              params={{ level: l }}
              className="level-btn flex items-center justify-between px-5"
            >
              <span>{t(`level.${l}`)}</span>
              <span className="chip px-2.5 py-0.5 text-xs font-mono font-semibold opacity-90">
                {solvedCount}/{totalPuzzles}
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
