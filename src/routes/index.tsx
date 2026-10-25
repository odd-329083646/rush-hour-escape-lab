import { createFileRoute, Link } from "@tanstack/react-router";
import { LEVELS, type Level } from "@/lib/puzzles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rush Hour - Vanishing Cars Edition" },
      { name: "description", content: "Slide cars on a 6x6 lot and make them vanish. Three difficulty levels." },
      { property: "og:title", content: "Rush Hour - Vanishing Cars Edition" },
      { property: "og:description", content: "Slide cars on a 6x6 lot and make them vanish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="lot-bg flex min-h-screen flex-col items-center justify-center gap-12 px-6">
      <div className="text-center">
        <p className="font-display text-sm uppercase tracking-[0.4em] text-primary">Parking Puzzle</p>
        <h1 className="mt-3 font-display text-5xl font-bold md:text-7xl">Rush Hour</h1>
        <p className="mt-2 font-display text-xl text-muted-foreground md:text-2xl">Vanishing Cars Edition</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-4">
        {(Object.keys(LEVELS) as Level[]).map((l) => (
          <Link key={l} to="/game/$level" params={{ level: l }} className="level-btn">
            <span>{LEVELS[l].title}</span>
            <span dir="rtl" className="text-muted-foreground">{LEVELS[l].he}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
