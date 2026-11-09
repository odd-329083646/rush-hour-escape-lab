import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { SettingsButton } from "@/components/settings-dialog";

type Props = {
  Icon: LucideIcon;
  title: string;
  blurb: string;
  bullets: string[];
  note?: string | undefined;
};

export function ComingSoon({ Icon, title, blurb, bullets, note }: Props) {
  const { t } = useI18n();
  return (
    <main className="lot-bg flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-10">
      <header className="flex w-full max-w-lg items-center justify-between">
        <Button asChild variant="ghost" className="chip px-3">
          <Link to="/" aria-label={t("backMenu")} title={t("backMenu")}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{t("menu")}</span>
          </Link>
        </Button>
        <SettingsButton />
      </header>

      <section className="panel w-full max-w-lg text-center">
        <span className="soon-icon">
          <Icon className="h-8 w-8" />
        </span>

        <p className="mx-auto mt-4 w-fit">
          <span className="chip text-xs">{t("comingSoon")}</span>
        </p>

        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {blurb}
        </p>

        {note && (
          <p className="mx-auto mt-4 w-fit font-display text-sm text-primary">{note}</p>
        )}

        <ul className="mx-auto mt-5 flex max-w-xs flex-col items-start gap-2 text-start text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-muted-foreground">{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="execute">
            <Link to="/play">{t("playRegular")}</Link>
          </Button>
          <Button asChild variant="ghost" className="chip justify-center">
            <Link to="/">{t("backMenu")}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
