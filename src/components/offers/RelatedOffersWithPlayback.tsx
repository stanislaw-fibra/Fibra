"use client";

import { useMemo, useRef } from "react";
import type { Offer } from "@/lib/offers";
import { VideoCard } from "@/components/home/VideoCard";
import { Reveal } from "@/components/ui/Reveal";
import { ListVideoPlaybackProvider } from "@/components/media/ListVideoPlayback";

export function RelatedOffersWithPlayback({ offers }: { offers: Offer[] }) {
  const slugs = useMemo(() => offers.map((o) => o.slug), [offers]);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  return (
    <ListVideoPlaybackProvider orderedSlugs={slugs} mobileMode="horizontal-scroll" mobileRootRef={mobileScrollRef}>
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
  );
}
