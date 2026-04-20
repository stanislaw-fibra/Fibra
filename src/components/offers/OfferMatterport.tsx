"use client";

import { useState } from "react";

type Props = {
  url: string;
  title?: string;
};

/**
 * Lazy-loadowany embed Matterport / Spacer 3D. Domyślnie pokazujemy bogaty
 * poster z przyciskiem "Uruchom spacer" - iframe ładujemy dopiero po kliknięciu.
 * Dzięki temu strona oferty pozostaje lekka (Matterport to kilka MB JS + sieć),
 * a user dostaje świadome, premium doświadczenie.
 */
export function OfferMatterport({ url, title = "Wirtualny spacer 3D" }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="space-y-3">
    <div className="relative aspect-[16/10] md:aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-950 ring-1 ring-ink-200/60 shadow-[var(--shadow-cinematic)]">
      {loaded ? (
        <iframe
          src={url}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="xr-spatial-tracking; fullscreen; autoplay; accelerometer; gyroscope; vr"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          aria-label="Uruchom interaktywny spacer 3D"
          className="group absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(85,120,200,0.22),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(255,190,120,0.14),transparent_55%)] transition-opacity duration-500 group-hover:opacity-90"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.55)_0%,rgba(11,15,20,0.75)_70%,rgba(11,15,20,0.9)_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />

          <span className="relative z-10 inline-flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/30 transition-all duration-300 group-hover:bg-brand-500 group-hover:ring-brand-300 group-hover:scale-[1.04] group-active:scale-[0.97]">
            <svg
              width="34"
              height="34"
              viewBox="0 0 34 34"
              fill="none"
              aria-hidden
              className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            >
              <path
                d="M17 4.5L29 11v12L17 29.5 5 23V11l12-6.5z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M17 4.5V17m0 0l12-6m-12 6L5 11m12 6v12.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
                opacity="0.75"
              />
            </svg>
          </span>

          <span className="relative z-10 flex flex-col items-center gap-1.5">
            <span className="text-white text-[15px] md:text-[17px] font-medium tracking-tight">
              Uruchom spacer 3D
            </span>
            <span className="text-white/55 text-[10.5px] uppercase tracking-[0.22em]">
              Matterport · interaktywnie
            </span>
          </span>
        </button>
      )}
    </div>
      <p className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-500">
        <span>Spacer otwiera się w ramce - jeśli widzisz „model not available", uruchom go w nowym oknie.</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-ink-700 hover:text-brand-600 transition-colors font-medium"
        >
          Otwórz w nowym oknie
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M4.5 2.5H2.5v7h7V7.5M7 2.5h2.5V5M5.5 6.5l4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </p>
    </div>
  );
}
