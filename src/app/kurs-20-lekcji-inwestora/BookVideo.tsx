"use client";

import { useState } from "react";

type Props = {
  id: string;
  title: string;
};

/** Lekki facade YouTube - ładuje iframe dopiero po kliknięciu (youtube-nocookie,
    bez ciasteczek do czasu interakcji). Miniatura z i.ytimg.com. */
export function BookVideo({ id, title }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/15 bg-ink-900 shadow-2xl">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          aria-label={`Odtwórz wideo: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <span className="absolute inset-0 bg-ink-950/35 transition-colors group-hover:bg-ink-950/20" />
          <span className="absolute left-1/2 top-1/2 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink-950 shadow-lg transition-transform group-hover:scale-105">
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden>
              <path d="M7 4.5v13L18 11 7 4.5z" fill="currentColor" />
            </svg>
          </span>
          <span className="absolute bottom-4 left-5 right-5 text-left text-[14px] font-medium text-white drop-shadow">
            {title}
          </span>
        </button>
      )}
    </div>
  );
}
