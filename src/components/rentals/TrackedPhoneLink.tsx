"use client";

import type { ComponentPropsWithoutRef } from "react";

// GA4 / Meta Pixel - typujemy minimalnie, żeby nie wymagać deklaracji globalnych.
type Gtag = (cmd: "event", name: string, params?: Record<string, unknown>) => void;
type FbqFn = (cmd: "track" | "trackCustom", name: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: FbqFn;
  }
}

/**
 * Link telefoniczny, który przy kliknięciu wysyła zdarzenie do GA4
 * (import konwersji „Kliknięcie w telefon" w Google Ads) oraz do Meta Pixel.
 * Nie wywołuje preventDefault - połączenie tel: startuje normalnie, event leci
 * synchronicznie tuż przed nawigacją. Trackery mogą być zablokowane przez
 * Cookiebot do czasu zgody, dlatego wywołania są opcjonalne (?.).
 */
export function TrackedPhoneLink({
  phone,
  location,
  children,
  ...rest
}: {
  /** Numer w formacie E.164, np. +48881431800 (bez prefiksu tel:). */
  phone: string;
  /** Miejsce kliknięcia na stronie, np. "hero", "kontakt" - do rozróżnienia w GA4. */
  location: string;
} & Omit<ComponentPropsWithoutRef<"a">, "href">) {
  return (
    <a
      href={`tel:${phone}`}
      onClick={() => {
        if (typeof window === "undefined") return;
        window.gtag?.("event", "phone_click", {
          source: "rental_zamyslow",
          location,
          phone_number: phone,
        });
        window.fbq?.("track", "Contact", { source: "rental_zamyslow", location });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
