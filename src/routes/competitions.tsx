import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
  return (
    <ComingSoon
      Icon={Trophy}
      title={t("competitions")}
      blurb={t("compBlurb")}
      bullets={[t("compB1"), t("compB2"), t("compB3")]}
    />
  );
}
