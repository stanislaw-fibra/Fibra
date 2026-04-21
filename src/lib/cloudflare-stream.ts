/**
 * Cloudflare Stream - publiczny embed (subdomena customer).
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

/**
 * Miniatura z `videodelivery.net` - działa bez `NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE`
 * (ten sam host co w publicznych URL z panelu Stream / kart ofert).
 */
export function cloudflareStreamThumbnailViaDeliveryNet(
  videoId: string,
  opts?: CloudflareThumbnailOpts,
): string | null {
  const id = sanitizeCloudflareVideoId(videoId);
  if (!id) return null;
  const time = opts?.time ?? "1s";
  const height = opts?.height ?? 1200;
  return `https://videodelivery.net/${encodeURIComponent(id)}/thumbnails/thumbnail.jpg?time=${encodeURIComponent(time)}&height=${height}`;
}

export type CloudflareThumbnailOpts = {
  /** Domyślnie `1s` - klatka z treści, nie czarny start. */
  time?: string;
  /**
   * Domyślnie 600 px - wystarcza dla retina (card ~300 px wide × 2 DPR),
   * a jednocześnie oszczędza ~17% wagi względem poprzedniego 720
   * (Lighthouse: miniatura 404×720 vs wyświetlane 300×535 flagowała jako za duża).
   */
  height?: number;
};

/** Miniatura (poster) - ten sam host co embed; na listach pod wideo. */
export function cloudflareStreamThumbnailUrl(
  videoId: string,
  opts?: CloudflareThumbnailOpts,
): string | null {
  const code = getCloudflareStreamCustomerCode();
  const id = sanitizeCloudflareVideoId(videoId);
  if (!code || !id) return null;
  const time = opts?.time ?? "1s";
  const height = opts?.height ?? 600;
  const base = `https://customer-${code}.cloudflarestream.com/${encodeURIComponent(id)}/thumbnails/thumbnail.jpg`;
  return `${base}?time=${encodeURIComponent(time)}&height=${height}`;
}
