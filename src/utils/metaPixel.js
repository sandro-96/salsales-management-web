const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
const META_TEST_EVENT_CODE = import.meta.env.VITE_META_TEST_EVENT_CODE;

function getAdvancedMatching() {
  const raw = import.meta.env.VITE_META_ADVANCED_MATCHING;
  if (!raw || typeof raw !== "string") return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    return obj;
  } catch {
    return null;
  }
}

function ensureFbqLoaded() {
  if (typeof window === "undefined") return false;
  if (!META_PIXEL_ID || !String(META_PIXEL_ID).trim()) return false;
  if (window.fbq) return true;

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js",
  );

  const advancedMatching = getAdvancedMatching();
  if (advancedMatching) {
    window.fbq("init", META_PIXEL_ID, advancedMatching);
  } else {
    window.fbq("init", META_PIXEL_ID);
  }

  return true;
}

function withTestEvent(params) {
  if (!META_TEST_EVENT_CODE || !String(META_TEST_EVENT_CODE).trim()) return params;
  const next = { ...(params || {}) };
  next.eventID = next.eventID || undefined;
  next.test_event_code = META_TEST_EVENT_CODE;
  return next;
}

export function metaTrack(eventName, params) {
  if (!ensureFbqLoaded()) return;
  try {
    window.fbq("track", eventName, withTestEvent(params));
  } catch {
    // ignore
  }
}

export function metaTrackCustom(eventName, params) {
  if (!ensureFbqLoaded()) return;
  try {
    window.fbq("trackCustom", eventName, withTestEvent(params));
  } catch {
    // ignore
  }
}

export function metaPageView(extra) {
  if (!ensureFbqLoaded()) return;
  try {
    window.fbq("track", "PageView", withTestEvent(extra));
  } catch {
    // ignore
  }
}

