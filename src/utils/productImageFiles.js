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

/**
 * Tạo URL preview ổn định cho ảnh.
 *
 * Trên mobile WebKit (iOS Safari, WebView Android), blob URL sinh từ
 * `URL.createObjectURL` lên các Blob xuất từ canvas (qua
 * `browser-image-compression` / `heic-to`) đôi khi không render được trong
 * `<img>` (gallery hiện icon ảnh hỏng) dù file vẫn upload hợp lệ. Để preview
 * luôn hiển thị, ta đọc thẳng nội dung file thành data URL bằng `FileReader`
 * — cách này tự chứa dữ liệu nên không phụ thuộc vòng đời Blob.
 *
 * Có fallback về `URL.createObjectURL` nếu `FileReader` không khả dụng.
 *
 * @param {Blob | File} file
 * @returns {Promise<string>}
 */
export function createImagePreviewUrl(file) {
  if (!file) return Promise.resolve("");
  if (typeof FileReader === "undefined") {
    try {
      return Promise.resolve(URL.createObjectURL(file));
    } catch {
      return Promise.resolve("");
    }
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string" && result.length > 0) {
        resolve(result);
        return;
      }
      try {
        resolve(URL.createObjectURL(file));
      } catch {
        resolve("");
      }
    };
    reader.onerror = () => {
      console.warn("createImagePreviewUrl: FileReader failed", reader.error);
      try {
        resolve(URL.createObjectURL(file));
      } catch {
        resolve("");
      }
    };
    try {
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("createImagePreviewUrl: readAsDataURL threw", err);
      try {
        resolve(URL.createObjectURL(file));
      } catch {
        resolve("");
      }
    }
  });
}

/**
 * Tạo nhiều preview URL song song. Giữ thứ tự đầu vào.
 * @param {Array<Blob | File>} files
 * @returns {Promise<string[]>}
 */
export function createImagePreviewUrls(files) {
  if (!Array.isArray(files) || files.length === 0) return Promise.resolve([]);
  return Promise.all(files.map((f) => createImagePreviewUrl(f)));
}

/** Preview nhẹ cho thumbnail biến thể (blob URL — thu hồi khi xóa / unmount). */
export function createVariantThumbnailPreviewUrls(files) {
  if (!Array.isArray(files) || files.length === 0) return [];
  return files.map((f) => {
    try {
      return URL.createObjectURL(f);
    } catch {
      return "";
    }
  });
}
