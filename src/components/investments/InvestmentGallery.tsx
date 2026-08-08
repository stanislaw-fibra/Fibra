"use client";

import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { GalleryLightboxProvider, useGalleryLightbox } from "@/components/offers/GalleryLightbox";
import type { GalleryPhoto } from "@/lib/gallery-query";

/**
 * Siatka zdjęć inwestycji. Bez podziału na etapy - jedna lista prosto z bucketa
 * `investment-gallery`, kolejność ustala nazwa pliku. Klik otwiera ten sam lightbox,
 * co galeria oferty (strzałki, swipe, miniatury).
 */
export function InvestmentGallery({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) return <EmptyState />;

  return (
    <GalleryLightboxProvider images={photos.map((p) => p.src)} title="Inwestycje Grupy Fibra">
      <Grid photos={photos} />
    </GalleryLightboxProvider>
  );
}

function Grid({ photos }: { photos: GalleryPhoto[] }) {
  const lightbox = useGalleryLightbox();

  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {photos.map((p, i) => (
        <Reveal key={p.name} delay={Math.min(i, 8) * 40} as="li">
          <button
            type="button"
            onClick={(e) => lightbox?.openAt(i, e.currentTarget)}
            className="group relative block w-full aspect-[4/3] overflow-hidden rounded-xl bg-ink-100 shadow-[var(--shadow-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 cursor-pointer"
            aria-label={`Otwórz zdjęcie ${i + 1} z ${photos.length}: ${p.alt}`}
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              priority={i < 4}
              loading={i < 4 ? "eager" : "lazy"}
              quality={85}
            />
            <span className="pointer-events-none absolute inset-0 bg-ink-950/0 group-hover:bg-ink-950/15 transition-colors duration-300" />
            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink-900 opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </button>
        </Reveal>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-ink-300/70 bg-gradient-to-br from-ink-50 to-paper-cream px-6 py-16 text-center">
      <p className="text-[15px] text-ink-700">
        Zdjęcia uzupełniamy - zajrzyj tu za chwilę.
      </p>
    </div>
  );
}
