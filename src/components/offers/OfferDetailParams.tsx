import type { Offer } from "@/lib/offers";
import {
  getOfferExtendedParamItems,
  highlightFallbackItems,
  type OfferParamItem,
} from "@/lib/offer-detail-params";

function ParamCell({ item }: { item: OfferParamItem }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-ink-950/80 p-5 md:p-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-400">{item.label}</p>
      {item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-display text-[17px] md:text-[18px] text-accent-400 hover:text-accent-300 transition-colors"
        >
          {item.value}
        </a>
      ) : (
        <p className="mt-2 font-display text-[17px] md:text-[19px] leading-snug text-white">{item.value}</p>
      )}
    </div>
  );
}

export function OfferDetailParams({ offer }: { offer: Offer }) {
  const extended = getOfferExtendedParamItems(offer);
  const items = extended.length > 0 ? extended : highlightFallbackItems(offer);

  if (items.length === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-ink-950 text-ink-100">
      <div className="container-xl">
        <p className="eyebrow eyebrow-on-dark flex items-center gap-3 mb-6 md:mb-8">
          <span className="inline-block w-8 h-px bg-accent-400" />
          Parametry oferty
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {items.map((item, i) => (
            <ParamCell key={`${item.label}-${i}-${item.value.slice(0, 24)}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
