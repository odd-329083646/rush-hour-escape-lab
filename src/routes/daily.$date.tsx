import { createFileRoute, notFound } from "@tanstack/react-router";
import { DailyGame } from "@/components/daily/daily-game";

export const Route = createFileRoute("/daily/$date")({
  beforeLoad: ({ params }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `Daily Challenge ${params.date} - Rush Hour Vanishing Cars` },
      { name: "description", content: `Replay the Rush Hour daily puzzle from ${params.date}.` },
      { property: "og:title", content: `Daily Challenge ${params.date}` },
      { property: "og:description", content: `Replay the Rush Hour daily puzzle from ${params.date}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DailyDate,
});

function DailyDate() {
  const { date } = Route.useParams();
  return <DailyGame key={date} date={date} />;
}
