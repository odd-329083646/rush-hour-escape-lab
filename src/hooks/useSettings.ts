import { useSyncExternalStore } from "react";
import {
  getPanelsVisible,
  setPanelsVisible,
  getControlSetting,
  setControlSetting,
  storageService,
} from "@/services/storageService";

const readDrag = () => getControlSetting("dragEnabled");
const readKeyboard = () => getControlSetting("keyboardEnabled");
const defaultOn = () => true;
const setDragEnabled = (enabled: boolean) => setControlSetting("dragEnabled", enabled);
const setKeyboardEnabled = (enabled: boolean) => setControlSetting("keyboardEnabled", enabled);

export function useSettings() {
  const dragEnabled = useSyncExternalStore(storageService.subscribe, readDrag, defaultOn);
  const keyboardEnabled = useSyncExternalStore(storageService.subscribe, readKeyboard, defaultOn);
  const panelsVisible = useSyncExternalStore(storageService.subscribe, getPanelsVisible, defaultOn);
  return {
    panelsVisible,
    setPanelsVisible,
    dragEnabled,
    keyboardEnabled,
    setDragEnabled,
    setKeyboardEnabled,
  };
}
