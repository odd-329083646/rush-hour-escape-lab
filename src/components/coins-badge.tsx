import { Coins } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface CoinsBadgeProps {
  coins: number;
  className?: string;
}

export function CoinsBadge({ coins, className = "" }: CoinsBadgeProps) {
  const { t } = useI18n();

  return (
    <div
      className={`chip font-display flex items-center gap-1.5 px-2.5 py-1 text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-full shrink-0 ${className}`}
      title={t("coins")}
    >
      <Coins className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
      <span className="font-bold">{coins}</span>
    </div>
  );
}
