import type { Metadata } from "next";
import Link from "next/link";
import { ZamyslowNav } from "@/components/investments/zamyslow/ZamyslowNav";
import { ZamyslowFooter } from "@/components/investments/zamyslow/ZamyslowFooter";
import { Reveal } from "@/components/ui/Reveal";
import { InvestmentGallery } from "@/components/investments/InvestmentGallery";
import { getGalleryPhotos } from "@/lib/gallery-query";

export const metadata: Metadata = {
  title: "Galeria inwestycji - Fibra Nieruchomości",
  description:
    "Zdjęcia budynków, które Grupa Fibra już wybudowała - Rybnik-Zamysłów i okolice.",
  alternates: { canonical: "/galeria-inwestycji" },
  openGraph: {
    title: "Galeria inwestycji - Fibra Nieruchomości",
    description: "Zdjęcia z inwestycji, które już stoją.",
    url: "/galeria-inwestycji",
    type: "website",
    locale: "pl_PL",
  },
};

// Zdjęcia idą prosto z bucketa Storage - dorzucenie nowego pliku wystarczy,
// żeby pojawiło się w galerii (kolejność bierze się z nazwy pliku).
export const revalidate = 3600;

export default async function GaleriaInwestycjiPage() {
  const photos = await getGalleryPhotos();

  return (
    <>
      <ZamyslowNav />
      <main className="flex-1 pt-[72px]">
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Galeria
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h1
                  className="font-display text-ink-950 leading-[1.05] tracking-tight text-balance"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
                >
                  Zdjęcia z naszych inwestycji.
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-5 md:mt-8 text-[16px] md:text-[19px] leading-[1.55] text-ink-700 text-pretty">
                  Budynki, które już stoją - Rybnik-Zamysłów i okolice.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Zdjęcia */}
        <section className="relative border-t border-ink-200/60 bg-paper-warm py-14 md:py-20">
          <div className="container-xl">
            <InvestmentGallery photos={photos} />
          </div>
        </section>

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
      <ZamyslowFooter />
    </>
  );
}
