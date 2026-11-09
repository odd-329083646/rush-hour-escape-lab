import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isSolvedOn } from "@/engine/daily-scores";
import { todayKey } from "@/engine/game";
import { hasSeenTutorial } from "@/engine/tutorial";
import { useI18n } from "@/lib/i18n";
export function useMainMenu() {
  // Read after hydration: solves are stored on this device.
  const [dailySolved, setDailySolved] = useState(false);
  const { t } = useI18n();
  const navigate = useNavigate();
  useEffect(() => {
    if (!hasSeenTutorial()) { navigate({ to: "/tutorial", replace: true }); return; }
    setDailySolved(isSolvedOn(todayKey()));
  }, [navigate]);
  return { dailySolved, t };
}
