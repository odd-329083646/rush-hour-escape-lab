import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AVATARS, DEFAULT_AVATAR_ID } from "@/config/avatars";
import { getProfile, getPlayerRecords, saveProfile, validateUsername, type Profile } from "@/engine/profile";
import { storageService } from "@/services/storageService";
import { ensureGuestCredential } from "@/services/supabaseService";
import { registerTournamentGuest, syncTournamentProfile } from "@/lib/tournament.functions";
import { useI18n } from "@/lib/i18n";

export function useProfile() {
  const { t, lang } = useI18n();
  const [profile, setProfile] = useState<Profile>({ username: "", country: "", avatarId: DEFAULT_AVATAR_ID });
  const [records, setRecords] = useState({ standardCompleted: 0, dailySolved: 0, wins: 0, losses: 0, coins: 0 });
  const [username, setUsername] = useState("");
  useEffect(() => {
    const refresh = () => { setProfile(getProfile()); setRecords(getPlayerRecords()); };
    refresh(); setUsername(getProfile().username);
    return storageService.subscribe(refresh);
  }, []);
  function updateUsername(value: string) {
    const valid = validateUsername(value);
    if (!valid) { toast.error(t("usernameInvalid")); return false; }
    saveProfile({ ...getProfile(), username: valid }); setUsername(valid); toast.success(t("profileSaved")); return true;
  }
  function updateAvatar(avatarId: string) {
    if (!AVATARS.some((avatar) => avatar.id === avatarId)) return;
    saveProfile({ ...getProfile(), avatarId });
  }
  return { t, lang, profile, records, username, setUsername, updateUsername, updateAvatar };
}

/** One app-wide subscription coalesces edits; durable device state is the retry source. */
export function useProfileSync() {
  const register = useServerFn(registerTournamentGuest);
  const sync = useServerFn(syncTournamentProfile);
  useEffect(() => {
    let timer: number | undefined;
    let active = true;
    let inFlight = false;
    let lastSynced = "";
    const payload = () => {
      const { standardCompleted, dailySolved } = getPlayerRecords();
      return { profile: getProfile(), records: { standardCompleted, dailySolved } };
    };
    const schedule = () => {
      if (!active || inFlight) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { void flush(); }, 350);
    };
    async function flush() {
      const data = payload(); const signature = JSON.stringify(data);
      if (signature === lastSynced || inFlight || !navigator.onLine) return;
      inFlight = true;
      try {
        const credential = await ensureGuestCredential(register);
        await sync({ data: { credential, ...data } });
        lastSynced = signature;
      } catch { /* Keep device edits; retry on focus, reconnect, or the next edit. */ }
      finally { inFlight = false; if (active && JSON.stringify(payload()) !== signature) schedule(); }
    }
    schedule();
    const unsubscribe = storageService.subscribe(schedule);
    window.addEventListener("online", schedule); window.addEventListener("focus", schedule);
    return () => { active = false; window.clearTimeout(timer); unsubscribe(); window.removeEventListener("online", schedule); window.removeEventListener("focus", schedule); };
  }, [register, sync]);
}