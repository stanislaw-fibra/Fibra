"use client";

import { useMemo } from "react";
import type { Offer } from "@/lib/offers";
import { VideoCard } from "@/components/home/VideoCard";
import { Reveal } from "@/components/ui/Reveal";
import { ListVideoPlaybackProvider } from "@/components/media/ListVideoPlayback";

export function OfertyCatalogGrid({ offers }: { offers: Offer[] }) {
  const slugs = useMemo(() => offers.map((o) => o.slug), [offers]);

  return (
    <ListVideoPlaybackProvider orderedSlugs={slugs} mobileMode="viewport-center">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {offers.map((o, i) => (
          <Reveal key={o.slug} delay={(i % 6) * 70}>
            <VideoCard offer={o} index={i} showCardFooter />
          </Reveal>
        ))}
      </div>
    </ListVideoPlaybackProvider>
  );
}
