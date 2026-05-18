import { useCallback, useEffect, useState } from "react";
import {
  ORDER_ALERT_SOUND_STORAGE_KEY,
  isOrderAlertSoundEnabled,
  playInStoreOrderAlertSound,
  playOnlineOrderAlertSound,
  setOrderAlertSoundEnabled,
  unlockOrderAlertAudio,
} from "@/utils/orderAlertSound.js";

export function useOrderAlertSound() {
  const [enabled, setEnabled] = useState(() => isOrderAlertSoundEnabled());

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === ORDER_ALERT_SOUND_STORAGE_KEY || e.key == null) {
        setEnabled(isOrderAlertSoundEnabled());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSoundEnabled = useCallback((next) => {
    setOrderAlertSoundEnabled(next);
    setEnabled(next);
    if (next) unlockOrderAlertAudio();
  }, []);

  const playOnline = useCallback(() => {
    playOnlineOrderAlertSound();
  }, []);

  const playInStore = useCallback(() => {
    playInStoreOrderAlertSound();
  }, []);

  const testSound = useCallback((kind) => {
    unlockOrderAlertAudio();
    if (kind === "IN_STORE") playInStoreOrderAlertSound({ force: true });
    else playOnlineOrderAlertSound({ force: true });
  }, []);

  return {
    enabled,
    setSoundEnabled,
    playOnline,
    playInStore,
    testSound,
    unlock: unlockOrderAlertAudio,
  };
}
