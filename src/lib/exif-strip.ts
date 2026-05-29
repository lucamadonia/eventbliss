/**
 * EXIF stripping helper — re-encodes image files via Canvas to remove all
 * EXIF metadata including GPS coordinates, camera serial numbers, owner
 * info and creation timestamps.
 *
 * GDPR Art. 32 hardening — privacy policy action item 0.8.
 *
 * Non-image files pass through unchanged. HEIC/HEIF on browsers without
 * native decoding pass through (mobile Safari decodes natively; Chrome
 * does not — for now we accept the trade-off).
 */

const IMAGE_MIME_PREFIX = "image/";
const PASSTHROUGH_MIME = new Set([
  "image/svg+xml", // vector — no EXIF; canvas would rasterize
  "image/gif", // animated — canvas would freeze first frame
  "image/heic", // browsers vary; safer to passthrough
  "image/heif",
]);

export interface StripExifOptions {
  /** Output MIME type. Defaults to image/jpeg (smallest, lossy) or image/png (lossless) based on alpha. */
  outputType?: "image/jpeg" | "image/png" | "image/webp";
  /** JPEG/WebP quality 0..1. Default 0.92. */
  quality?: number;
  /** If true, also resize down to fit within the box (longest side). */
  maxDimension?: number;
}

/**
 * Returns a new File with EXIF stripped. If the file is not an image or is
 * in a pass-through MIME, returns the original.
 */
export async function stripExif(
  file: File,
  options: StripExifOptions = {},
): Promise<File> {
  if (!file.type.startsWith(IMAGE_MIME_PREFIX)) return file;
  if (PASSTHROUGH_MIME.has(file.type)) return file;

  const { outputType = file.type === "image/png" ? "image/png" : "image/jpeg",
    quality = 0.92,
    maxDimension,
  } = options;

  const bitmap = await loadBitmap(file);

  let width = bitmap.width;
  let height = bitmap.height;
  if (maxDimension && Math.max(width, height) > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, quality);
  });

  // Free decoded bitmap memory
  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }

  if (!blob) return file;

  // Preserve original filename but ensure the extension matches the output type
  const cleanName = sanitizeFileName(replaceExtension(file.name, outputType));

  return new File([blob], cleanName, {
    type: outputType,
    lastModified: Date.now(),
  });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap is more efficient when available and ignores EXIF orientation.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to HTMLImageElement
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = (e) => reject(e);
      i.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function replaceExtension(filename: string, mime: string): string {
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const base = filename.replace(/\.[^/.]+$/, "");
  return `${base}.${ext}`;
}

/**
 * Removes path-traversal characters, normalizes whitespace, caps length.
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\.\./g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
