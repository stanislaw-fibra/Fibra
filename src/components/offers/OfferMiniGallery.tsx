"use client";

import Image from "next/image";
import { useGalleryLightbox } from "./GalleryLightbox";

type Props = {
  /** Docelowo oczekuje tej samej listy co Provider — używamy Providera jako single source of truth. */
  images: string[];
  /** Liczba widocznych miniaturek (kolumn). Domyślnie 5. */
  limit?: number;
  /** Etykieta nagłówka mini-galerii. */
  label?: string;
  className?: string;
};

/**
 * Mini-galeria pod hero oferty: 4–5 miniaturek + kafel „+N" na resztę.
 * Klik → otwiera pełnoekranowy lightbox przy dokładnie klikniętym zdjęciu
 * (bez kotwicy / przewijania do sekcji #galeria).
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

  const openAt = (index: number, el: HTMLElement | null) => {
    lightbox?.openAt(index, el);
  };

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
        <button
          type="button"
          onClick={(e) => openAt(0, e.currentTarget)}
          className="text-[12px] font-medium text-ink-700 hover:text-brand-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          Wszystkie ({images.length})
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

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(visible.length, limit)}, minmax(0, 1fr))` }}
      >
        {visible.map((src, i) => {
          const isLast = i === visible.length - 1 && hiddenCount > 0;
          return (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={(e) => openAt(i, e.currentTarget)}
              aria-label={
                isLast
                  ? `Zobacz wszystkie ${images.length} zdjęć`
                  : `Otwórz zdjęcie ${i + 1}`
              }
              className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] ring-1 ring-ink-200/80 transition-all duration-200 hover:ring-ink-400 hover:shadow-[0_6px_16px_-6px_rgba(11,15,20,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
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
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-ink-950/65 text-white text-[13px] font-medium backdrop-blur-[2px]">
                  <span className="font-display text-[18px] md:text-[20px] leading-none tabular-nums">
                    +{hiddenCount}
                  </span>
                  <span className="text-[9.5px] uppercase tracking-[0.2em] text-white/85">
                    zdjęć
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
