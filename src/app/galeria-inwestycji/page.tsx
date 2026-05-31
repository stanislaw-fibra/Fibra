import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { GallerySection, type GalleryCollection } from "@/components/investments/GallerySection";

export const metadata: Metadata = {
  title: "Galeria inwestycji - Fibra Nieruchomości",
  description:
    "Galeria zdjęć inwestycji Grupy Fibra - Osiedle Zamysłów (Etap II, Etap III) i inne realizacje na Śląsku.",
  alternates: { canonical: "/galeria-inwestycji" },
  openGraph: {
    title: "Galeria inwestycji - Fibra Nieruchomości",
    description: "Zobacz nasze inwestycje - od wizualizacji po gotowe budynki.",
    url: "/galeria-inwestycji",
    type: "website",
    locale: "pl_PL",
  },
};

// TODO (Supabase): docelowo `getGalleryCollections()` z bucketa storage `investment-gallery`,
// pogrupowane po `investment_slug`. Na razie układ z placeholderami - UI jest już gotowy
// na ładowanie dynamicznych zdjęć (komponent GallerySection przyjmuje listę zdjęć).
const COLLECTIONS: GalleryCollection[] = [
  {
    slug: "zamyslow-etap-iii",
    title: "Osiedle Zamysłów - Etap III",
    description:
      "Aktualnie realizowany etap inwestycji w Rybniku-Zamysłowie. Termin oddania: II/2026.",
    location: "Rybnik · Zamysłów",
    status: "W budowie",
    photos: [],
    placeholderCount: 8,
  },
  {
    slug: "zamyslow-etap-ii",
    title: "Osiedle Zamysłów - Etap II",
    description:
      "Ukończony etap inwestycji - gotowe lokale, zagospodarowanie terenu i część wspólna.",
    location: "Rybnik · Zamysłów",
    status: "Zrealizowane",
    photos: [],
    placeholderCount: 8,
  },
  {
    slug: "wczesniejsze-realizacje",
    title: "Wcześniejsze realizacje",
    description:
      "Wybór projektów zrealizowanych przez Grupę Fibra w regionie rybnickim od 2006 roku.",
    location: "Śląsk",
    status: "Archiwum",
    photos: [],
    placeholderCount: 6,
  },
];

export default function GaleriaInwestycjiPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Galeria inwestycji
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h1
                  className="font-display text-ink-950 leading-[1.05] tracking-tight text-balance"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
                >
                  Nasze projekty - od projektu do kluczy.
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-5 md:mt-8 text-[16px] md:text-[19px] leading-[1.55] text-ink-700 text-pretty">
                  Zdjęcia z placu budowy, wizualizacje i gotowe lokale. Galeria jest na bieżąco
                  uzupełniana - sprawdzaj postępy lub zapisz się na newsletter, żeby nie przegapić
                  nowych ujęć.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  {COLLECTIONS.map((c) => (
                    <a
                      key={c.slug}
                      href={`#${c.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 bg-white/60 hover:bg-ink-900 hover:text-white px-4 py-2 text-[13px] font-medium text-ink-800 backdrop-blur transition-colors"
                    >
                      {c.title}
                    </a>
                  ))}
                </nav>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Kolekcje */}
        <div className="border-t border-ink-200/60">
          {COLLECTIONS.map((collection, i) => (
            <GallerySection
              key={collection.slug}
              collection={collection}
              tone={i % 2 === 0 ? "paper" : "white"}
            />
          ))}
        </div>

        {/* CTA */}
        <section className="relative py-20 md:py-28 bg-ink-950 text-ink-100 overflow-hidden">
          <div className="absolute inset-0 grad-radial-brand opacity-40" aria-hidden />
          <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
          <div className="container-xl relative text-center max-w-3xl mx-auto">
            <Reveal>
              <h2
                className="font-display text-white tracking-tight leading-[1.05]"
                style={{ fontSize: "clamp(1.85rem, 4.5vw, 3rem)" }}
              >
                Chcesz obejrzeć inwestycję na żywo?
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-5 text-[16px] md:text-[18px] text-ink-200 leading-[1.65]">
                Umówimy Cię na spotkanie na miejscu lub pokażemy lokal podczas spaceru online.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium transition-colors active:scale-[0.98]"
                >
                  Umów spotkanie
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M3 7h8M7 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <Link
                  href="/zamyslow"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white hover:text-ink-950 text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium transition-colors active:scale-[0.98]"
                >
                  Osiedle Zamysłów
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
