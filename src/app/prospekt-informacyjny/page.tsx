import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Prospekt informacyjny - Fibra Nieruchomości",
  description:
    "Prospekt informacyjny inwestycji Osiedle Zamysłów - podpisany dokument do pobrania.",
  alternates: { canonical: "/prospekt-informacyjny" },
  openGraph: {
    title: "Prospekt informacyjny - Fibra Nieruchomości",
    description: "Pobierz podpisany prospekt informacyjny inwestycji Osiedle Zamysłów.",
    url: "/prospekt-informacyjny",
    type: "website",
    locale: "pl_PL",
  },
};

// TODO: Bartek dośle finalny PDF - wtedy podmień URL na hostowany u nas
// (np. Supabase Storage `documents/prospekt-informacyjny.pdf`).
const PROSPEKT_URL =
  "https://p1.galapp.net/BCK/0309/Web/e0ec1d5c/Grafika/Prospekt_informacyjny_128F_podpisany.pdf";

export default function ProspektInformacyjnyPage() {
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
                  Prospekt informacyjny
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h1
                  className="font-display text-ink-950 leading-[1.05] tracking-tight text-balance"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
                >
                  Pełne dane inwestycji - czarno na białym.
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-5 md:mt-8 text-[16px] md:text-[19px] leading-[1.55] text-ink-700 text-pretty">
                  Prospekt informacyjny przygotowany zgodnie z Ustawą Deweloperską. Zawiera
                  wszystkie dane dewelopera, charakterystykę przedsięwzięcia, harmonogram, opis
                  działki, standardu i zabezpieczeń środków nabywcy.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Document card */}
        <section className="relative py-12 md:py-20 bg-paper-warm border-y border-ink-200/60">
          <div className="container-xl">
            <Reveal>
              <article className="mx-auto max-w-4xl rounded-2xl bg-white border border-ink-200/60 shadow-[var(--shadow-card)] p-8 md:p-12">
                <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-10 items-start">
                  <div className="mx-auto md:mx-0 flex h-24 w-20 md:h-32 md:w-24 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-soft)]">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
                      <path
                        d="M8 4h12l6 6v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path d="M20 4v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <path
                        d="M11 17h10M11 21h10M11 25h6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Dokument PDF · Podpisany
                    </p>
                    <h2 className="mt-2 font-display text-ink-950 text-[1.75rem] md:text-[2.2rem] leading-tight tracking-tight">
                      Prospekt informacyjny - Osiedle Zamysłów
                    </h2>
                    <p className="mt-4 text-[15.5px] md:text-[16px] text-ink-700 leading-[1.7] max-w-2xl">
                      Pobierz aktualną wersję prospektu. Dokument otworzy się w nowej karcie -
                      możesz go również zapisać lub wydrukować.
                    </p>

                    <div className="mt-7 flex flex-col sm:flex-row gap-3">
                      <a
                        href={PROSPEKT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-950 text-white px-7 py-3.5 text-[14px] md:text-[15px] font-medium transition-colors hover:bg-brand-500 active:scale-[0.98]"
                      >
                        Otwórz prospekt (PDF)
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                          <path
                            d="M3 11L11 3M11 3H5M11 3v6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>

            <Reveal delay={140}>
              <p className="mt-8 mx-auto max-w-3xl text-center text-[12.5px] text-ink-500 leading-[1.6]">
                Prospekt informacyjny stanowi integralną część umowy deweloperskiej. Dokument
                aktualizowany przez dewelopera - w razie wątpliwości skontaktuj się z nami przed
                podjęciem decyzji.
              </p>
            </Reveal>
          </div>
        </section>

        {/* CTA + powiązane */}
        <section className="relative py-20 md:py-28">
          <div className="container-xl text-center max-w-3xl mx-auto">
            <Reveal>
              <h2
                className="font-display text-ink-950 tracking-tight leading-[1.02]"
                style={{ fontSize: "clamp(1.65rem, 4vw, 2.6rem)" }}
              >
                Masz pytania do prospektu?
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-5 text-[16px] md:text-[18px] text-ink-700 leading-[1.65]">
                Zadzwoń, napisz albo skorzystaj z formularza - przeprowadzimy Cię przez dokument
                punkt po punkcie.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium transition-colors active:scale-[0.98]"
                >
                  Skontaktuj się
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
                  href="/przewodnik-inwestora"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-900/15 text-ink-900 hover:bg-ink-900 hover:text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium transition-colors active:scale-[0.98]"
                >
                  Przewodnik Inwestora
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
