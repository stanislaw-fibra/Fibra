"use client";

import { useEffect } from "react";

/**
 * Ładuje skrypt Cookiebot (uc.js) PO hydracji, w `useEffect`.
 *
 * DLACZEGO nie raw <script> w <head> / next/script beforeInteractive:
 * Cookiebot wstrzykuje baner (#CybotCookiebotDialog) jako dziecko <body>.
 * Gdy uc.js wykona się PRZED hydracją (a tak działa skrypt w <head> i
 * `beforeInteractive`), React podczas hydracji traktuje ten węzeł jako
 * „nieoczekiwany" i USUWA go - baner migał i znikał (consent nigdy nie był
 * uzyskany, więc GA4 / FB Pixel / opinie Google pozostawały zablokowane).
 *
 * `useEffect` uruchamia się dopiero po zamontowaniu (po hydracji), więc React
 * skończył już reconcyliację <body> i nie rusza węzła dorzuconego później.
 *
 * Auto-blocking nie cierpi: wszystkie nasze trackery (GA4, FB Pixel) są
 * tagowane `type="text/plain"` + `data-cookieconsent`, więc są nieaktywne aż
 * Cookiebot je aktywuje po zgodzie - niezależnie od tego, kiedy się załaduje.
 *
 * CBID z panelu manage.cookiebot.com (Bartosz, 2026-05-12).
 */
const COOKIEBOT_CBID = "f74cf9e3-5a07-4574-bc83-3e970cfa9d62";

export function CookiebotLoader() {
  useEffect(() => {
    if (document.getElementById("Cookiebot")) return;
    const script = document.createElement("script");
    script.id = "Cookiebot";
    script.src = "https://consent.cookiebot.com/uc.js";
    script.async = true;
    script.setAttribute("data-cbid", COOKIEBOT_CBID);
    script.setAttribute("data-blockingmode", "auto");
    document.head.appendChild(script);
  }, []);

  return null;
}
