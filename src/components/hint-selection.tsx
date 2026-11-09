import { useState } from "react";
import { ArrowRight, Coins, Eye, ScanEye, ListChecks, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n, type TKey } from "@/lib/i18n";
import { HINT_COSTS, hintAvailable, type HintType, type PlannedMove } from "@/lib/hints";
import { type Car, type Level } from "@/lib/puzzles";

const OPTIONS: { type: HintType; title: TKey; Icon: typeof Eye }[] = [
  { type: "next", title: "hintNext", Icon: ArrowRight },
  { type: "peek", title: "hintPeek", Icon: ScanEye },
  { type: "reveal", title: "hintReveal", Icon: Eye },
  { type: "validate", title: "hintValidate", Icon: ListChecks },
];

export function HintSelection({ open, onOpenChange, level, cars, hidden, plan = [], coins, onUse }: {
  open: boolean; onOpenChange: (open: boolean) => void; level: Level; cars: Car[]; hidden: Set<string>;
  plan?: PlannedMove[]; coins: number; onUse: (type: HintType, id?: string) => string | void;
}) {
  const { t } = useI18n();
  const [selecting, setSelecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const use = (type: HintType, id?: string) => {
    const response = onUse(type, id);
    if (response) setMessage(response);
    else onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={(value) => { setSelecting(false); setMessage(null); onOpenChange(value); }}>
    <DialogContent dir="ltr" aria-describedby={undefined} className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-auto rounded-lg [&>button:last-child]:hidden">
      <div className="flex items-center justify-between gap-2">
        <DialogTitle>{t(selecting ? "hintSelectCar" : "hintSelection")}</DialogTitle>
        <DialogClose asChild><Button variant="ghost" size="icon" aria-label={t("close")}><X className="h-4 w-4" /></Button></DialogClose>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Coins className="h-4 w-4" />{coins}</p>
      {selecting ? <div className="grid grid-cols-4 gap-2">
        {cars.filter((c) => hidden.has(c.id)).map((c) => <Button key={c.id} variant="outline" onClick={() => use("reveal", c.id)}>{c.id}</Button>)}
      </div> : <div className="flex flex-col gap-2">
        {OPTIONS.map(({ type, title, Icon }) => <Button key={type} variant="outline" className="h-auto justify-start gap-3 whitespace-normal py-3 text-start"
          disabled={!hintAvailable(type, level, hidden, plan) || coins < HINT_COSTS[type]}
          onClick={() => type === "reveal" ? setSelecting(true) : use(type)}>
          <Icon className="h-5 w-5 shrink-0 text-primary" /><span className="flex-1">{t(title)}</span>
          <span className="flex items-center gap-1"><Coins className="h-4 w-4" />{HINT_COSTS[type]}</span>
        </Button>)}
      </div>}
      {message && <p role="status" className="text-sm text-primary">{message}</p>}
    </DialogContent>
  </Dialog>;
}