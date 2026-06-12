/**
 * Image URL helper — routes Supabase Storage images through the
 * on-the-fly render/image transformation endpoint (resize + recompress)
 * to cut image bytes by ~60-80% without any visible quality change.
 *
 * IMPORTANT: This is passthrough-safe by design. Only URLs that contain
 * `/storage/v1/object/public/` are rewritten. Everything else
 * (CloudFront/Higgsfield, local `/images/*`, any external host) is
 * returned completely unchanged — the current marketplace covers live
 * on CloudFront, so most URLs take the passthrough path.
 */

/**
 * Feature flag for Supabase Image Transformations.
 * If transformed URLs ever fail (e.g. transformations not enabled on the
 * Supabase plan), set this to `false` → the helper becomes a complete
 * passthrough and every original URL is used as-is. Zero risk.
 */
export const SUPABASE_IMAGE_TRANSFORMS = true;

const SUPABASE_PUBLIC_OBJECT_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_IMAGE_PATH = "/storage/v1/render/image/public/";

export interface OptimizedImageOptions {
  /** Target width in px (default 640) */
  width?: number;
  /** JPEG/WebP quality 1-100 (default 80) */
  quality?: number;
}

/**
 * Returns a size/quality-optimized URL for Supabase Storage public objects.
 * All non-Supabase-Storage URLs are returned unchanged (passthrough).
 *
 * @param url - The original image URL (may be null/undefined)
 * @param opts - Optional width/quality overrides (default 640 / 80)
 * @returns The optimized URL, the original URL (passthrough), or undefined
 */
export function optimizedImageUrl(
  url: string | null | undefined,
  opts?: OptimizedImageOptions,
): string | undefined {
  if (!url) return undefined;
  if (!SUPABASE_IMAGE_TRANSFORMS) return url;
  if (!url.includes(SUPABASE_PUBLIC_OBJECT_PATH)) return url;

  const width = opts?.width ?? 640;
  const quality = opts?.quality ?? 80;

  const transformed = url.replace(SUPABASE_PUBLIC_OBJECT_PATH, SUPABASE_RENDER_IMAGE_PATH);
  // Respect existing query params (e.g. cache-busting tokens).
  const separator = transformed.includes("?") ? "&" : "?";
  return `${transformed}${separator}width=${width}&quality=${quality}`;
}
