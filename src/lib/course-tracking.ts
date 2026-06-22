/**
 * Pomocniki śledzenia po stronie KLIENTA dla strony kursu. Dwa zdarzenia:
 *
 *  1. trackCourseCheckout - klik „Kupuję dostęp" (przekierowanie do Imkera).
 *     Strzela AddToCart pikselem ORAZ przez Conversion API (ten sam event_id →
 *     Meta deduplikuje). Wysyłane TYLKO po zgodzie marketingowej (Cookiebot).
 *
 *  2. trackCourseInterest - klik zachęty z góry strony (kotwica do zamówienia).
 *     Wewnętrzny sygnał do naszych logów (NIE Meta), bez danych osobowych.
 *
 * Oba są fire-and-forget przez sendBeacon, więc przetrwają natychmiastową
 * nawigację i nie blokują przejścia użytkownika dalej.
 */

import {
  PRICE_VALUE,
  CURRENCY,
  COURSE_PRODUCT_ID,
  COURSE_CONTENT_NAME,
} from "@/app/kurs-20-lekcji-inwestora/config";

export type CtaSection =
  | "hero"
  | "solution"
  | "program"
  | "free_lesson"
  | "order"
  | "final"
  | "sticky";

type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof fbq === "function" ? fbq : null;
}

/** Zgoda marketingowa z Cookiebota. Brak obiektu = brak zgody (fail-closed). */
function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  const cb = (window as unknown as {
    Cookiebot?: { consent?: { marketing?: boolean } };
  }).Cookiebot;
  return Boolean(cb?.consent?.marketing);
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Identyfikator kliknięcia reklamy z bieżącego URL (świeży) lub z cookie
 * `fibra_fbclid` utrwalonego na wejściu (AnalyticsScripts). Tylko po zgodzie
 * marketingowej - cookie i tak powstaje dopiero po zgodzie.
 */
function getFbclid(): string | null {
  if (typeof window === "undefined") return null;
  const fromUrl = new URLSearchParams(window.location.search).get("fbclid");
  return fromUrl || getCookie("fibra_fbclid");
}

/**
 * Dokleja `fbclid` do linku koszyka na salescrm.pl. To inna domena niż fibra.pl,
 * więc cookie _fbc złapane u nas jest tam nieczytelne - jedyny przenośny most to
 * sam fbclid w URL. Piksel Meta na salescrm.pl odczyta go natywnie i ustawi tam
 * _fbc, dzięki czemu zdarzenie Zakup ma się jak podpiąć pod reklamę.
 *
 * Zwraca URL bez zmian, gdy brak zgody marketingowej lub brak fbclid.
 */
export function checkoutUrlWithClickId(baseUrl: string): string {
  if (!hasMarketingConsent()) return baseUrl;
  const fbclid = getFbclid();
  if (!fbclid) return baseUrl;
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("fbclid", fbclid);
    return url.toString();
  } catch {
    return baseUrl;
  }
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `e-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function beacon(url: string, payload: unknown): void {
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (navigator.sendBeacon?.(url, blob)) return;
    // Fallback dla braku sendBeacon - keepalive przetrwa nawigację.
    void fetch(url, {
      method: "POST",
      body: blob,
      keepalive: true,
      headers: { "content-type": "application/json" },
    });
  } catch {
    // Tracking nigdy nie może wywrócić kliknięcia - cicho ignorujemy.
  }
}

/**
 * Wewnętrzny log kliknięcia (Supabase przez /api/track). NIE Meta, bez PII -
 * wysyłany ZAWSZE, niezależnie od zgody marketingowej.
 */
function logCtaClick(section: CtaSection, kind: "interest" | "add_to_cart"): void {
  if (typeof window === "undefined") return;
  beacon("/api/track", { section, kind, url: window.location.href });
}

/**
 * AddToCart: piksel + CAPI z jednym event_id (deduplikacja). Wywołuj w onClick
 * przycisku zakupu i pozwól nawigacji iść dalej (nie preventDefault).
 */
export function trackCourseCheckout(section: CtaSection): void {
  // Najpierw nasz wewnętrzny log - ZAWSZE (chcemy widzieć każde kliknięcie zakupu).
  logCtaClick(section, "add_to_cart");

  // Do Meta tylko po zgodzie marketingowej.
  if (!hasMarketingConsent()) return;

  const eventId = newEventId();
  const customData = {
    value: PRICE_VALUE,
    currency: CURRENCY,
    content_ids: [COURSE_PRODUCT_ID],
    content_type: "product",
    content_name: COURSE_CONTENT_NAME,
    // Który przycisk wywołał zakup - do analizy skuteczności CTA w Meta.
    cta_section: section,
  };

  const fbq = getFbq();
  if (fbq) {
    fbq("track", "AddToCart", customData, { eventID: eventId });
  }

  beacon("/api/fb/capi", {
    event_name: "AddToCart",
    event_id: eventId,
    event_source_url: window.location.href,
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc"),
    custom_data: customData,
  });
}

/** Wewnętrzny sygnał zainteresowania (nasze logi, nie Meta). */
export function trackCourseInterest(section: CtaSection): void {
  logCtaClick(section, "interest");
}
