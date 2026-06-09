"use client";

import { useState } from "react";
import {
  cloudflareStreamIframeUrl,
  cloudflareStreamThumbnailUrl,
} from "@/lib/cloudflare-stream";

type Props = {
  id: string;
  title: string;
  /** Widoczny podpis na dole. W hero wyłączony - kolidowałby z plakietką książki. */
  showCaption?: boolean;
  /** Wywoływane po starcie odtwarzania (np. by ukryć plakietki nad wideo). */
  onPlay?: () => void;
  /** Własna okładka (ścieżka w /public). Gdy puste - klatka z Cloudflare Stream. */
  poster?: string;
};

/** Lekki facade Cloudflare Stream - poster z miniatury, iframe ładuje się
    dopiero po kliknięciu (oszczędza transfer i nie blokuje renderu hero). */
export function StreamVideo({ id, title, showCaption = true, onPlay, poster: posterProp }: Props) {
  const [playing, setPlaying] = useState(false);
  const iframeUrl = cloudflareStreamIframeUrl(id);
  const poster =
    posterProp ?? cloudflareStreamThumbnailUrl(id, { time: "2s", height: 1100 });

  if (!iframeUrl) return null;

  if (playing) {
    return (
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`${iframeUrl}?autoplay=true`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture;"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setPlaying(true);
        onPlay?.();
      }}
      className="group absolute inset-0 h-full w-full cursor-pointer"
      aria-label={`Odtwórz wideo: ${title}`}
    >
      {poster && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      )}
      <span className="absolute inset-0 bg-ink-950/30 transition-colors group-hover:bg-ink-950/15" />
      <span className="absolute left-1/2 top-1/2 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink-950 shadow-lg transition-transform group-hover:scale-105">
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path d="M7 4.5v13L18 11 7 4.5z" fill="currentColor" />
        </svg>
      </span>
      {showCaption && (
        <span className="absolute bottom-4 left-5 right-5 text-left text-[14px] font-medium text-white drop-shadow">
          {title}
        </span>
      )}
    </button>
  );
}
