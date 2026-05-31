"use client";

import { useEffect, useRef } from "react";

/**
 * Cookiebot CookieDeclaration - auto-generowana lista cookies używanych
 * przez serwis. Skrypt `cd.js` musi być wstawiony BEZPOŚREDNIO w miejscu
 * gdzie chcemy widzieć tabelę (Cookiebot wstawia HTML wokół skryptu).
 *
 * Dlatego nie używamy `next/script` (strategy="afterInteractive" pakuje
 * skrypt do końca <body>) - montujemy element przez `appendChild` w ref.
 */
export function CookieDeclaration({ cbid }: { cbid: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Czyść jeżeli jest po hot-reload / re-mount.
    container.innerHTML = "";
    const script = document.createElement("script");
    script.src = `https://consent.cookiebot.com/${cbid}/cd.js`;
    script.async = true;
    container.appendChild(script);
    return () => {
      container.innerHTML = "";
    };
  }, [cbid]);

  return <div ref={containerRef} />;
}
