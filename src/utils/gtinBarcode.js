/**
 * Chuẩn hoá / kiểm tra GTIN (EAN-8, UPC-A 12, EAN-13, GTIN-14) — khớp logic backend GtinBarcodeValidator.
 */

export function normalizeBarcodeDigits(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).replace(/\D/g, "");
  return s.length ? s : null;
}

export function computeGs1CheckDigit(dataDigitsOnly) {
  let sum = 0;
  const len = dataDigitsOnly.length;
  for (let i = len - 1; i >= 0; i--) {
    const d = dataDigitsOnly.charCodeAt(i) - 48;
    const posFromRight = len - 1 - i;
    const weight = posFromRight % 2 === 0 ? 3 : 1;
    sum += d * weight;
  }
  return (10 - (sum % 10)) % 10;
}

export function verifyGs1CheckDigit(fullWithCheck) {
  if (!fullWithCheck || fullWithCheck.length < 2) return false;
  if (!/^\d+$/.test(fullWithCheck)) return false;
  const body = fullWithCheck.slice(0, -1);
  const expected = computeGs1CheckDigit(body);
  const actual = parseInt(fullWithCheck.slice(-1), 10);
  return expected === actual;
}

/** Độ dài chuẩn GS1 và đúng checksum */
export function isValidStandardGs1Barcode(raw) {
  const n = normalizeBarcodeDigits(raw);
  if (!n) return false;
  const len = n.length;
  if (len !== 8 && len !== 12 && len !== 13 && len !== 14) return false;
  return verifyGs1CheckDigit(n);
}

/** Giá trị lưu (UPC-12 hợp lệ → thêm 0 đầu). Trả null nếu rỗng. Ném Error nếu sai checksum chuẩn GS1. */
export function resolveBarcodeForSave(raw) {
  const n = normalizeBarcodeDigits(raw);
  if (!n) return null;
  const len = n.length;
  if (len === 8 || len === 12 || len === 13 || len === 14) {
    if (!verifyGs1CheckDigit(n)) {
      const err = new Error("BARCODE_INVALID_GSIN");
      err.code = "BARCODE_INVALID_GSIN";
      throw err;
    }
    if (len === 12) return `0${n}`;
  }
  return n;
}

export function buildBarcodeLookupCandidates(raw) {
  const n = normalizeBarcodeDigits(raw);
  if (!n) return [];
  const out = [];
  const seen = new Set();
  const add = (v) => {
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  };
  add(n);
  if (n.length === 13 && n.startsWith("0")) add(n.slice(1));
  if (n.length === 12) add(`0${n}`);
  return out;
}
