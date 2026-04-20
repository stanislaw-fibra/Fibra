"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  title: string;
  streamId?: string;
  videoSrc?: string;
  youtubeUrl?: string;
  poster?: string;
  gallery?: string[];
};

function youtubeEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    let id: string | null = null;
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace(/^\//, "");
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v");
      if (!id && u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] || null;
      if (!id && u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] || null;
    }
    if (!id) return null;
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      color: "white",
    });
    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  } catch {
    return null;
  }
}

/**
 * Hero media strony oferty - 3 tryby w kolejności priorytetu:
 * 1) Cloudflare Stream (pionowy 9:15, player) - gdy `streamId` istnieje (renderowany w page.tsx).
 * 2) YouTube embed (16:9) + gałka miniatur zdjęć pod spodem - gdy jest `youtubeUrl` ale brak stream.
 * 3) Zdjęcie z galerii (4:3) z miniaturami - gdy brak wideo.
 *
 * W trybie YouTube miniatury pod spodem są skrótem: kliknięcie przewija do pełnej
 * galerii (sekcja `#galeria` na stronie oferty), gdzie dopiero otwiera się
 * lightbox - nie duplikujemy stanu.
 */
export function OfferHeroMedia({ title, streamId, youtubeUrl, poster, gallery }: Props) {
  const embedUrl = useMemo(
    () => (youtubeUrl ? youtubeEmbedUrl(youtubeUrl) : null),
    [youtubeUrl],
  );

  const images = useMemo(() => {
    const list = gallery?.length ? gallery : poster ? [poster] : [];
    return Array.from(new Set(list));
  }, [gallery, poster]);

  const [idx, setIdx] = useState(0);

  // Short video jest obsłużony w komponencie nadrzędnym - tu tylko fallbacki.
  if (streamId) return null;

  if (embedUrl) {
    const strip = images.slice(0, 5);
    return (
      <div className="w-full">
        <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-900 shadow-[var(--shadow-cinematic)] ring-1 ring-ink-200/60">
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        </div>
        <p className="mt-4 text-center lg:text-left text-[12px] text-ink-500 max-w-[560px] mx-auto lg:mx-0">
          Film prezentacyjny z kanału YouTube.
        </p>

        {strip.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-500">Galeria zdjęć</p>
              <a
                href="#galeria"
                className="text-[12px] font-medium text-ink-700 hover:text-brand-600 transition-colors inline-flex items-center gap-1"
              >
                Wszystkie ({images.length})
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {strip.map((src, i) => (
                <a
                  key={`${src}-${i}`}
                  href="#galeria"
                  aria-label={`Zdjęcie ${i + 1} - otwórz galerię`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] ring-1 ring-ink-200/80 transition-all duration-200 hover:ring-ink-400 hover:shadow-[0_6px_16px_-6px_rgba(11,15,20,0.2)]"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-400 group-hover:scale-[1.06]"
                    sizes="140px"
                    quality={60}
                  />
                  {i === strip.length - 1 && images.length > strip.length && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink-950/55 text-white text-[13px] font-medium backdrop-blur-[2px]">
                      +{images.length - strip.length}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (images.length > 0) {
    const active = images[Math.min(idx, images.length - 1)];
    const thumbs = images.slice(0, 5);
    return (
      <div className="w-full">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-100 shadow-[var(--shadow-cinematic)] ring-1 ring-ink-200/60">
          <Image
            src={active}
            alt={title}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 1024px) 100vw, 560px"
            priority
            quality={78}
          />
          <a
            href="#galeria"
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-ink-950/75 backdrop-blur-md text-white px-4 py-2 text-[12px] font-medium transition-colors hover:bg-brand-500"
            aria-label="Przejdź do pełnej galerii"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 4.5h10M2 9.5h10M2 7h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Wszystkie zdjęcia ({images.length})
          </a>
        </div>
        {thumbs.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {thumbs.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIdx(i)}
                aria-current={i === idx}
                aria-label={`Zdjęcie ${i + 1}`}
                className={[
                  "relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] ring-1 transition-all cursor-pointer",
                  i === idx ? "ring-brand-500 ring-[1.5px]" : "ring-ink-200/80 hover:ring-ink-400",
                ].join(" ")}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="140px"
                  quality={60}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-100 ring-1 ring-ink-200/60 flex items-center justify-center">
      <span className="text-ink-500 text-sm">Materiały w przygotowaniu</span>
    </div>
  );
}

export { youtubeEmbedUrl };
