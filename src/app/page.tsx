import { Suspense } from "react";
import { getAllActiveOffers } from "@/lib/offers-query";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { HomeOffersHero } from "@/app/HomeOffersHero";
import { OfertyPageClient } from "@/app/oferty/OfertyPageClient";

export const revalidate = 60;

// Strona główna = katalog ofert z ciemnym hero (decyzja klienta/Romana). To, co
// kiedyś było na głównej (sekcje „o nas", spacer po biurze, proces) żyje na innych
// stronach (/o-fibrze, /sprzedaj-z-fibra, /kontakt) - nie powielamy. Stara główna
// zachowana awaryjnie pod /poprzednia-glowna (nielinkowana).
export default async function Home() {
  const offers = await getAllActiveOffers();

  return (
    <>
      <Nav />
      <main className="flex-1">
        <Suspense fallback={null}>
          <HomeOffersHero />
          <OfertyPageClient allOffers={offers} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
