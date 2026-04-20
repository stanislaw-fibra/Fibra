import Link from "next/link";
import type { Offer } from "@/lib/offers";
import { OpeningReelsGrid } from "@/components/home/OpeningReelsGrid";

const ctaArrow = (
  <svg className="shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path
      d="M3 7h8M7 3l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function OpeningReels({ offers }: { offers: Offer[] }) {
  return (
    <section className="relative min-h-[100svh] flex flex-col bg-ink-950 text-ink-100 overflow-hidden">
      <div className="absolute inset-0 grad-radial-brand opacity-70 pointer-events-none" />
      <div className="absolute inset-0 grain grain-on-dark pointer-events-none opacity-45" />

      <div className="shrink-0 h-[72px]" aria-hidden />

      <div className="container-xl relative shrink-0 pt-6 pb-6 md:pt-10 md:pb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">
        <div className="max-w-3xl">
          <p className="eyebrow eyebrow-on-dark flex items-center gap-3 mb-6">
            <span className="inline-block w-8 h-px bg-accent-400" />
            Fibra Nieruchomości
          </p>
          <h1 className="font-display text-white leading-[0.98] tracking-tight max-w-[18ch] text-[clamp(2.4rem,6.5vw,4.5rem)]">
            Znajdź swoje miejsce.
            <br />
            Zobacz je, zanim tam wejdziesz.
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:pb-1">
          <Link
            href="/oferty"
            className="inline-flex items-center gap-2 rounded-full bg-white text-ink-950 px-6 py-3 text-[13px] font-medium hover:bg-accent-400 hover:text-ink-950 transition-colors duration-300 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]"
          >
            Przeglądaj oferty
            {ctaArrow}
          </Link>
          <Link
            href="/o-fibrze"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-6 py-3 text-[13px] font-medium text-white/90 hover:bg-white/10 hover:border-white/35 transition-all duration-300"
          >
            Poznaj Fibrę
            {ctaArrow}
          </Link>
        </div>
      </div>

      <div className="container-xl relative shrink-0 pb-4 md:pb-6">
        <div className="hairline-dark-t pt-6 md:pt-8">
          <h2 className="font-display text-white fluid-h2 max-w-[20ch] leading-[1.02]">
            Aktualne <em className="italic text-accent-400">oferty</em>
          </h2>
          <p className="mt-4 text-[15px] md:text-[16px] text-white/55 max-w-[52ch] leading-[1.55]">
            Przeglądaj oferty w formie krótkich wideo i wchodź dalej tylko wtedy, gdy naprawdę coś Cię zatrzyma.
          </p>
        </div>
      </div>

      <div className="container-xl relative flex-1 min-h-0 flex flex-col justify-center py-4 md:py-8">
        <OpeningReelsGrid offers={offers} />
      </div>

      <div className="container-xl relative shrink-0 pb-10 md:pb-14">
        <div className="hairline-dark-t pt-10 md:pt-14 flex flex-col items-center">
          <Link
            href="/oferty"
            className="inline-flex items-center gap-2.5 rounded-full bg-white text-ink-950 pl-7 pr-6 py-3.5 text-[13px] font-medium hover:bg-accent-400 hover:text-ink-950 transition-colors duration-300 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]"
          >
            Przeglądaj oferty
            {ctaArrow}
          </Link>
        </div>
      </div>
    </section>
  );
}
