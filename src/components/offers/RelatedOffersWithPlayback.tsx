"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Offer } from "@/lib/offers";
import { VideoCard } from "@/components/home/VideoCard";
import { Reveal } from "@/components/ui/Reveal";
import { ListVideoPlaybackProvider } from "@/components/media/ListVideoPlayback";

/**
 * Sekcja „Inne oferty, które mogą Cię zainteresować".
 *
 * Zasady odtwarzania:
 * - Gdy cała sekcja jest poza viewportem (0% widoczności) — NIC się nie odtwarza
 *   i HLS nie konsumuje pasma. Film nie leci „w tle".
 * - Desktop: start tylko po hoverze na karcie (bez fallbacku do pierwszej).
 * - Mobile: najbliższa centrum karta gra, sąsiadująca jest primowana cicho
 *   (logika VideoCard + GridClipSurface), dzięki czemu przesuwanie jest seamless.
 */
export function RelatedOffersWithPlayback({ offers }: { offers: Offer[] }) {
  const slugs = useMemo(() => offers.map((o) => o.slug), [offers]);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // Włączamy odtwarzanie, gdy jakikolwiek fragment sekcji jest w viewporcie.
          // Wyłączamy, gdy sekcja w pełni zniknie (intersectionRatio === 0 przy !isIntersecting).
          setSectionVisible(e.isIntersecting && e.intersectionRatio > 0);
        }
      },
      { threshold: [0, 0.01, 0.1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={sectionRef}>
      <ListVideoPlaybackProvider
        orderedSlugs={slugs}
        mobileMode="horizontal-scroll"
        mobileRootRef={mobileScrollRef}
        enabled={sectionVisible}
        desktopRequireHover
      >
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {offers.map((o, i) => (
            <Reveal key={o.slug} delay={i * 70}>
              <VideoCard offer={o} index={i} variant="compact" />
            </Reveal>
          ))}
        </div>
        <div className="md:hidden -mx-5">
          <div ref={mobileScrollRef} className="snap-x-strong flex gap-4 overflow-x-auto px-5 pb-4">
            {offers.map((o, i) => (
              <div key={o.slug} className="snap-item shrink-0 w-[72vw] max-w-[320px]">
                <VideoCard offer={o} index={i} variant="compact" />
              </div>
            ))}
          </div>
        </div>
      </ListVideoPlaybackProvider>
    </div>
  );
}
