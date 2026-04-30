"use client";

import Image from "next/image";
import { useGalleryLightbox } from "./GalleryLightbox";

type Props = {
  /** Docelowo oczekuje tej samej listy co Provider — używamy Providera jako single source of truth. */
  images: string[];
  /** Liczba widocznych miniaturek (kolumn). Domyślnie 6 — zachowuje wyrazistość galerii w pierwszym viewportcie. */
  limit?: number;
  /** Etykieta nagłówka mini-galerii. */
  label?: string;
  className?: string;
};

/** Polska odmiana zdjęć: 1 zdjęcie, 2-4 zdjęcia, 5+ zdjęć (z wyjątkiem 12-14). */
function pluralPhotos(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return "zdjęcie";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "zdjęcia";
  return "zdjęć";
}

/**
 * Mini-galeria pod hero oferty: 5 miniaturek (1 duży kafel + 4 mniejsze) z wyraźnym
 * kaflem „+N" na resztę, plus pełnoszerokościowa belka „Otwórz galerię". Klik na dowolny
 * kafel otwiera pełnoekranowy lightbox przy dokładnie tym zdjęciu — bez kotwicy / przewijania.
 *
 * Cel: galeria ma być natychmiast czytelna jako galeria (nie pasek miniatur), żeby user
 * po wejściu na ofertę widział, że jest tam więcej zdjęć i jak je otworzyć.
 */
export function OfferMiniGallery({
  images,
  limit = 5,
  label = "Galeria zdjęć",
  className,
}: Props) {
  const lightbox = useGalleryLightbox();
  if (!images || images.length === 0) return null;

  const visible = images.slice(0, limit);
  const hiddenCount = images.length - visible.length;
  const total = images.length;

  const openAt = (index: number, el: HTMLElement | null) => {
    lightbox?.openAt(index, el);
  };

  const heroSrc = visible[0];
  const sideThumbs = visible.slice(1);
  const overflowIdx = sideThumbs.length - 1;

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-500">
          {label}
          <span className="ml-2 text-ink-400 normal-case tracking-normal">
            · {total} {pluralPhotos(total)}
          </span>
        </p>
        <button
          type="button"
          onClick={(e) => openAt(0, e.currentTarget)}
          className="text-[12px] font-medium text-ink-700 hover:text-brand-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          Otwórz galerię
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path
              d="M2 5h6M5 2l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-4 grid-rows-2 gap-1.5 sm:gap-2">
        {/* Duży kafel — od razu czyta się jako "to jest galeria, kliknij". */}
        {heroSrc ? (
          <button
            type="button"
            onClick={(e) => openAt(0, e.currentTarget)}
            aria-label="Otwórz pierwsze zdjęcie galerii"
            className="group relative col-span-2 row-span-2 aspect-[4/5] sm:aspect-auto overflow-hidden rounded-[var(--radius-sm)] ring-1 ring-ink-200/80 transition-all duration-200 hover:ring-ink-400 hover:shadow-[0_8px_20px_-8px_rgba(11,15,20,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
          >
            <Image
              src={heroSrc}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 50vw, 260px"
              quality={70}
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-900 shadow-sm">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                <rect x="1.25" y="2.5" width="9.5" height="7" rx="1" stroke="currentColor" strokeWidth="1.1" />
                <circle cx="4" cy="5.25" r="0.9" fill="currentColor" />
                <path d="M2 9l3-2.5 2 1.5 2-1.75 2 1.75" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="none" />
              </svg>
              Galeria
            </span>
          </button>
        ) : null}

        {sideThumbs.map((src, i) => {
          const realIdx = i + 1;
          const isLast = i === overflowIdx && hiddenCount > 0;
          return (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={(e) => openAt(realIdx, e.currentTarget)}
              aria-label={
                isLast
                  ? `Zobacz wszystkie ${total} ${pluralPhotos(total)}`
                  : `Otwórz zdjęcie ${realIdx + 1}`
              }
              className="group relative aspect-square overflow-hidden rounded-[var(--radius-sm)] ring-1 ring-ink-200/80 transition-all duration-200 hover:ring-ink-400 hover:shadow-[0_6px_16px_-6px_rgba(11,15,20,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover transition-transform duration-400 group-hover:scale-[1.06]"
                sizes="140px"
                quality={60}
              />
              {isLast && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-ink-950/72 text-white backdrop-blur-[2px]">
                  <span className="font-display text-[18px] md:text-[20px] leading-none tabular-nums">
                    +{hiddenCount}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/85">
                    {pluralPhotos(hiddenCount)}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={(e) => openAt(0, e.currentTarget)}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-200/80 bg-paper px-4 py-2.5 text-[12.5px] font-medium text-ink-900 transition-colors hover:border-ink-400 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <rect x="1.75" y="3" width="10.5" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="4.75" cy="6" r="1" fill="currentColor" />
          <path d="M2.75 10.25l3.25-2.75 2.25 1.75 2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
        </svg>
        Pokaż wszystkie zdjęcia ({total})
      </button>
    </div>
  );
}
