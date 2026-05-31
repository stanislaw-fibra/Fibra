import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Zarządzanie najmem - Fibra Nieruchomości",
  description:
    "Kompleksowa obsługa najmu: przygotowanie mieszkania, dobór najemcy, umowy, rozliczenia, media i serwis techniczny. Pasywny dochód bez zaangażowania.",
  alternates: { canonical: "/zarzadzanie-najmem" },
  openGraph: {
    title: "Zarządzanie najmem - Fibra Nieruchomości",
    description:
      "Kompleksowa obsługa najmu: przygotowanie mieszkania, dobór najemcy, umowy, rozliczenia, media i serwis techniczny.",
    url: "/zarzadzanie-najmem",
    type: "website",
    locale: "pl_PL",
  },
};

const INVESTOR_SCOPE = [
  {
    title: "Przygotowanie mieszkania",
    body:
      "Wykończenie pod klucz, drobne poprawki, sesja zdjęciowa i przygotowanie oferty - lokal idzie na rynek w pełnej formie.",
  },
  {
    title: "Dobór najemcy",
    body:
      "Weryfikacja, rozmowy, sprawdzenie zdolności i historii - wybieramy osoby, które realnie zadbają o lokal.",
  },
  {
    title: "Obsługa administracyjna",
    body:
      "Umowy, aneksy, protokoły, rozliczenia mediów i okresowe kontrole - wszystko po naszej stronie.",
  },
  {
    title: "Inwestor zagraniczny",
    body:
      "Pełny zdalny serwis - możesz zarabiać w Polsce bez fizycznej obecności w kraju.",
  },
];

const TENANT_SCOPE = [
  {
    title: "Jasne warunki",
    body: "Umowa, protokoły, ubezpieczenia i przepisanie liczników - wszystko podane na tacy.",
  },
  {
    title: "Terminowe rozliczenia",
    body: "Stały kontakt, czyste rozliczenia mediów i opłat - bez niespodzianek pod koniec miesiąca.",
  },
  {
    title: "Sprawny serwis techniczny",
    body: "Szybka reakcja na usterki, organizacja napraw i przeglądów technicznych.",
  },
];

export default function ZarzadzanieNajmemPage() {
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
                  Zarządzanie najmem
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h1
                  className="font-display text-ink-950 leading-[1.05] tracking-tight text-balance"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
                >
                  Twoje mieszkanie zarabia. My zajmujemy się resztą.
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-5 md:mt-8 text-[16px] md:text-[19px] leading-[1.55] text-ink-700 text-pretty">
                  Kompleksowa usługa zarządzania najmem - od przygotowania mieszkania, przez dobór
                  najemcy, aż po pełną obsługę administracyjną i techniczną.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Dla inwestorów */}
        <section className="relative py-20 md:py-28 bg-paper-warm border-y border-ink-200/60">
          <div className="container-xl">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <Reveal className="lg:col-span-5 lg:sticky lg:top-28">
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Dla inwestorów
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.8rem, 4vw, 2.9rem)" }}
                >
                  Pasywny dochód bez zaangażowania.
                </h2>
                <div className="mt-6 md:mt-7 text-[16px] md:text-[17px] text-ink-700 leading-[1.7] space-y-4 text-pretty">
                  <p>
                    Oferujemy kompleksową usługę zarządzania najmem, która pozwala inwestorom
                    czerpać zyski z nieruchomości bez konieczności angażowania czasu i energii.
                    Zajmujemy się wszystkim - od przygotowania mieszkania, przez dobór odpowiedniego
                    najemcy, aż po pełną obsługę administracyjną: umowy, rozliczenia, media i
                    okresowe kontrole.
                  </p>
                  <p>
                    Dzięki temu inwestycja staje się całkowicie pasywna, a Ty zyskujesz
                    bezpieczeństwo, spokój i stabilny dochód. Nasze rozwiązania cenią szczególnie
                    inwestorzy z zagranicy, którzy mogą zarabiać w Polsce bez fizycznej obecności.
                  </p>
                  <p className="font-display text-[1.4rem] md:text-[1.55rem] text-ink-950 leading-[1.25] tracking-tight">
                    Zainwestuj - resztą zajmiemy się my.
                  </p>
                </div>
              </Reveal>

              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4 md:gap-5">
                {INVESTOR_SCOPE.map((item, i) => (
                  <Reveal key={item.title} delay={i * 70}>
                    <article className="h-full rounded-2xl bg-white p-6 md:p-7 border border-ink-200/60 shadow-[var(--shadow-soft)]">
                      <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-brand-500/10 text-brand-700">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                          <path
                            d="M2.5 7.2l3 3 6-7"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <h3 className="font-display text-ink-950 text-[1.3rem] md:text-[1.45rem] leading-tight tracking-tight mt-5">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-[15px] text-ink-700 leading-[1.65]">
                        {item.body}
                      </p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dla najemców */}
        <section className="relative py-20 md:py-28 bg-ink-950 text-ink-100 overflow-hidden">
          <div className="absolute inset-0 grad-radial-brand opacity-40" aria-hidden />
          <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
          <div className="container-xl relative">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow eyebrow-on-dark inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-accent-400" />
                  Dla najemców
                  <span className="inline-block w-6 sm:w-8 h-px bg-accent-400" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-white tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Wygoda, bezpieczeństwo i przejrzystość.
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-5 md:mt-7 text-[16px] md:text-[18px] leading-[1.65] text-ink-200 text-pretty">
                  Najemcy korzystający z naszych usług mogą liczyć na komfortowy i bezproblemowy
                  wynajem. W razie potrzeby szybko reagujemy na usterki i organizujemy niezbędne
                  naprawy oraz przeglądy techniczne - najem jest bezpieczny, przejrzysty i wygodny.
                </p>
              </Reveal>
            </div>

            <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {TENANT_SCOPE.map((item, i) => (
                <Reveal key={item.title} delay={i * 90}>
                  <article className="h-full rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-7 md:p-8">
                    <h3 className="font-display text-white text-[1.35rem] md:text-[1.5rem] leading-tight tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-ink-200 text-[15px] leading-[1.65]">
                      {item.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Sentencja + CTA */}
        <section className="relative py-20 md:py-28">
          <div className="container-xl text-center max-w-3xl mx-auto">
            <Reveal>
              <p
                className="font-display italic text-ink-950 leading-[1.15] tracking-tight text-balance"
                style={{ fontSize: "clamp(1.55rem, 4vw, 2.6rem)" }}
              >
                „Chcesz mieć pewność, że Twoje mieszkanie zarabia bezproblemowo, a najemca jest
                zadowolony? Właśnie to oferujemy.”
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium transition-colors active:scale-[0.98]"
                >
                  Umów rozmowę
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
            <Reveal delay={200}>
              <div className="mt-10 md:mt-12 text-[15px] md:text-[16px] text-ink-700 leading-[1.7]">
                <a
                  href="tel:+48510777200"
                  className="font-display text-[20px] md:text-[22px] text-brand-700 hover:text-brand-500 tabular-nums transition-colors"
                >
                  510 777 200
                </a>
                <span className="mx-3 text-ink-300" aria-hidden>·</span>
                <a
                  href="mailto:arkadiusz.jezusek@fibra.pl"
                  className="hover:text-brand-700 transition-colors break-all sm:break-normal"
                >
                  arkadiusz.jezusek@fibra.pl
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
