import { useEffect, useState } from "react";
import { Coins, Play, ShieldOff, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { LifeOption } from "@/engine/life";
import { useI18n } from "@/lib/i18n";

export type LifeOffer = {
  cost: number;
  coins: number;
  options: Record<LifeOption, boolean>;
  buy: (option: LifeOption) => boolean;
};

const CHOICES = [
  { option: "moves", Icon: Undo2, title: "lifeMovesTitle", desc: "lifeMovesDesc" },
  { option: "bump", Icon: ShieldOff, title: "lifeBumpTitle", desc: "lifeBumpDesc" },
] as const;

/** Presentation only: the game hook decides availability and applies the chosen recovery. */
export function LifeOfferDialog({
  open,
  onOpenChange,
  offer,
  preferred,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: LifeOffer;
  preferred: LifeOption;
}) {
  const { t } = useI18n();
  const [choice, setChoice] = useState<LifeOption | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!open) return;
    setError(false);
    setChoice(offer.options[preferred] ? preferred : offer.options.moves ? "moves" : offer.options.bump ? "bump" : null);
  }, [open]);
  const affordable = offer.coins >= offer.cost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="ltr"
        aria-describedby="life-offer-desc"
        className="life-offer max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-auto rounded-lg [&>button:last-child]:hidden"
      >
        <div className="flex items-center justify-between gap-2">
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" /> {t("lifeTitle")}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label={t("close")}>
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>
        <p id="life-offer-desc" dir="auto" className="text-sm text-muted-foreground">
          {t("lifeIntro")}
        </p>
        <div role="radiogroup" aria-label={t("lifeTitle")} className="grid gap-2 sm:grid-cols-2">
          {CHOICES.map(({ option, Icon, title, desc }) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={choice === option}
              disabled={!offer.options[option]}
              onClick={() => setChoice(option)}
              className="life-option"
            >
              <Icon className="h-6 w-6 shrink-0 text-primary" />
              <span className="font-display text-base" dir="auto">{t(title)}</span>
              <span className="text-xs text-muted-foreground" dir="auto">{t(desc)}</span>
            </button>
          ))}
        </div>
        <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <Coins className="h-4 w-4" /> {t("lifeBalance", { coins: offer.coins })}
        </p>
        {(error || !affordable) && (
          <p role="status" className="text-center text-sm text-destructive">
            {t("lifeNoCoins")}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <DialogClose asChild>
            <Button variant="ghost" className="chip flex-1">{t("cancel")}</Button>
          </DialogClose>
          <Button
            className="flex-1"
            disabled={!choice || !affordable}
            onClick={() => {
              if (choice && offer.buy(choice)) onOpenChange(false);
              else setError(true);
            }}
          >
            <Play className="h-4 w-4" /> {t("lifeBuy", { n: offer.cost })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
