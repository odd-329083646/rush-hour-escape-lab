import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { blApi } from "@/engine/blApi";
import { useI18n } from "@/lib/i18n";

export function useMainMenu() {
  // Read after hydration: solves are stored on this device.
  const [dailySolved, setDailySolved] = useState(false);
  const { t } = useI18n();
  const navigate = useNavigate();
  const storage = blApi.ports.storage;

  useEffect(() => {
    if (!blApi.tutorial.hasSeen(storage)) {
      navigate({ to: "/tutorial", replace: true });
      return;
    }
    setDailySolved(blApi.dailyScores.isSolvedOn(blApi.game.todayKey(), storage));
  }, [navigate, storage]);

  return { dailySolved, t };
}