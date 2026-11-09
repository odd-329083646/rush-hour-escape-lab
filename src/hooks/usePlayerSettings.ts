import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getProfile, saveProfile, levelBests } from "@/engine/profile";
import { LEVELS, type Level } from "@/engine/game";
import { tournamentStats } from "@/engine/tournament-device";
export function usePlayerSettings() {
  const { t, lang } = useI18n();
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { const p = getProfile(); setUsername(p.username); setCountry(p.country); }, []);

  const commit = (u = username, c = country) => { saveProfile({ username: u, country: c }); setUsername(getProfile().username); setSaved(true); };

  const stats = (Object.keys(LEVELS) as Level[]).map((level) => ({ level, ...levelBests(level) }));
  return { t, lang, username, setUsername, country, setCountry, saved, setSaved, commit, stats, raceStats: tournamentStats() };
}
