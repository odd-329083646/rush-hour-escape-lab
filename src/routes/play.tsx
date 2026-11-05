import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LEVELS, type Level } from "@/lib/puzzles";
import { Button } from "@/components/ui/button";

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
  return (
    <main className="lot-bg flex min-h-dvh flex-col items-center justify-center gap-8 px-5 py-10">
      <header className="flex w-full max-w-sm items-center">
        <Button asChild variant="ghost" className="chip px-3">
          <Link to="/" aria-label="Back to main menu" title="Back to main menu">
            <ArrowLeft className="h-4 w-4" />
            <span>Menu · תפריט</span>
          </Link>
        </Button>
      </header>

      <div className="text-center">
        <p className="font-display text-xs uppercase tracking-[0.4em] text-primary sm:text-sm">
          Regular Games
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Choose a mode</h1>
        <p dir="rtl" className="mt-2 text-muted-foreground">
          בחר רמת קושי
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {(Object.keys(LEVELS) as Level[]).map((l) => (
          <Link key={l} to="/game/$level" params={{ level: l }} className="level-btn">
            <span>{LEVELS[l].title}</span>
            <span dir="rtl" className="text-muted-foreground">
              {LEVELS[l].he}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
