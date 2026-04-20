"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { OfferMiniGallery } from "./OfferMiniGallery";
import { useGalleryLightbox } from "./GalleryLightbox";

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
 * 2) YouTube embed (16:9) + mini-galeria zdjęć pod spodem.
 * 3) Zdjęcie z galerii (4:3) + mini-galeria pod spodem.
 *
 * W trybie YouTube / zdjęciowym klik w miniaturę otwiera współdzielony lightbox
 * (GalleryLightboxProvider w page.tsx) — bez kotwicy i przewijania do sekcji #galeria.
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
  const lightbox = useGalleryLightbox();

  // Short video jest obsłużony w komponencie nadrzędnym - tu tylko fallbacki.
  if (streamId) return null;

  if (embedUrl) {
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

        {images.length > 0 && (
          <OfferMiniGallery images={images} className="mt-5" />
        )}
      </div>
    );
  }

  if (images.length > 0) {
    const active = images[Math.min(idx, images.length - 1)];
    const thumbs = images.slice(0, 5);
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={(e) => lightbox?.openAt(Math.min(idx, images.length - 1), e.currentTarget)}
          className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-100 shadow-[var(--shadow-cinematic)] ring-1 ring-ink-200/60 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={`Otwórz galerię: ${title}`}
        >
          <Image
            src={active}
            alt={title}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 1024px) 100vw, 560px"
            priority
            quality={78}
          />
          <span className="pointer-events-none absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-ink-950/75 backdrop-blur-md text-white px-4 py-2 text-[12px] font-medium transition-colors group-hover:bg-brand-500">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 4.5h10M2 9.5h10M2 7h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Wszystkie zdjęcia ({images.length})
          </span>
        </button>
        {thumbs.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {thumbs.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={(e) => {
                  setIdx(i);
                  lightbox?.openAt(i, e.currentTarget);
                }}
                aria-current={i === idx}
                aria-label={`Otwórz zdjęcie ${i + 1}`}
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
