import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";

export const metadata: Metadata = {
  title:
    "Czy inwestycja w mieszkanie na wynajem jest dla mnie? | Fibra Nieruchomości",
  description:
    "Poradnik dla osób, które rozważają pierwsze mieszkanie na wynajem: za i przeciw, sytuacja rynkowa i na co uważać. Artykuł w przygotowaniu.",
  robots: { index: false, follow: false },
};

export default function CzyInwestycjaPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <article className="bg-paper">
          <div className="container-xl py-24 md:py-32">
            <div className="mx-auto max-w-[58ch]">
              <p className="eyebrow flex items-center gap-3">
                <span className="inline-block h-px w-8 bg-brand-500" />
                Poradnik dla inwestora
              </p>
              <h1 className="mt-6 font-display fluid-h2 text-ink-950">
                Czy inwestycja w mieszkanie na wynajem{" "}
                <em className="italic text-brand-600">jest dla mnie?</em>
              </h1>
              <p className="mt-6 text-[17px] leading-relaxed text-ink-600">
                Zanim wyłożysz pieniądze, warto na spokojnie rozważyć za i
                przeciw. Przygotowujemy obszerny, uczciwy przewodnik: kiedy taka
                inwestycja ma sens, kiedy lepiej się wstrzymać, jak wygląda
                sytuacja rynkowa i jakie koszty oraz ryzyka łatwo przeoczyć.
              </p>

              {/* Stan przejściowy: artykuł w budowie. Gdy treść będzie gotowa,
                  zastąp ten blok właściwymi sekcjami (za i przeciw, sytuacja
                  rynkowa, koszty, ryzyka, dla kogo to jest, a dla kogo nie). */}
              <div className="mt-12 rounded-[var(--radius-lg)] border border-dashed border-ink-300 bg-white/60 px-8 py-14 text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-1.5 text-[12px] font-medium uppercase tracking-[0.14em] text-white">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400/70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-400" />
                  </span>
                  Artykuł w przygotowaniu
                </span>
                <p className="mx-auto mt-6 max-w-[44ch] text-[15px] leading-relaxed text-ink-500">
                  Pełna wersja pojawi się wkrótce. Jeśli już teraz masz pytania o
                  inwestycję na Osiedlu Zamysłów, najszybciej pomożemy w rozmowie.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/zamyslow#kontakt"
                    className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-7 py-3.5 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-brand-500"
                  >
                    Zapytaj o inwestycję
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link
                    href="/zamyslow"
                    className="inline-flex items-center gap-2 rounded-full border border-ink-300 px-7 py-3.5 text-[13px] font-medium text-ink-700 transition-colors duration-300 hover:border-ink-900 hover:text-ink-950"
                  >
                    Wróć do Osiedla Zamysłów
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
