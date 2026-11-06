import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DailyGame } from "@/components/daily/daily-game";
import { todayKey } from "@/lib/puzzles";

export const Route = createFileRoute("/daily/")({
  head: () => ({
    meta: [
      { title: "Daily Challenge - Rush Hour Vanishing Cars" },
      { name: "description", content: "One fresh parking lot every day, the same puzzle for everyone. Beat the fastest time." },
      { property: "og:title", content: "Daily Challenge - Rush Hour Vanishing Cars" },
      { property: "og:description", content: "One fresh parking lot every day. Beat the fastest time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Today,
});

function Today() {
  // The player's local date, read after hydration.
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => setDate(todayKey()), []);
  return date ? <DailyGame date={date} /> : <main className="lot-bg h-dvh" />;
}
