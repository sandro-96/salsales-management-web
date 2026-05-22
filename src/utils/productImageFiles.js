import imageCompression from "browser-image-compression";

/** Cho `<input accept>` — mobile gallery/camera (kể cả HEIC). */
export const PRODUCT_IMAGE_ACCEPT = "image/*";

const STANDARD_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i;

function mimeFromName(name = "") {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (/\.(heic|heif)$/.test(lower)) return "image/heic";
  if (/\.jpe?g$/.test(lower)) return "image/jpeg";
  return "";
}

/** Mobile thường để `file.type` rỗng — suy từ tên file. */
export function resolveImageMime(file) {
  const t = (file?.type || "").toLowerCase().trim();
  if (t) return t;
  return mimeFromName(file?.name || "");
}

export function isProductImageFile(file) {
  if (!file) return false;
  const mime = resolveImageMime(file);
  if (mime.startsWith("image/")) return true;
  return IMAGE_EXT.test(file.name || "");
}

function needsJpegConversion(file) {
  const mime = resolveImageMime(file);
  if (mime === "image/heic" || mime === "image/heif") return true;
  if (!STANDARD_TYPES.has(mime)) return true;
  if (/\.(heic|heif)$/i.test(file.name || "")) return true;
  return false;
}

/**
 * Chuẩn hóa ảnh chọn từ mobile/desktop: JPEG để preview + upload ổn định.
 * useWebWorker: false — tránh lỗi trên Safari / WebView Android.
 */
export async function prepareProductImageFile(file) {
  if (!isProductImageFile(file)) {
    throw new Error("unsupported");
  }

  const shouldCompress =
    needsJpegConversion(file) || file.size > 2 * 1024 * 1024;

  if (!shouldCompress && STANDARD_TYPES.has(resolveImageMime(file))) {
    return file;
  }

  const blob = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: false,
    fileType: "image/jpeg",
    initialQuality: 0.85,
  });

  const base = (file.name || "image").replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

/**
 * @returns {{ ok: File[], rejected: File[] }}
 */
export async function prepareProductImageFiles(files) {
  const ok = [];
  const rejected = [];
  for (const f of files) {
    if (!isProductImageFile(f)) {
      rejected.push(f);
      continue;
    }
    try {
      ok.push(await prepareProductImageFile(f));
    } catch (err) {
      console.warn("prepareProductImageFile failed", f.name, err);
      rejected.push(f);
    }
  }
  return { ok, rejected };
}
