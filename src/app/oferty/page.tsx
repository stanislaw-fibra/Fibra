import type { ReactNode } from "react";
import { getAllOffers } from "@/lib/offers-query";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { OfertyCatalogGrid } from "@/app/oferty/OfertyCatalogGrid";

export const revalidate = 60;

export const metadata = {
  title: "Oferty Fibry — Fibra Nieruchomości",
  description:
    "Aktualne oferty z powiatu rybnickiego i wodzisławskiego — wideo, wirtualny spacer 3D i pełna obsługa od pierwszego kontaktu do aktu.",
};

function FilterChip({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-paper px-4 py-2 text-[12px] font-medium text-ink-700 hover:border-brand-400 hover:text-ink-950 transition-colors"
    >
      {children}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-40" aria-hidden>
        <path d="M2.5 3.5L5 6l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default async function OfertyPage() {
  const offers = await getAllOffers();

  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <section className="relative py-16 md:py-24 overflow-hidden border-b border-ink-200/70">
          <div className="absolute inset-0 -z-10 grad-radial-brand opacity-35" />
          <div className="container-xl">
            <Reveal>
              <p className="eyebrow flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Katalog
              </p>
              <h1 className="font-display fluid-hero text-ink-950 max-w-[14ch]">Oferty Fibry</h1>
              <p className="mt-8 max-w-2xl text-[17px] md:text-[18px] text-ink-700 leading-relaxed">
                Przeglądaj w wideo. Wchodź tylko tam, gdzie coś zatrzymuje.
              </p>
            </Reveal>

            <Reveal delay={90} className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <FilterChip>Sprzedaż / Wynajem</FilterChip>
                <FilterChip>Typ</FilterChip>
                <FilterChip>Lokalizacja</FilterChip>
                <FilterChip>Cena</FilterChip>
                <FilterChip>Pokoje</FilterChip>
              </div>
              <div
                className="inline-flex rounded-full border border-ink-200 bg-ink-50 p-1 text-[12px] font-medium"
                role="group"
                aria-label="Widok katalogu"
              >
                <span className="rounded-full bg-ink-900 text-white px-4 py-2 shadow-sm">Wideo</span>
                <button type="button" className="rounded-full px-4 py-2 text-ink-600 hover:text-ink-950 transition-colors">
                  Klasyczny
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container-xl">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-14">
              <Reveal>
                <h2 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] text-ink-950">Wszystkie pozycje</h2>
                <p className="mt-2 text-[14px] text-ink-600 max-w-lg">
                  Kliknij kartę, aby przejść do strony oferty: wideo, galeria, dane i szybki kontakt z biurem.
                </p>
              </Reveal>
              <Reveal delay={80}>
                <p className="text-[12px] uppercase tracking-[0.16em] text-ink-500">
                  {offers.length} {offers.length === 1 ? "pozycja" : offers.length < 5 ? "pozycje" : "pozycji"} w
                  katalogu
                </p>
              </Reveal>
            </div>

            <OfertyCatalogGrid offers={offers} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
