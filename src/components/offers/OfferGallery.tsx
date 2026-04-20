"use client";

import Image from "next/image";
import { useGalleryLightbox } from "./GalleryLightbox";

type Props = {
  images: string[];
  title: string;
};

/** Polska odmiana: 1 zdjęcie, 2-4 zdjęcia, 5+ zdjęć (z wyjątkiem 12-14). */
function pluralPhotos(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return "zdjęcie";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "zdjęcia";
  return "zdjęć";
}

/**
 * Siatka miniatur w sekcji #galeria. Klik otwiera współdzielony lightbox
 * (zobacz `GalleryLightboxProvider` w page.tsx strony oferty).
 */
export function OfferGallery({ images, title }: Props) {
  const lightbox = useGalleryLightbox();

  if (!images.length) return null;

  // Dla ofert z kilkudziesięcioma zdjęciami siatka staje się męcząca przy
  // scrollu. Pokazujemy sensowny fragment, a resztę user otwiera w lightboxie
  // (ma tam miniaturki, strzałki, swipe - premium UX do szybkiego przeglądu).
  const MAX_TILES = 9;
  const showOverflow = images.length > MAX_TILES;
  const visibleImages = showOverflow ? images.slice(0, MAX_TILES - 1) : images;
  const overflowCount = images.length - (MAX_TILES - 1);
  const overflowPreviewSrc = showOverflow ? images[MAX_TILES - 1] : null;

  const openAt = (index: number, el: HTMLElement | null) => {
    lightbox?.openAt(index, el);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        {visibleImages.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={(e) => openAt(i, e.currentTarget)}
            className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-gradient-to-br from-ink-100 to-ink-200/70 ring-1 ring-ink-200/80 transition-shadow duration-300 hover:shadow-[var(--shadow-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 cursor-pointer"
            aria-label={`Otwórz zdjęcie ${i + 1} z ${images.length}: ${title}`}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.55)_50%,transparent_80%)] bg-[length:200%_100%] animate-[shimmer_1.6s_ease-in-out_infinite]"
            />
            <Image
              src={src}
              alt=""
              fill
              className="relative object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 380px"
              priority={i < 6}
              loading={i < 6 ? "eager" : "lazy"}
              quality={72}
            />
            <span className="pointer-events-none absolute inset-0 bg-ink-950/0 group-hover:bg-ink-950/15 transition-colors duration-300" />
            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink-900 opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        ))}

        {showOverflow && overflowPreviewSrc && (
          <button
            type="button"
            onClick={(e) => openAt(MAX_TILES - 1, e.currentTarget)}
            className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-ink-900 ring-1 ring-ink-200/80 transition-shadow duration-300 hover:shadow-[var(--shadow-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 cursor-pointer"
            aria-label={`Zobacz wszystkie ${images.length} ${pluralPhotos(images.length)} - otwórz pełny podgląd`}
          >
            <Image
              src={overflowPreviewSrc}
              alt=""
              fill
              className="object-cover opacity-55 transition-all duration-500 group-hover:opacity-70 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 380px"
              loading="lazy"
              quality={60}
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-ink-950/55 group-hover:bg-ink-950/45 transition-colors duration-300" />
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white">
              <span className="font-display text-[28px] md:text-[34px] leading-none tabular-nums tracking-tight">
                +{overflowCount}
              </span>
              <span className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-white/80">
                {pluralPhotos(overflowCount)}
              </span>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[10px] md:text-[11px] font-medium text-white ring-1 ring-white/20 transition-all duration-300 group-hover:bg-white/25 group-hover:ring-white/30">
                Zobacz wszystkie
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
