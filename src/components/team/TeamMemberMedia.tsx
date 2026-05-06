"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  cloudflareStreamIframeUrl,
  cloudflareStreamThumbnailUrl,
  cloudflareStreamThumbnailViaDeliveryNet,
} from "@/lib/cloudflare-stream";

type Props = {
  /** Cloudflare Stream ID — gdy puste, pokazujemy zdjęcie. */
  videoId?: string;
  /** URL do zdjęcia (fallback / poster). */
  photoUrl?: string;
  /** Imię i nazwisko (alt). */
  name: string;
  /** Wariant — różny aspect i scaling: founder (większe, 3/4) lub member (5/7 wąziej). */
  variant?: "founder" | "member";
  /** Kontrolne tło — np. tonacja brand/accent. */
  className?: string;
};

/**
 * Karta z portretem osoby z zespołu Fibry.
 *
 * Logika fallbacku:
 *  1. Jeżeli `videoId` jest ustawione i mamy `NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE` → pionowy iframe Stream.
 *  2. Inaczej, jeżeli mamy `photoUrl` → next/image z portretem.
 *  3. W ostateczności inicjały na gradiencie marki.
 *
 * Jeden „play overlay" pojawia się nad iframe-em po kliknięciu (lazy mount).
 * Iframe jest ładowany dopiero po wejściu w viewport, żeby nie obciążać LCP strony O Fibrze.
 */
export function TeamMemberMedia({ videoId, photoUrl, name, variant = "member", className = "" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Wszystkie warianty mają teraz `aspect-[9/16]` — natywny format pionowych nagrań prezentacyjnych.
  // Klient zwrócił uwagę, że przy szerszych proporcjach (3/4) wideo grało, ale obok widać było
  // krawędzie kontenera (kontener szerszy niż natywne wideo). Dopasowując kontener do dokładnego
  // formatu wideo, eliminujemy te krawędzie. Zdjęcie-fallback zostaje wyświetlone z `object-cover`
  // (kadrowanie centrowane na twarzy przez `object-position`) — to akceptowalne, bo zdjęcie pełni
  // rolę placeholderu do czasu wgrania filmu.
  const aspectClass = "aspect-[9/16]";
  const iframeUrl = videoId ? cloudflareStreamIframeUrl(videoId) : null;
  const posterUrl = videoId
    ? cloudflareStreamThumbnailUrl(videoId, { time: "0.5s", height: 1200 }) ||
      cloudflareStreamThumbnailViaDeliveryNet(videoId, { time: "0.5s", height: 1200 })
    : null;

  useEffect(() => {
    if (!iframeUrl) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldMount(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [iframeUrl]);

  // Ramka i kontener — wspólny dla każdego wariantu.
  const containerClass = [
    "relative w-full overflow-hidden rounded-[var(--radius-lg)] ring-1 ring-ink-200/70 shadow-[var(--shadow-cinematic)] bg-gradient-to-br from-brand-500/10 to-accent-400/10",
    aspectClass,
    className,
  ].join(" ");

  // ===== 1) Cloudflare Stream =====
  if (iframeUrl) {
    return (
      <div ref={wrapRef} className={containerClass}>
        {/* Poster z CF — pokazuje się natychmiast, póki iframe się ładuje albo gdy user nie kliknął play. */}
        {posterUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={posterUrl}
            alt={`${name} — autoprezentacja`}
            className={[
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              playing ? "opacity-0" : "opacity-100",
            ].join(" ")}
          />
        ) : photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photoUrl}
            alt={`${name} — fallback portret`}
            className={[
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              playing ? "opacity-0" : "opacity-100",
            ].join(" ")}
          />
        ) : null}

        {shouldMount && playing ? (
          <iframe
            src={`${iframeUrl}?autoplay=true&muted=false&letterboxColor=transparent&controls=true`}
            title={`${name} — wideo prezentacja`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : null}

        {!playing && (
          <button
            type="button"
            onClick={() => {
              setShouldMount(true);
              setPlaying(true);
            }}
            className="absolute inset-0 z-10 flex items-end justify-center bg-gradient-to-t from-ink-950/60 via-ink-950/10 to-transparent transition-opacity duration-300 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            aria-label={`Odtwórz wideo: ${name}`}
          >
            <span className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/95 px-5 py-3 text-[13px] font-semibold text-ink-950 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)] transition-transform group-hover:scale-105">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
                  <path d="M2.5 1.5l7 4-7 4v-8z" />
                </svg>
              </span>
              Zobacz autoprezentację
            </span>
          </button>
        )}
      </div>
    );
  }

  // ===== 2) Zdjęcie =====
  if (photoUrl) {
    return (
      <div className={containerClass}>
        <Image
          src={photoUrl}
          alt={`${name}`}
          fill
          sizes={variant === "founder" ? "(min-width: 1024px) 40vw, (min-width: 768px) 448px, 384px" : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover"
          style={{ objectPosition: variant === "founder" ? "center 28%" : "center top" }}
          quality={78}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950/25 via-transparent to-transparent" />
      </div>
    );
  }

  // ===== 3) Inicjały =====
  const initials = name
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className={containerClass}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-[clamp(3rem,9vw,6rem)] text-white/85 tracking-tight">{initials}</span>
      </div>
    </div>
  );
}
