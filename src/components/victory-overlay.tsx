import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, Star, X } from "lucide-react";
import { LifeOfferDialog, type LifeOffer } from "@/components/life-offer";
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

const CONFETTI_COLORS = [
  "var(--toy-gold)",
  "var(--toy-red)",
  "var(--toy-blue)",
  "var(--primary)",
  "var(--toy-purple)",
  "var(--toy-yellow)",
];

/** Full-screen confetti burst that removes itself after the animation ends. */
export function Confetti({ pieces = 80, duration = 3200 }: { pieces?: number; duration?: number }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), duration + 600);
    return () => window.clearTimeout(id);
  }, [duration]);
  if (!visible) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 10) * 0.08}s`,
            animationDuration: `${duration / 1000 - (i % 5) * 0.25}s`,
            ["--drift" as string]: `${((i * 53) % 160) - 80}px`,
            ["--spin" as string]: `${360 + ((i * 97) % 540)}deg`,
          }}
        />
      ))}
    </div>
  );
}

export function VictoryOverlay({
  children,
  label,
  stars = 3,
  confetti = false,
}: {
  children: ReactNode;
  label: string;
  stars?: number;
  confetti?: boolean;
}) {
  const content = (
    <div className="victory-overlay">
      {confetti && <Confetti />}
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

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}

export function FailureOverlay({
  reason,
  onRetry,
  isDaily = false,
  life,
}: {
  reason: FailReason;
  onRetry: () => void;
  isDaily?: boolean;
  life?: LifeOffer;
}) {
  const { t } = useI18n();
  const [dismissedReason, setDismissedReason] = useState<FailReason>(null);

  useEffect(() => {
    if (!reason) setDismissedReason(null);
  }, [reason]);

  if (!reason) return null;

  const hasRecovery = !!(life && (life.options.moves || life.options.bump));
  const recoveryOpen = hasRecovery && dismissedReason !== reason;

  const message =
    reason === "bumps"
      ? t(isDaily ? "bumped3Daily" : "bumped3")
      : reason === "moves"
        ? t("tooManyMoves")
        : t("planWrong");

  return (
    <>
      {!recoveryOpen && (
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
      )}
      {life && (
        <LifeOfferDialog
          open={recoveryOpen}
          onOpenChange={(open) => {
            if (!open) setDismissedReason(reason);
          }}
          offer={life}
          preferred={reason === "bumps" ? "bump" : "moves"}
        />
      )}
    </>
  );
}
