import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily Challenge - Rush Hour Vanishing Cars (Coming Soon)" },
      {
        name: "description",
        content:
          "One fresh parking lot every day, the same puzzle for everyone. Not open yet.",
      },
      { property: "og:title", content: "Daily Challenge - Rush Hour Vanishing Cars" },
      {
        property: "og:description",
        content: "One fresh parking lot every day. Coming soon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Daily,
});

function Daily() {
  // Read on the client only: the server's date can differ from the player's,
  // which would make the first render disagree with the hydrated one.
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }, []);

  return (
    <ComingSoon
      Icon={CalendarDays}
      title="Daily Challenge"
      he="משחק יומי"
      blurb="A single parking lot, fresh every day, identical for everyone who plays it. Solve it before tomorrow's lot drops."
      bullets={[
        "One lot per day, same for every player",
        "Your solve time counts toward your streak",
        "Straight from the same puzzle file as the regular games",
      ]}
      note={today ? `Today · ${today}` : undefined}
    />
  );
}
