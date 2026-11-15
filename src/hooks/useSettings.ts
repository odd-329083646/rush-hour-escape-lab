import { useSyncExternalStore } from "react";
import { getControlSetting, setControlSetting, storageService } from "@/services/storageService";

const readDrag = () => getControlSetting("dragEnabled");
const readKeyboard = () => getControlSetting("keyboardEnabled");
const defaultOn = () => true;
const setDragEnabled = (enabled: boolean) => setControlSetting("dragEnabled", enabled);
const setKeyboardEnabled = (enabled: boolean) => setControlSetting("keyboardEnabled", enabled);

export function useSettings() {
  const dragEnabled = useSyncExternalStore(storageService.subscribe, readDrag, defaultOn);
  const keyboardEnabled = useSyncExternalStore(storageService.subscribe, readKeyboard, defaultOn);
  return { dragEnabled, keyboardEnabled, setDragEnabled, setKeyboardEnabled };
}
