/** localStorage: "true" | "false" (default on) */
export const ORDER_ALERT_SOUND_STORAGE_KEY = "orderAlertSoundEnabled";

let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

export function isOrderAlertSoundEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ORDER_ALERT_SOUND_STORAGE_KEY) !== "false";
}

export function setOrderAlertSoundEnabled(enabled) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDER_ALERT_SOUND_STORAGE_KEY, enabled ? "true" : "false");
}

/** Browsers require a user gesture before audio can play. */
export function unlockOrderAlertAudio() {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

function playTone(frequency, startOffsetSec, durationSec, volume = 0.12) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime + startOffsetSec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

/** Đơn online / storefront */
export function playOnlineOrderAlertSound({ force = false } = {}) {
  if (!force && !isOrderAlertSoundEnabled()) return;
  unlockOrderAlertAudio();
  playTone(880, 0, 0.1);
  playTone(1175, 0.13, 0.16, 0.1);
}

/** Đơn tại bàn (QR) */
export function playInStoreOrderAlertSound({ force = false } = {}) {
  if (!force && !isOrderAlertSoundEnabled()) return;
  unlockOrderAlertAudio();
  playTone(740, 0, 0.09, 0.11);
  playTone(740, 0.16, 0.09, 0.11);
  playTone(988, 0.32, 0.14, 0.1);
}
