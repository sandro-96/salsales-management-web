import imageCompression from "browser-image-compression";

/** Cho `<input accept>` — mobile gallery/camera (kể cả HEIC). */
export const PRODUCT_IMAGE_ACCEPT = "image/*";

const HEIC_EXT = /\.(heic|heif)$/i;
const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif"]);
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
  if (HEIC_MIME_TYPES.has(mime)) return true;
  if (!STANDARD_TYPES.has(mime)) return true;
  if (HEIC_EXT.test(file.name || "")) return true;
  return false;
}

async function isHeicLike(file) {
  const mime = resolveImageMime(file);
  if (HEIC_MIME_TYPES.has(mime) || HEIC_EXT.test(file?.name || "")) {
    return true;
  }

  try {
    const { isHeic } = await import("heic-to");
    return await isHeic(file);
  } catch {
    return false;
  }
}

async function convertHeicToJpegFile(file) {
  const { heicTo } = await import("heic-to");
  const blob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.85,
  });

  const base = (file.name || "image").replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

/**
 * Chuẩn hóa ảnh chọn từ mobile/desktop: JPEG để preview + upload ổn định.
 * HEIC/HEIF được convert riêng trước vì browser-image-compression không decode tốt.
 * useWebWorker: false — tránh lỗi trên Safari / WebView Android.
 */
export async function prepareProductImageFile(file) {
  if (!isProductImageFile(file)) {
    throw new Error("unsupported");
  }

  const normalizedFile = (await isHeicLike(file))
    ? await convertHeicToJpegFile(file)
    : file;

  const shouldCompress =
    needsJpegConversion(normalizedFile) || normalizedFile.size > 2 * 1024 * 1024;

  if (!shouldCompress && STANDARD_TYPES.has(resolveImageMime(normalizedFile))) {
    return normalizedFile;
  }

  const blob = await imageCompression(normalizedFile, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: false,
    fileType: "image/jpeg",
    initialQuality: 0.85,
  });

  const base =
    (normalizedFile.name || file.name || "image").replace(/\.[^.]+$/, "") ||
    "image";
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
