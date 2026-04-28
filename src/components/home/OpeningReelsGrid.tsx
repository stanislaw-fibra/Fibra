"use client";

import { useMemo } from "react";
import type { Offer } from "@/lib/offers";
import { VideoCard } from "@/components/home/VideoCard";
import { ListVideoPlaybackProvider } from "@/components/media/ListVideoPlayback";

/** Maks. liczba kafli w hero — desktop wymaga 4-kolumnowej, jednej linii. */
const HERO_MAX_DESKTOP = 4;
/** Mobile: dokładnie 4 kafle (2x2 grid w stylu YT Shorts) — pierwszy gra, reszta to plakaty. */
const HERO_MAX_MOBILE = 4;

export function OpeningReelsGrid({ offers }: { offers: Offer[] }) {
  const desktopFeatured = useMemo(() => offers.slice(0, HERO_MAX_DESKTOP), [offers]);
  const mobileFeatured = useMemo(() => offers.slice(0, HERO_MAX_MOBILE), [offers]);
  const desktopSlugs = useMemo(() => desktopFeatured.map((o) => o.slug), [desktopFeatured]);
  const mobileSlugs = useMemo(() => mobileFeatured.map((o) => o.slug), [mobileFeatured]);

  return (
    <>
      {/* DESKTOP — 4 kafle obok siebie, pełny premium look.
          Od md+ wymuszamy 4 kolumny (a nie 2) aby na laptopie ofery były widoczne
          nad fold zaraz po wejściu. Aspect spłaszczony do 4:5 / 5:7 na średnich
          ekranach, dopiero od xl wracamy do pełnego pionowego 9:16. */}
      <div className="hidden md:block">
        <ListVideoPlaybackProvider orderedSlugs={desktopSlugs} mobileMode="horizontal-scroll">
          <div className="grid md:grid-cols-4 gap-3 lg:gap-4 xl:gap-5 w-full items-stretch">
            {desktopFeatured.map((o, i) => (
              <VideoCard
                key={o.slug}
                offer={o}
                index={i}
                priority={i < 3}
                showCardFooter={false}
                showPrice={false}
                surfaceTheme="hero"
                aspectClass="aspect-[4/5] lg:aspect-[5/7] xl:aspect-[9/16]"
              />
            ))}
          </div>
        </ListVideoPlaybackProvider>
      </div>

      {/* MOBILE — siatka 2x2 (Reels-style). 9:16 ≈ klasyczny pion z kamery / Shorts;
          metraż pod kaflem w VideoCard. */}
      <div className="md:hidden w-full">
        <ListVideoPlaybackProvider orderedSlugs={mobileSlugs} mobileMode="grid-first">
          <div className="grid grid-cols-2 gap-2.5 w-full">
            {mobileFeatured.map((o, i) => (
              <VideoCard
                key={o.slug}
                offer={o}
                index={i}
                priority={i === 0}
                showCardFooter={false}
                showPrice={false}
                surfaceTheme="hero"
                aspectClass="aspect-[9/16]"
              />
            ))}
          </div>
        </ListVideoPlaybackProvider>
      </div>
    </>
  );
}
