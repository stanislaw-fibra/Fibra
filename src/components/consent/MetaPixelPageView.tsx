"use client";

import { useEffect } from "react";

/**
 * Dosyła zdarzenie PageView przez Conversion API (serwer → Meta), zdublowane z
 * pikselem przeglądarkowym po `event_id` (Meta deduplikuje, nie liczy podwójnie).
 *
 * Po co: sam piksel daje słabe „dopasowanie zdarzeń" dla PageView - zdarzenie nie
 * niesie fbc/IP/User-Agent w sposób, który Meta dobrze podpina pod kliknięcie
 * reklamy. CAPI dokłada fbc (z cookie _fbc) + fbp + IP + UA (te dwa z nagłówków
 * po stronie /api/fb/capi), co podnosi jakość dopasowania i pokrycie klucza fbc.
 *
 * `event_id` współdzielimy przez `window.__fbPageViewId` ustawiony w
 * AnalyticsScripts tuż przed `fbq('track','PageView', …, {eventID})`.
 *
 * Wszystko za zgodą marketingową (Cookiebot) - bez zgody piksel się nie ładuje,
 * więc i tego zdarzenia nie wysyłamy (fail-closed).
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  const cb = (window as unknown as {
    Cookiebot?: { consent?: { marketing?: boolean } };
  }).Cookiebot;
  return Boolean(cb?.consent?.marketing);
}

export function MetaPixelPageView() {
  useEffect(() => {
    let sent = false;
    let tries = 0;

    const trySend = () => {
      if (sent) return true;
      // Czekamy aż Cookiebot da zgodę i AnalyticsScripts ustawi wspólny event_id.
      const eventId = (window as unknown as { __fbPageViewId?: string }).__fbPageViewId;
      if (!hasMarketingConsent() || !eventId) return false;

      sent = true;
      const payload = {
        event_name: "PageView",
        event_id: eventId,
        event_source_url: window.location.href,
        fbp: getCookie("_fbp"),
        fbc: getCookie("_fbc"),
        external_id: getCookie("fibra_uid"),
      };
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        if (!navigator.sendBeacon?.("/api/fb/capi", blob)) {
          void fetch("/api/fb/capi", {
            method: "POST",
            body: blob,
            keepalive: true,
            headers: { "content-type": "application/json" },
          });
        }
      } catch {
        // Tracking nigdy nie wywraca strony.
      }
      return true;
    };

    if (trySend()) return;

    // Zgoda/piksel mogą dojść z opóźnieniem - próbujemy przez ~10 s, potem odpuszczamy.
    const interval = window.setInterval(() => {
      tries += 1;
      if (trySend() || tries > 20) window.clearInterval(interval);
    }, 500);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
