"use client";

import Image from "next/image";
import Link from "next/link";
import type { Offer } from "@/lib/offers";
import { priceShort } from "@/lib/offers";
import { OfferListingTypeTag } from "@/components/offers/OfferListingTypeTag";

type Props = {
  offer: Offer;
  priority?: boolean;
};

function metaLine(offer: Offer): string {
  const parts: string[] = [];
  if (offer.city) parts.push(offer.city);
  if (offer.district) parts.push(offer.district);
  parts.push(offer.kindLabel);
  return parts.join(" · ");
}

function specs(offer: Offer): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  if (offer.kind === "grunt") {
    if (offer.area) out.push({ label: "Działka", value: `${offer.area.toLocaleString("pl-PL")} m²` });
  } else {
    if (offer.areaUsableM2 || offer.area)
      out.push({
        label: "Powierzchnia",
        value: `${(offer.areaUsableM2 || offer.area).toLocaleString("pl-PL")} m²`,
      });
    if (offer.rooms != null) out.push({ label: "Pokoje", value: String(offer.rooms) });
    if (offer.pietro) out.push({ label: "Piętro", value: offer.pietro });
  }
  return out.slice(0, 3);
}

/**
 * Karta oferty w widoku galerii — duży kadr, elegancka, bez auto-playback.
 * Świadomie unikamy odtwarzania wideo w tej wersji — user wszedł tu po spokojny,
 * czytelny przegląd oferty ze zdjęciami. Wideo kryje się na stronie szczegółów.
 */
export function OfferGalleryCard({ offer, priority = false }: Props) {
  const image =
    offer.gallery?.[0] ||
    offer.poster ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=1500&q=82";
  const hasVideo = Boolean(offer.hasShortVideo || offer.youtubeUrl);
  const price = priceShort(offer.priceFrom);
  const priceSuffix = offer.listingType === "wynajem" ? " / mies." : "";

  return (
    <Link
      href={`/oferty/${offer.slug}`}
      className="group relative block overflow-hidden rounded-[var(--radius-lg)] bg-paper ring-1 ring-ink-200/70 shadow-[var(--shadow-soft)] transition-all duration-300 hover:ring-ink-300 hover:shadow-[0_18px_48px_-24px_rgba(11,15,20,0.32)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
        <Image
          src={image}
          alt={offer.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.03]"
          priority={priority}
          quality={72}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/55 via-ink-950/0 to-ink-950/5" />

        <div className="pointer-events-none absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-1.5 gap-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <OfferListingTypeTag listingType={offer.listingType} variant="media-light" />
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {hasVideo && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-950/70 backdrop-blur-md text-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
                  <path d="M3 2l5 3-5 3V2z" />
                </svg>
                Wideo
              </span>
            )}
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
          <span className="text-[10.5px] uppercase tracking-[0.18em] text-white/75 line-clamp-1">
            {metaLine(offer)}
          </span>
          <span className="font-display text-[14.5px] md:text-[15.5px] leading-none text-white tabular-nums">
            {price}
            <span className="text-white/70 text-[11px] font-normal">{priceSuffix}</span>
          </span>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <h3 className="font-display text-[17.5px] md:text-[18.5px] leading-[1.25] text-ink-950 line-clamp-2">
          {offer.title}
        </h3>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {specs(offer).map((s) => (
            <div
              key={s.label}
              className="rounded-[var(--radius-sm)] bg-paper-warm/70 ring-1 ring-ink-200/60 py-2 px-1.5"
            >
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink-500">{s.label}</p>
              <p className="mt-0.5 text-[13px] font-medium text-ink-900 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end text-[12.5px]">
          <span className="inline-flex items-center gap-1 text-ink-900 font-medium transition-colors group-hover:text-brand-500">
            Zobacz ofertę
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3 7h8M7 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
