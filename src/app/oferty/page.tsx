import { Suspense } from "react";
import { getAllActiveOffers } from "@/lib/offers-query";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { OfertyPageClient } from "@/app/oferty/OfertyPageClient";
import { OfertyHeaderViewToggle } from "@/app/oferty/_ui/OfertyHeaderViewToggle";

export const revalidate = 60;

export const metadata = {
  title: "Oferty Fibry - Fibra Nieruchomości",
  description:
    "Aktualne oferty z powiatu rybnickiego i wodzisławskiego - wideo, wirtualny spacer 3D i pełna obsługa od pierwszego kontaktu do aktu.",
};

export default async function OfertyPage() {
  const offers = await getAllActiveOffers();
  const videoCount = offers.filter((o) => o.hasShortVideo).length;

  const offersWord =
    offers.length === 1 ? "oferta" : offers.length < 5 ? "oferty" : "ofert";

  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        {/* Pasek nagłówkowy katalogu — celowo bardzo niski, żeby oferty (wraz
            z paskiem filtrów) były widoczne nad fold od razu po wejściu, na
            mobile i na desktop. Pełny opisowy hero przeniesiony jest pod
            paskiem filtrów (sticky-like flow), ten blok służy tylko jako
            jednowierszowy „chleb" katalogu. */}
        <section className="relative overflow-hidden border-b border-ink-200/70 bg-paper">
          <div className="absolute inset-0 -z-10 grad-radial-brand opacity-25" />
          <div className="container-xl py-3 md:py-4 flex items-center justify-between gap-4">
            <Reveal className="flex items-baseline gap-3 md:gap-4 min-w-0">
              <h1 className="font-display text-ink-950 leading-none tracking-tight text-[clamp(1.05rem,3.6vw,1.5rem)] md:text-[clamp(1.2rem,2vw,1.65rem)] truncate">
                Oferty Fibry
              </h1>
              <span
                aria-hidden
                className="hidden sm:inline-block h-3 w-px bg-ink-300"
              />
              <div className="hidden sm:flex items-center gap-3 min-w-0">
                <p className="text-[11.5px] md:text-[12px] uppercase tracking-[0.14em] text-ink-500 truncate">
                  {offers.length} {offersWord} · {videoCount} z filmem
                </p>
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400 select-none"
                  aria-hidden
                >
                  Widok
                </span>
                <Suspense fallback={null}>
                  <OfertyHeaderViewToggle />
                </Suspense>
              </div>
            </Reveal>
            <Reveal
              delay={60}
              className="sm:hidden text-[10.5px] uppercase tracking-[0.14em] text-ink-500 whitespace-nowrap"
            >
              {offers.length} {offersWord} · {videoCount} wideo
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
