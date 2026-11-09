import { getSavedProgress, type Level } from "./puzzles";

export type Profile = { username: string; country: string };
const KEY = "rush_hour_profile";

export const COUNTRIES: { code: string; en: string; he: string }[] = [
  { code: "IL", en: "Israel", he: "ישראל" },
  { code: "US", en: "United States", he: "ארצות הברית" },
  { code: "GB", en: "United Kingdom", he: "בריטניה" },
  { code: "FR", en: "France", he: "צרפת" },
  { code: "DE", en: "Germany", he: "גרמניה" },
  { code: "ES", en: "Spain", he: "ספרד" },
  { code: "IT", en: "Italy", he: "איטליה" },
  { code: "NL", en: "Netherlands", he: "הולנד" },
  { code: "RU", en: "Russia", he: "רוסיה" },
  { code: "UA", en: "Ukraine", he: "אוקראינה" },
  { code: "PL", en: "Poland", he: "פולין" },
  { code: "CA", en: "Canada", he: "קנדה" },
  { code: "MX", en: "Mexico", he: "מקסיקו" },
  { code: "BR", en: "Brazil", he: "ברזיל" },
  { code: "AR", en: "Argentina", he: "ארגנטינה" },
  { code: "IN", en: "India", he: "הודו" },
  { code: "CN", en: "China", he: "סין" },
  { code: "JP", en: "Japan", he: "יפן" },
  { code: "KR", en: "South Korea", he: "דרום קוריאה" },
  { code: "AU", en: "Australia", he: "אוסטרליה" },
  { code: "ZA", en: "South Africa", he: "דרום אפריקה" },
  { code: "TR", en: "Turkey", he: "טורקיה" },
  { code: "GR", en: "Greece", he: "יוון" },
  { code: "AE", en: "United Arab Emirates", he: "איחוד האמירויות" },
];

/** Converts an ISO country code into its flag emoji. */
export function flag(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function randomUsername(rand: () => number = Math.random): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "Player_" + Array.from({ length: 4 }, () => chars[Math.floor(rand() * chars.length)]).join("");
}

/** Loads the profile, creating and saving a random username on first load. */
export function getProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Profile>;
      if (p.username) return { username: p.username, country: p.country ?? "" };
    }
  } catch { /* fall through */ }
  const p = { username: randomUsername(), country: "" };
  saveProfile(p);
  return p;
}

export function saveProfile(p: Profile) {
  const username = p.username.trim().slice(0, 24) || randomUsername();
  localStorage.setItem(KEY, JSON.stringify({ ...p, username }));
  localStorage.setItem("player_name", username);
}

/** Best time (seconds) and fewest moves across all solved puzzles of a level. */
export function levelBests(level: Level): { bestTime: number | null; bestMoves: number | null } {
  const stats = Object.values(getSavedProgress(level)).filter((s) => s && s.stars > 0);
  if (!stats.length) return { bestTime: null, bestMoves: null };
  return {
    bestTime: Math.min(...stats.map((s) => s.bestTime)),
    bestMoves: Math.min(...stats.map((s) => s.bestMoves)),
  };
}
