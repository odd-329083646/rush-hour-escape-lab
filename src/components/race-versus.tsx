import { PlayerAvatar } from "@/components/player-avatar";
import { blApi } from "@/engine/blApi";
import { useI18n } from "@/lib/i18n";

export function RaceVersus({
  players,
}: {
  players: { name: string; country: string; avatarId?: string | undefined }[];
}) {
  const { t, lang } = useI18n();
  return (
    <div className="race-versus" role="status" aria-label={t("raceVs")}>
      <div className="race-versus-lineup">
        {players.map((player, index) => (
          <div key={index} className="contents">
            {index === 1 && <strong className="race-vs-mark">{t("raceVs")}</strong>}
            <div className="race-contender">
              <PlayerAvatar avatarId={player.avatarId} className="race-avatar" />
              <h2>{player.name}</h2>
              <p>
                {blApi.profile.flag(player.country)}{" "}
                {blApi.profile.countries.find((country) => country.code === player.country)?.[
                  lang
                ] ?? player.country}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}