import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/competitions")({
  head: () => ({
    meta: [
      { title: "Competitions - Rush Hour Vanishing Cars (Coming Soon)" },
      {
        name: "description",
        content:
          "Timed head-to-head parking solves with a standings board. Not open yet.",
      },
      { property: "og:title", content: "Competitions - Rush Hour Vanishing Cars" },
      {
        property: "og:description",
        content: "Timed head-to-head parking solves with a standings board. Coming soon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Competitions,
});

function Competitions() {
  return (
    <ComingSoon
      Icon={Trophy}
      title="Competitions"
      he="תחרויות"
      blurb="Timed rounds where everyone gets the same lot and the clock. Fewest moves and fastest time take the spot on the board."
      bullets={[
        "Scheduled rounds you can join from the menu",
        "Standings by moves used, then by time",
        "Badges for every round you finish",
      ]}
    />
  );
}
