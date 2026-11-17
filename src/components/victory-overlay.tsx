import type { ReactNode } from "react";
import { RotateCcw, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export type FailReason = "bumps" | "moves" | "plan" | null;

export function VictoryStars({ earned = 3 }: { earned?: number }) {
  return (
    <div className="victory-stars" aria-hidden="true">
      {[1, 2, 3].map((star) => (
        <Star key={star} className={star <= earned ? "star-earned" : "star-empty"} />
      ))}
    </div>
  );
}

export function VictoryOverlay({ children, label, stars = 3 }: { children: ReactNode; label: string; stars?: number }) {
  return (
    <div className="victory-overlay">
      <div className="victory-sparkles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
      <section className="victory-banner" role="dialog" aria-modal="true" aria-label={label}>
        <VictoryStars earned={stars} />
        {children}
      </section>
    </div>
  );
}

export function FailureOverlay({
  reason,
  onRetry,
  isDaily = false,
}: {
  reason: FailReason;
  onRetry: () => void;
  isDaily?: boolean;
}) {
  const { t } = useI18n();

  if (!reason) return null;

  const message =
    reason === "bumps"
      ? t(isDaily ? "bumped3Daily" : "bumped3")
      : reason === "moves"
      ? t("tooManyMoves")
      : t("planWrong");

  return (
    <div className="win flex-col gap-2 text-center">
      <X className="h-12 w-12 text-destructive" />
      <span className="text-3xl text-destructive">{t("oops")}</span>
      <span className="text-base text-muted-foreground">{message}</span>
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" onClick={onRetry} className="chip">
          <RotateCcw className="h-4 w-4" /> {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
