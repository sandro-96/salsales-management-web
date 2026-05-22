/** @type {string} */
let baseTitle = "";

/** @type {number} */
let pendingGuestCount = 0;

/** @type {ReturnType<typeof setInterval> | null} */
let flashTimer = null;

/** @type {boolean} */
let flashHighlight = false;

function formatCount(n) {
  if (n <= 0) return "";
  return n > 99 ? "99+" : String(n);
}

function titleWithCount(count, highlight = false) {
  const c = formatCount(count);
  if (!c) return baseTitle;
  const bell = highlight ? "🔔 " : "";
  return `(${c}) ${bell}${baseTitle}`;
}

function applyStaticTitle() {
  document.title = titleWithCount(pendingGuestCount, false);
}

function stopFlash() {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
  }
  flashHighlight = false;
}

/**
 * Tiêu đề trang gốc (từ RouteWithTitle), không gồm prefix đếm đơn.
 * @param {string} title
 */
export function setBrowserTabBaseTitle(title) {
  baseTitle = title || "";
  if (!flashTimer) applyStaticTitle();
}

/** @param {number} count — đơn PENDING từ khách (online + QR bàn) */
export function setBrowserTabPendingCount(count) {
  pendingGuestCount = Math.max(0, Number(count) || 0);
  if (!flashTimer) applyStaticTitle();
}

/**
 * Nhấp nháy tiêu đề tab khi có đơn mới (chủ yếu khi tab trình duyệt đang ẩn).
 */
export function pulseBrowserTabOnNewOrder() {
  if (!baseTitle) return;

  if (document.visibilityState === "visible") {
    stopFlash();
    applyStaticTitle();
    return;
  }

  stopFlash();
  let tick = 0;
  flashHighlight = true;
  flashTimer = setInterval(() => {
    document.title =
      tick % 2 === 0
        ? titleWithCount(pendingGuestCount, true)
        : titleWithCount(pendingGuestCount, false);
    tick += 1;
    if (tick >= 14) {
      stopFlash();
      applyStaticTitle();
    }
  }, 700);
}

export function clearBrowserTabOrderAlert() {
  pendingGuestCount = 0;
  stopFlash();
  if (baseTitle) document.title = baseTitle;
}
