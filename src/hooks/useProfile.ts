import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AVATARS, DEFAULT_AVATAR_ID } from "@/config/avatars";
import { validateUsername, type Profile } from "@/engine/profile";
import { blApi } from "@/engine/blApi";
import { initializeStorage, storageService } from "@/services/storageService";
import { registerTournamentGuest, syncTournamentProfile } from "@/lib/tournament.functions";
import { LEVELS, type Level } from "@/engine/game";
import { useI18n } from "@/lib/i18n";

export function useProfile() {
  const { t, lang } = useI18n();
  const storage = blApi.ports.storage;
  const [profile, setProfile] = useState<Profile>({
    username: "",
    country: "",
    avatarId: DEFAULT_AVATAR_ID,
  });
  const [records, setRecords] = useState({
    standardCompleted: 0,
    dailySolved: 0,
    worldRecords: 0,
    wins: 0,
    losses: 0,
    coins: 0,
  });
  const [username, setUsername] = useState("");
  useEffect(() => {
    const refresh = () => {
      setProfile(blApi.profile.getProfile(storage));
      setRecords(blApi.profile.getPlayerRecords(storage));
    };
    refresh();
    setUsername(blApi.profile.getProfile(storage).username);
    return storageService.subscribe(refresh);
  }, [storage]);
  function updateUsername(value: string) {
    // Callers navigate home after a successful save.
    const valid = validateUsername(value);
    if (!valid) {
      toast.error(t("usernameInvalid"));
      return false;
    }
    blApi.profile.saveProfile({ ...blApi.profile.getProfile(storage), username: valid }, storage);
    setUsername(valid);
    toast.success(t("profileSaved"));
    return true;
  }
  function updateAvatar(avatarId: string) {
    if (!AVATARS.some((avatar) => avatar.id === avatarId)) return;
    blApi.profile.saveProfile({ ...blApi.profile.getProfile(storage), avatarId }, storage);
  }
  function updateCountry(country: string) {
    if (country !== "" && !blApi.profile.countries.some((item) => item.code === country)) return;
    blApi.profile.saveProfile({ ...blApi.profile.getProfile(storage), country }, storage);
  }
  const bests = (Object.keys(LEVELS) as Level[]).map((level) => ({
    level,
    ...blApi.profile.levelBests(level, storage),
  }));
  return {
    t,
    lang,
    profile,
    records,
    bests,
    username,
    setUsername,
    updateUsername,
    updateAvatar,
    updateCountry,
  };
}

/** One app-wide subscription coalesces edits; durable device state is the retry source. */
export function useProfileSync() {
  const register = useServerFn(registerTournamentGuest);
  const sync = useServerFn(syncTournamentProfile);
  const storage = blApi.ports.storage;
  useEffect(() => {
    initializeStorage();
    let timer: number | undefined;
    let active = true;
    let inFlight = false;
    let lastSynced = "";
    const payload = () => {
      const { standardCompleted, dailySolved } = blApi.profile.getPlayerRecords(storage);
      return { profile: blApi.profile.getProfile(storage), records: { standardCompleted, dailySolved } };
    };
    const schedule = () => {
      if (!active || inFlight) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void flush();
      }, 350);
    };
    async function flush() {
      const data = payload();
      const signature = JSON.stringify(data);
      if (signature === lastSynced || inFlight || !navigator.onLine) return;
      inFlight = true;
      try {
        const credential = await blApi.tournament.ensureGuestCredential(register, storage);
        await sync({ data: { credential, ...data } });
        lastSynced = signature;
      } catch {
        /* Keep device edits; retry on focus, reconnect, or the next edit. */
      } finally {
        inFlight = false;
        if (active && JSON.stringify(payload()) !== signature) schedule();
      }
    }
    schedule();
    const unsubscribe = storageService.subscribe(schedule);
    window.addEventListener("online", schedule);
    window.addEventListener("focus", schedule);
    return () => {
      active = false;
      window.clearTimeout(timer);
      unsubscribe();
      window.removeEventListener("online", schedule);
      window.removeEventListener("focus", schedule);
    };
  }, [register, sync, storage]);
}