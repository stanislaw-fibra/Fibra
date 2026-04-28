"use client";

import { useMemo, useState } from "react";
import type { Offer } from "@/lib/offers";
import { Reveal } from "@/components/ui/Reveal";
import { VideoCard } from "@/components/home/VideoCard";
import { ListVideoPlaybackProvider } from "@/components/media/ListVideoPlayback";
import { OfferGalleryCard } from "@/components/offers/OfferGalleryCard";
import { activeFilterCount, applyFilters, useFilters, DEFAULT_FILTERS } from "./filters-state";
import { FiltersBar } from "./_ui/FiltersBar";
import { FiltersDrawer } from "./_ui/FiltersDrawer";
import { ActiveFilterChips } from "./_ui/ActiveFilterChips";

type Props = {
  allOffers: Offer[];
};

export function OfertyPageClient({ allOffers }: Props) {
  const { filters, apply, reset, isPending } = useFilters();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const videoOffers = useMemo(() => allOffers.filter((o) => o.hasShortVideo), [allOffers]);

  // Oferty po zastosowaniu filtrów - osobno dla każdego widoku (bo "video" zawsze
  // ogranicza się do ofert z krótkim filmem).
  const videoFiltered = useMemo(() => applyFilters(videoOffers, filters), [videoOffers, filters]);
  const galleryFiltered = useMemo(() => applyFilters(allOffers, filters), [allOffers, filters]);

  const currentList = filters.view === "video" ? videoFiltered : galleryFiltered;

  const advanced = useMemo(() => {
    const full = activeFilterCount(filters);
    // Jeśli na pasku jest kategoria/listing/cities/price/rooms to nie licz ich do "zaawansowanych".
    const basic =
      (filters.categories.length ? 1 : 0) +
      (filters.listing !== "all" ? 1 : 0) +
      (filters.cities.length ? 1 : 0) +
      (filters.priceMin != null || filters.priceMax != null ? 1 : 0) +
      (filters.rooms.length ? 1 : 0);
    return Math.max(0, full - basic);
  }, [filters]);

  const orderedSlugs = useMemo(() => videoFiltered.map((o) => o.slug), [videoFiltered]);

  const cities = useMemo(() => {
    const set = new Map<string, number>();
    for (const o of allOffers) {
      const c = o.city?.trim();
      if (!c) continue;
      set.set(c, (set.get(c) ?? 0) + 1);
    }
    return [...set.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pl"))
      .map(([c]) => c);
  }, [allOffers]);

  return (
    <>
      <FiltersBar
        offers={allOffers}
        filters={filters}
        apply={apply}
        reset={() => reset(true)}
        totalMatches={galleryFiltered.length}
        totalVideoMatches={videoFiltered.length}
        advancedCount={advanced}
        onOpenDrawer={() => setDrawerOpen(true)}
        isPending={isPending}
      />

      <section className="py-5 md:py-8">
        <div className="container-xl">
          <ActiveFilterChips filters={filters} apply={apply} />

          <div
            className={[
              "transition-opacity duration-200 will-change-[opacity]",
              isPending ? "opacity-60" : "opacity-100",
            ].join(" ")}
            aria-busy={isPending || undefined}
          >
          {filters.view === "video" ? (
            <VideoView offers={videoFiltered} orderedSlugs={orderedSlugs} />
          ) : (
            <GalleryView offers={galleryFiltered} />
          )}

          {currentList.length === 0 && (
            <EmptyState
              view={filters.view}
              videoCount={videoFiltered.length}
              galleryCount={galleryFiltered.length}
              onSwitchView={(v) => apply({ view: v })}
              onReset={() => reset(true)}
            />
          )}

          {filters.view === "video" &&
            videoFiltered.length > 0 &&
            galleryFiltered.length > videoFiltered.length && (
              <VideoTailCta
                extra={galleryFiltered.length - videoFiltered.length}
                onSwitch={() => apply({ view: "gallery" })}
              />
            )}
          </div>
        </div>
      </section>

      <FiltersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        apply={apply}
        advancedCount={advanced}
        matchesCount={currentList.length}
        cities={cities}
      />
    </>
  );
}

function VideoView({ offers, orderedSlugs }: { offers: Offer[]; orderedSlugs: string[] }) {
  if (offers.length === 0) return null;
  // Mobile: pojedyncza kolumna scrollowana w pionie (Reels-style, ale z widocznym
  // tytułem i kawałkiem opisu pod każdym filmem - clean, professional). Mode
  // "viewport-center" oznacza, że gra TEN kafel, który jest najbardziej widoczny;
  // reszta zostaje pre-loaded jako sąsiad (±1) i muted.
  // Aspect 3/4 na mobile - na tyle pionowy, by film dominował, ale zostawia
  // pod kafelkem realne miejsce na podpis: eyebrow, tytuł, 2-liniowy excerpt
  // i meta z ceną. Dzięki temu pierwszy film mieści się w viewportcie razem
  // z początkiem opisu (clean, professional).
  // Desktop wraca do klasycznej siatki 9:16 z 3-4 kolumnami.
  return (
    <ListVideoPlaybackProvider orderedSlugs={orderedSlugs} mobileMode="viewport-center">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7 md:gap-5 lg:gap-6 max-w-[520px] md:max-w-none mx-auto">
        {offers.map((o, i) => (
          <Reveal key={o.slug} delay={(i % 6) * 70}>
            <VideoCard
              offer={o}
              index={i}
              priority={i < 2}
              showCardFooter
              aspectClass="aspect-[3/4] md:aspect-[5/7] lg:aspect-[9/16]"
            />
          </Reveal>
        ))}
      </div>
    </ListVideoPlaybackProvider>
  );
}

function GalleryView({ offers }: { offers: Offer[] }) {
  if (offers.length === 0) return null;
  // Galeria zostaje 1-kol na mobile (specs i opis potrzebują szerokości),
  // 2-kol od sm i 3-kol od lg.
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
      {offers.map((o, i) => (
        <Reveal key={o.slug} delay={(i % 6) * 60}>
          <OfferGalleryCard offer={o} priority={i < 3} />
        </Reveal>
      ))}
    </div>
  );
}

function EmptyState({
  view,
  videoCount,
  galleryCount,
  onSwitchView,
  onReset,
}: {
  view: "video" | "gallery";
  videoCount: number;
  galleryCount: number;
  onSwitchView: (v: "video" | "gallery") => void;
  onReset: () => void;
}) {
  const noneInGallery = galleryCount === 0;
  const canSwitchToGallery = view === "video" && galleryCount > 0;

  return (
    <div className="mt-6 rounded-[var(--radius-lg)] border border-ink-200/80 bg-paper-warm/60 px-6 py-14 text-center">
      <p className="eyebrow text-ink-500 mb-3">Brak wyników</p>
      <h3 className="font-display text-[22px] md:text-[26px] text-ink-950 max-w-[30ch] mx-auto leading-tight">
        {noneInGallery
          ? "Nic nie pasuje do tych kryteriów"
          : "W tym widoku nic nie znaleźliśmy — ale w pełnym katalogu tak"}
      </h3>
      <p className="mt-3 text-[14px] text-ink-600 max-w-md mx-auto">
        {canSwitchToGallery
          ? `W widoku zdjęciowym jest aż ${galleryCount} ofert pasujących do Twoich filtrów.`
          : "Spróbuj poluzować filtry lub zacznij od nowa — pokażemy wszystko."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {canSwitchToGallery && (
          <button
            type="button"
            onClick={() => onSwitchView("gallery")}
            className="inline-flex items-center gap-2 rounded-full bg-ink-950 hover:bg-brand-500 text-white px-5 py-2.5 text-[13px] font-medium transition-colors"
          >
            Pokaż {galleryCount} ofert w widoku zdjęciowym
            <Arrow />
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-ink-300 text-ink-900 hover:border-brand-500 hover:text-brand-600 px-5 py-2.5 text-[13px] font-medium transition-colors"
        >
          Wyczyść filtry
        </button>
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-ink-500">
        {galleryCount}{" "}
        {galleryCount === 1 ? "oferta" : galleryCount < 5 ? "oferty" : "ofert"} w widoku klasycznym
      </p>
    </div>
  );
}

function VideoTailCta({ extra, onSwitch }: { extra: number; onSwitch: () => void }) {
  return (
    <div className="mt-14 md:mt-20 flex justify-center">
      <button
        type="button"
        onClick={onSwitch}
        className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/80 bg-paper px-6 py-6 md:px-10 md:py-8 text-center transition-all hover:border-ink-400 hover:shadow-[0_18px_48px_-24px_rgba(11,15,20,0.25)]"
      >
        <p className="eyebrow text-ink-500 mb-2">Nie znalazłeś tego, czego szukasz?</p>
        <p className="font-display text-[22px] md:text-[28px] leading-tight text-ink-950 max-w-[26ch]">
          Przełącz na widok klasyczny — jest tam {extra}{" "}
          {extra === 1 ? "dodatkowa oferta" : extra < 5 ? "dodatkowe oferty" : "dodatkowych ofert"}.
        </p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink-950 group-hover:bg-brand-500 text-white px-5 py-2.5 text-[13px] font-medium transition-colors">
          Pokaż wszystkie oferty
          <Arrow />
        </span>
      </button>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 7h8M7 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { DEFAULT_FILTERS };
