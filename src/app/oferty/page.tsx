import { Suspense } from "react";
import { getAllActiveOffers } from "@/lib/offers-query";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { OfertyPageClient } from "@/app/oferty/OfertyPageClient";

export const revalidate = 60;

export const metadata = {
  title: "Oferty Fibry - Fibra Nieruchomości",
  description:
    "Aktualne oferty z powiatu rybnickiego i wodzisławskiego - wideo, wirtualny spacer 3D i pełna obsługa od pierwszego kontaktu do aktu.",
};

export default async function OfertyPage() {
  const offers = await getAllActiveOffers();
  const videoCount = offers.filter((o) => o.hasShortVideo).length;

  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <section className="relative pt-16 md:pt-24 pb-10 md:pb-14 overflow-hidden border-b border-ink-200/70">
          <div className="absolute inset-0 -z-10 grad-radial-brand opacity-35" />
          <div className="container-xl">
            <Reveal>
              <p className="eyebrow flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Katalog
              </p>
              <h1 className="font-display fluid-hero text-ink-950 max-w-[14ch]">Oferty Fibry</h1>
              <p className="mt-8 max-w-2xl text-[17px] md:text-[18px] text-ink-700 leading-relaxed">
                Przeglądaj w wideo lub klasycznie ze zdjęciami. Filtruj po kategorii, cenie, lokalizacji
                i najważniejszych parametrach — wejdź tylko tam, gdzie coś Cię zatrzymuje.
              </p>
            </Reveal>

            <Reveal delay={90} className="mt-10 flex flex-wrap items-center gap-4 text-[12px] uppercase tracking-[0.16em] text-ink-500">
              <span>
                {offers.length} {offers.length === 1 ? "oferta" : offers.length < 5 ? "oferty" : "ofert"} w katalogu
              </span>
              <span className="inline-block h-1 w-1 rounded-full bg-ink-300" />
              <span>{videoCount} z filmem prezentacyjnym</span>
            </Reveal>
          </div>
        </section>

        <Suspense fallback={null}>
          <OfertyPageClient allOffers={offers} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
