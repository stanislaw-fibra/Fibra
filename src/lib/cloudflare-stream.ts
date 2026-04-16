/**
 * Cloudflare Stream — publiczny embed (subdomena customer).
 * Kod klienta: Stream → Dashboard → wybrany film → „Embed” (subdomena w URL).
 */
export function getCloudflareStreamCustomerCode(): string | null {
  const raw = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE?.trim();
  if (!raw) return null;
  const code = raw.replace(/[^a-zA-Z0-9]/g, "");
  return code.length ? code : null;
}

/** Bezpieczny identyfikator filmu (UID z Cloudflare). */
export function sanitizeCloudflareVideoId(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(s)) return null;
  return s;
}

export function cloudflareStreamIframeUrl(videoId: string): string | null {
  const code = getCloudflareStreamCustomerCode();
  const id = sanitizeCloudflareVideoId(videoId);
  if (!code || !id) return null;
  return `https://customer-${code}.cloudflarestream.com/${encodeURIComponent(id)}/iframe`;
}

/** Miniatura (poster) — ten sam host co embed; używana na listach zamiast ciągłego streamu. */
export function cloudflareStreamThumbnailUrl(videoId: string): string | null {
  const code = getCloudflareStreamCustomerCode();
  const id = sanitizeCloudflareVideoId(videoId);
  if (!code || !id) return null;
  return `https://customer-${code}.cloudflarestream.com/${encodeURIComponent(id)}/thumbnails/thumbnail.jpg`;
}
