"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import type { Offer } from "@/lib/offers";
import { VideoCard } from "@/components/home/VideoCard";
import { ListVideoPlaybackProvider } from "@/components/media/ListVideoPlayback";

/** Maks. liczba kafelków w hero - wyłącznie unikalne oferty (bez powtórki 1–4 jako 5–8). */
const HERO_MAX = 8;

export function OpeningReelsGrid({ offers }: { offers: Offer[] }) {
  const featured = useMemo(() => offers.slice(0, HERO_MAX), [offers]);
  const slugs = useMemo(() => featured.map((o) => o.slug), [featured]);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  return (
    <ListVideoPlaybackProvider orderedSlugs={slugs} mobileMode="horizontal-scroll" mobileRootRef={mobileScrollRef}>
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 xl:gap-5 w-full items-stretch">
        {featured.map((o, i) => (
          <div key={o.slug} className="flex justify-center min-w-0">
            <div className="w-full max-w-[300px] lg:max-w-none">
              <VideoCard
                offer={o}
                index={i}
                priority={i < 3}
                showCardFooter={false}
                showPrice={false}
                surfaceTheme="hero"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="md:hidden -mx-5 flex-1 flex flex-col justify-center min-h-0">
        <div ref={mobileScrollRef} className="snap-x-strong flex gap-3 overflow-x-auto px-5 pb-3 pt-1">
          {featured.map((o, i) => (
            <div key={o.slug} className="snap-item shrink-0 w-[76vw] max-w-[300px]">
              <VideoCard
                offer={o}
                index={i}
                priority={i === 0}
                showCardFooter={false}
                showPrice={false}
                surfaceTheme="hero"
              />
            </div>
          ))}
        </div>
        <div className="px-5 pt-2 flex justify-between items-center text-[11px] uppercase tracking-[0.18em] text-white/35">
          <span>Przesuń w bok</span>
          <Link
            href="/oferty?view=video"
            className="text-white/70 hover:text-accent-400 transition-colors normal-case tracking-normal text-[13px] font-medium"
          >
            Wszystkie oferty →
          </Link>
        </div>
      </div>
    </ListVideoPlaybackProvider>
  );
}
