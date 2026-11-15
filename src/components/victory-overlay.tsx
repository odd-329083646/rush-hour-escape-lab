import type { ReactNode } from "react";
import { Star } from "lucide-react";

export function VictoryStars({ earned = 3 }: { earned?: number }) {
  return (
    <div className="victory-stars" aria-hidden="true">
      {[1, 2, 3].map((star) => <Star key={star} className={star <= earned ? "star-earned" : "star-empty"} />)}
    </div>
  );
}

export function VictoryOverlay({ children, label, stars = 3 }: { children: ReactNode; label: string; stars?: number }) {
  return (
    <div className="victory-overlay">
      <div className="victory-sparkles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => <i key={index} />)}
      </div>
      <section className="victory-banner" role="dialog" aria-modal="true" aria-label={label}>
        <VictoryStars earned={stars} />
        {children}
      </section>
    </div>
  );
}