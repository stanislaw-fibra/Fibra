"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { youtubeEmbedUrl } from "@/components/offers/OfferHeroMedia";

type Props = {
  url: string;
  title?: string;
};

function youtubeIdFromUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace(/^\//, "") || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Dedykowana sekcja z dłuższym filmem z YouTube - pokazujemy ją tylko wtedy,
 * gdy YouTube nie jest już użyty w hero (czyli kiedy hero to Cloudflare Stream).
 *
 * Lazy-load: do pierwszego kliknięcia renderujemy tylko poster YouTube + przycisk
 * play. Dzięki temu strona pozostaje lekka, a user dostaje świadome doświadczenie
 * premium (iframe + YT skrypty ładujemy on-demand).
 */
export function OfferYouTube({ url, title = "Film prezentacyjny" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = useMemo(() => youtubeEmbedUrl(url), [url]);
  const videoId = useMemo(() => youtubeIdFromUrl(url), [url]);

  if (!embedUrl || !videoId) return null;

  const posterUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const posterFallback = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-900 ring-1 ring-ink-200/60 shadow-[var(--shadow-cinematic)]">
        {loaded ? (
          <iframe
            src={`${embedUrl}&autoplay=1`}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            aria-label="Odtwórz film z YouTube"
            className="group absolute inset-0 flex items-center justify-center overflow-hidden cursor-pointer"
          >
            <Image
              src={posterUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 900px"
              quality={78}
              unoptimized
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                if (el.src !== posterFallback) el.src = posterFallback;
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.15)_0%,rgba(11,15,20,0.45)_100%)]"
            />
            <span className="relative z-10 inline-flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/30 transition-all duration-300 group-hover:bg-[#FF0033] group-hover:ring-[#FF0033] group-hover:scale-[1.04] group-active:scale-[0.97]">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
                className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] translate-x-[1.5px]"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-ink-950/70 backdrop-blur-md text-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.8-.9-2.3-1C17 2.6 12 2.6 12 2.6s-5 0-8.3.3c-.5.1-1.4.1-2.3 1-.7.7-.9 2.3-.9 2.3S.3 8 .3 9.9v1.8c0 1.8.2 3.7.2 3.7s.2 1.6.9 2.3c.9.9 2.1.9 2.6 1 1.9.2 8 .3 8 .3s5 0 8.3-.3c.5-.1 1.4-.1 2.3-1 .7-.7.9-2.3.9-2.3s.2-1.8.2-3.7V9.9c0-1.8-.2-3.7-.2-3.7zM9.5 14.5V7.8l6.2 3.4-6.2 3.3z" />
              </svg>
              YouTube
            </span>
          </button>
        )}
      </div>
      <p className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-500">
        <span>Film prezentacyjny z kanału YouTube.</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-ink-700 hover:text-brand-600 transition-colors font-medium"
        >
          Otwórz na YouTube
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M4.5 2.5H2.5v7h7V7.5M7 2.5h2.5V5M5.5 6.5l4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </p>
    </div>
  );
}
