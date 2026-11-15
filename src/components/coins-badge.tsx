import { Coins } from "lucide-react";
import { useCoins } from "@/hooks/useCoins";
import { useI18n } from "@/lib/i18n";

interface CoinsBadgeProps {
  className?: string;
}

export function CoinsBadge({ className = "" }: CoinsBadgeProps) {
  const coins = useCoins();
  const { t } = useI18n();

  return (
    <div
      className={`chip coins-badge font-display flex items-center gap-1.5 px-2.5 py-1 shrink-0 ${className}`}
      title={t("coins")}
    >
      <Coins className="h-4 w-4 shrink-0" />
      <span className="font-bold">{coins}</span>
    </div>
  );
}
