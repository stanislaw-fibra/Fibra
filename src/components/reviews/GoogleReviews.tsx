"use client";

import { useEffect, useState } from "react";
import { REVIEWS, fmtNumber } from "@/lib/reviews-config";
import { ReviewStars } from "./ReviewStars";

/**
 * Pełna sekcja opinii Google (widget Elfsight) na /o-fibrze i /kontakt.
 *
 * Zasada „nigdy pusto": domyślnie renderujemy statyczny fallback (ocena + przycisk
 * do Google). Widget Elfsight montujemy DOPIERO gdy są spełnione DWA warunki:
 *   1. skonfigurowany `elfsightAppId`,
 *   2. zgoda na cookies funkcjonalne (w API Cookiebot kategoria nazywa się `preferences`).
 *
 * Bez zgody albo gdy Cookiebot się nie wczyta - zostaje fallback. Skrypt platform.js
 * dociągamy imperatywnie dopiero po zgodzie (nie ładuje się dla osób, które jej nie dały).
 */
type CookiebotApi = { consent?: { preferences?: boolean } };

function hasFunctionalConsent(): boolean {
  if (typeof window === "undefined") return false;
  const cb = (window as unknown as { Cookiebot?: CookiebotApi }).Cookiebot;
  return Boolean(cb?.consent?.preferences);
}

export function GoogleReviews({ className = "" }: { className?: string }) {
  const appId = REVIEWS.elfsightAppId;
  const [consent, setConsent] = useState(false);

  // Śledzimy stan zgody Cookiebot (initial + zmiany w trakcie sesji).
  useEffect(() => {
    if (!appId) return;
    const update = () => setConsent(hasFunctionalConsent());
    update();
    window.addEventListener("CookiebotOnConsentReady", update);
    window.addEventListener("CookiebotOnAccept", update);
    window.addEventListener("CookiebotOnDecline", update);
    return () => {
      window.removeEventListener("CookiebotOnConsentReady", update);
      window.removeEventListener("CookiebotOnAccept", update);
      window.removeEventListener("CookiebotOnDecline", update);
    };
  }, [appId]);

  // Po zgodzie: dociągamy platform.js raz; jeśli już jest - prosimy o ponowny skan.
  useEffect(() => {
    if (!consent || !appId) return;
    const w = window as unknown as {
      eapps?: { Platform?: { reinit?: () => void } };
    };
    if (w.eapps?.Platform?.reinit) {
      w.eapps.Platform.reinit();
      return;
    }
    if (!document.querySelector("script[data-elfsight-platform]")) {
      const s = document.createElement("script");
      s.src = "https://elfsightcdn.com/platform.js";
      s.async = true;
      s.setAttribute("data-elfsight-platform", "");
      document.body.appendChild(s);
    }
  }, [consent, appId]);

  const showWidget = consent && Boolean(appId);

  return (
    <section
      id="opinie"
      className={`scroll-mt-[88px] py-20 md:py-28 bg-paper ${className}`.trim()}
    >
      <div className="container-xl">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <p className="eyebrow flex items-center gap-3 mb-5">
            <span className="inline-block w-8 h-px bg-brand-500" />
            Opinie klientów
          </p>
          <h2 className="font-display fluid-display text-ink-950">Co mówią o nas klienci</h2>
          <p className="mt-5 text-[16px] md:text-[17px] text-ink-600 leading-relaxed">
            Opinie naszych klientów, zbierane przez lata w wizytówce Google.
          </p>
        </div>

        {showWidget ? (
          <div className={`elfsight-app-${appId}`} data-elfsight-app-lazy />
        ) : (
          <ReviewsFallback />
        )}
      </div>
    </section>
  );
}

/** Statyczny fallback - ocena + przycisk do Google. Zawsze kompletny. */
function ReviewsFallback() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-[var(--radius-lg)] border border-ink-200/80 bg-paper-warm px-8 py-10 text-center md:px-10 md:py-12">
      <ReviewStars rating={REVIEWS.rating} size={24} />
      <p className="mt-5 font-display text-[clamp(2.5rem,6vw,3.25rem)] leading-none text-ink-950">
        {fmtNumber(REVIEWS.rating)}
      </p>
      <p className="mt-3 text-[14px] text-ink-600">
        średnia z {fmtNumber(REVIEWS.count)} opinii
      </p>
      {REVIEWS.reviewsUrl ? (
        <a
          href={REVIEWS.reviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink-950 px-7 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-brand-500"
        >
          Zobacz wszystkie opinie
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M3 7h8M7 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
