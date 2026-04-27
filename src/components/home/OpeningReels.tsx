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
    // Hero zaprojektowane tak, by na pierwszym ekranie (zarówno desktop, jak i mobile)
    // user widział jednocześnie nagłówek, sekcję „Aktualne oferty" oraz cały blok kafli
    // z podpisami — bez konieczności scrollowania. Dlatego nagłówek i odstępy są
    // świadomie skompaktowane (mniejszy clamp na mobile, krótsze paddingi vertical).
    <section className="relative min-h-[100svh] flex flex-col bg-ink-950 text-ink-100 overflow-hidden">
      <div className="absolute inset-0 grad-radial-brand opacity-70 pointer-events-none" />
      <div className="absolute inset-0 grain grain-on-dark pointer-events-none opacity-45" />

      <div className="shrink-0 h-[72px]" aria-hidden />

      <div className="container-xl relative shrink-0 pt-1.5 pb-1.5 md:pt-3 md:pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-6 lg:gap-10">
        <div className="min-w-0 md:flex md:items-baseline md:gap-5 lg:gap-7">
          <p className="eyebrow eyebrow-on-dark hidden md:inline-flex items-center gap-3 shrink-0">
            <span className="inline-block w-6 lg:w-8 h-px bg-accent-400" />
            Fibra Nieruchomości
          </p>
          {/* Desktop: jednolinijkowy nagłówek + krótki dopisek po myślniku.
              Dzięki temu hero schodzi z ~3-4 linijek do 1, co radykalnie
              podnosi kafle z filmami w pierwszym ekranie. */}
          <h1 className="font-display text-white leading-[1.05] tracking-tight text-[clamp(1.2rem,4.4vw,1.7rem)] md:text-[clamp(1.35rem,2.4vw,1.85rem)] lg:text-[clamp(1.5rem,2vw,2rem)]">
            <span className="md:hidden">
              Znajdź swoje miejsce.{" "}
              <em className="italic text-accent-400">Zobacz na wideo.</em>
            </span>
            <span className="hidden md:inline whitespace-nowrap">
              Znajdź swoje miejsce.{" "}
              <em className="italic text-accent-400">Zobacz je na wideo.</em>
            </span>
          </h1>
        </div>

        <div className="hidden md:flex flex-wrap items-center gap-2 md:justify-end shrink-0">
          <Link
            href="/oferty?view=video"
            className="inline-flex items-center gap-2 rounded-full bg-white text-ink-950 px-4 py-2 text-[12px] font-medium hover:bg-accent-400 hover:text-ink-950 transition-colors duration-300 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]"
          >
            Przeglądaj oferty
            {ctaArrow}
          </Link>
        </div>
      </div>

      <div className="container-xl relative flex-1 min-h-0 flex flex-col justify-start md:justify-center py-1.5 md:py-6">
        <OpeningReelsGrid offers={offers} />
      </div>

      {/* CTA pod kaflami — kompaktowy „pasek" zamiast osobnej dużej sekcji,
          dzięki temu zarówno mobile, jak i desktop trzymają całość w pierwszym
          ekranie. Na mobile pojedynczy przycisk pełnoszerokościowy. */}
      <div className="container-xl relative shrink-0 pb-4 md:pb-10">
        <div className="hairline-dark-t pt-3 md:pt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
          <Link
            href="/oferty?view=video"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white text-ink-950 px-5 py-2.5 md:px-6 md:py-3 text-[12.5px] md:text-[13px] font-medium hover:bg-accent-400 hover:text-ink-950 transition-colors duration-300 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]"
          >
            Przeglądaj wszystkie oferty
            {ctaArrow}
          </Link>
        </div>
      </div>
    </section>
  );
}
