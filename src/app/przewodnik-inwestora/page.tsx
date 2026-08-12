import type { Metadata } from "next";
import Link from "next/link";
import { ZamyslowNav } from "@/components/investments/zamyslow/ZamyslowNav";
import { ZamyslowFooter } from "@/components/investments/zamyslow/ZamyslowFooter";
import { Reveal } from "@/components/ui/Reveal";
import { getZamyslowUnitsSummary } from "@/lib/investments/zamyslow-units";
import { ZAMYSLOW_PHONE } from "@/lib/investments/zamyslow-data";

// Ceny/metraże z arkusza mieszkań - odświeżamy stronę, zamiast zamrażać ją na buildzie.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Przewodnik Inwestora - Fibra Nieruchomości",
  description:
    "Bezpieczne lokowanie kapitału w mieszkania wykończone pod klucz i przygotowane do wynajmu. Model, parametry finansowe, zabezpieczenia i FAQ inwestora.",
  alternates: { canonical: "/przewodnik-inwestora" },
  openGraph: {
    title: "Przewodnik Inwestora - Fibra Nieruchomości",
    description:
      "Bezpieczne lokowanie kapitału w mieszkania wykończone pod klucz i przygotowane do wynajmu. Model, parametry finansowe, zabezpieczenia i FAQ inwestora.",
    url: "/przewodnik-inwestora",
    type: "website",
    locale: "pl_PL",
  },
};

const WHY_NOW = [
  {
    n: "01",
    title: "Niski poziom pustostanów",
    body:
      "Rekordowo niski poziom pustostanów w miastach < 100 tys. mieszkańców - popyt na najem stabilny i przewidywalny.",
  },
  {
    n: "02",
    title: "Lokaty nie chronią już kapitału",
    body:
      "Gdy inflacja przewyższa oprocentowanie lokat, realna wartość oszczędności maleje.",
  },
  {
    n: "03",
    title: "Inflacja kosztów budowy",
    body:
      "Materiały i robocizna drożeją w skali roku - dziś kupujesz taniej niż za dwa lata.",
  },
  {
    n: "04",
    title: "Aktywa, które mają realną wartość",
    body:
      "Coraz więcej inwestorów przenosi kapitał z lokat i obligacji do nieruchomości, które mogą generować dochód z najmu.",
  },
];

const LOCATION = [
  { value: "3,5 km", label: "do rynku w Rybniku" },
  { value: "7 km", label: "do „Rybnickiego Morza”" },
  { value: "1,8 km", label: "do Drogi Głównej Południowej (szybki dojazd do A1)" },
  { value: "800 m", label: "do szkoły, 1,2 km do przedszkola" },
  { value: "100 m", label: "do sklepu Żabka w bezpośrednim sąsiedztwie" },
];

const MODEL_STEPS = [
  {
    n: "01",
    title: "Kup",
    // Jak na /zamyslow: kuchnia i AGD to opcja do domówienia, nie część ceny.
    body:
      "Kupujesz lokal wykończony, z gotową łazienką. Kuchnię i AGD możesz zamówić dodatkowo.",
  },
  {
    n: "02",
    title: "Wynajmij",
    body:
      "My (Fibra) znajdujemy najemcę, podpisujemy umowę i rozliczamy media - bez udziału właściciela.",
  },
  {
    n: "03",
    title: "Odbieraj przelew",
    body:
      "Co miesiąc otrzymujesz czynsz najmu. Obsługę najmu w pełni prowadzimy my.",
  },
];

// Bez prognozowanego czynszu najmu: klient nie podaje tej liczby na stronie,
// wylicza ją indywidualnie dla konkretnego mieszkania. Termin oddania
// potwierdzony przez klienta (13.05.2028), więc odbiór kluczy w 2028 r.
//
// Ceny i metraże NIE są wpisane na sztywno - lecą z arkusza mieszkań, tego
// samego, który zasila strony lokali. Gdy arkusz nie odpowie, kafelek z ceną
// wypada zamiast pokazywać nieaktualne widełki.
function buildNumbers(range: { areaRangeLabel: string; priceRangeLabel: string | null } | null) {
  return [
    range?.priceRangeLabel
      ? { value: range.priceRangeLabel, label: `cena lokali (${range.areaRangeLabel})` }
      : null,
    { value: "ok. 250 zł/mies.", label: "koszty stałe + media" },
    { value: "5,7 – 6,9 %", label: "szacowana rentowność brutto rocznie" },
    { value: "II / 2028", label: "termin oddania" },
  ].filter((n): n is { value: string; label: string } => n !== null);
}

/** Tyle kolumn, ile kafelków - żeby siatka nigdy nie miała pustego pola. */
const NUMBER_COLUMNS: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

const SAFETY = [
  {
    n: "01",
    title: "Umowa deweloperska",
    body: "Pełna ochrona Ustawy Deweloperskiej.",
  },
  {
    n: "02",
    title: "Rachunek powierniczy",
    body:
      "Środki trafiają do nas dopiero po postępie robót - wypłacane po zakończonym etapie sprawdzonym przez inspektorów banku.",
  },
  {
    n: "03",
    title: "Terminy potwierdzone historią",
    body: "Dotrzymywanie terminów mamy potwierdzone historią wcześniejszych realizacji.",
  },
  {
    n: "04",
    title: "Materiały premium",
    body:
      "Silikat Xella, Ytong, izolacja do 30 cm, trzyszybowe okna, klimatyzacja i rolety elektryczne w cenie.",
  },
  {
    n: "05",
    title: "Zarządzanie najmem A–Z",
    body:
      "Obsługujemy cały proces najmu - ogromna oszczędność Twojego czasu i minimalny pustostan.",
  },
];

const FAQ = [
  {
    q: "Czy mogę finansować zakup kredytem?",
    a: "Tak - współpracujące banki finansują nawet 80 % wartości mieszkania, a możliwe jest, aby rata kredytu była niższa niż czynsz najmu.",
  },
  {
    q: "Co z podatkiem?",
    a: "Przychód z najmu możesz rozliczać ryczałtem 8,5 % (do 120 tys. zł rocznie).",
  },
  {
    q: "A jeśli najemca nie płaci?",
    a: "Fibra monitoruje płatności, prowadzi windykację i - w razie potrzeby - rozwiązuje umowę z najemcą oraz poszukuje kolejnego. Dodatkowym zabezpieczeniem dla inwestora jest pobierana od najemcy kaucja.",
  },
];

const NEXT_STEPS = [
  {
    n: "01",
    title: "Spotkanie online (30 min)",
    body: "Zapisujesz się na rozmowę, w której pokazujemy ofertę i odpowiadamy na pytania.",
  },
  {
    n: "02",
    title: "Rezerwacja układu (48 h)",
    body: "Otrzymujesz rezerwację wybranego układu mieszkania na 48 godzin.",
  },
  {
    n: "03",
    title: "Umowa deweloperska",
    body: "Podpisujesz umowę i czekasz na odbiór kluczy w 2028 r.",
  },
];

export default async function PrzewodnikInwestoraPage() {
  const NUMBERS = buildNumbers(await getZamyslowUnitsSummary());

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
                  Przewodnik Inwestora
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h1
                  className="font-display text-ink-950 leading-[1.05] tracking-tight text-balance"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
                >
                  Bezpieczne lokowanie kapitału w mieszkania wykończone pod klucz
                  i przygotowane do wynajmu.
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-5 md:mt-8 text-[16px] md:text-[19px] leading-[1.55] text-ink-700 text-pretty">
                  Opracowanie ekspertów Grupy Fibra
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 1. Dlaczego 2025 */}
        <section className="relative py-20 md:py-28 bg-paper-warm border-y border-ink-200/60">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  01 · Dlaczego nieruchomości
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Cztery powody, dla których kapitał wraca do mieszkań.
                </h2>
              </Reveal>
            </div>
            <div className="mt-12 md:mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {WHY_NOW.map((item, i) => (
                <Reveal key={item.n} delay={i * 80}>
                  <article className="h-full rounded-2xl bg-white p-7 md:p-8 shadow-[var(--shadow-soft)] border border-ink-200/60">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-brand-500/10 text-[11px] font-semibold tracking-wide text-brand-700">
                      {item.n}
                    </span>
                    <h3 className="font-display text-ink-950 text-[1.35rem] md:text-[1.5rem] leading-tight tracking-tight mt-5">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[15px] text-ink-700 leading-[1.6] text-pretty">
                      {item.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Lokalizacja */}
        <section className="relative py-20 md:py-32 bg-ink-950 text-ink-100 overflow-hidden">
          <div className="absolute inset-0 grad-radial-brand opacity-50" aria-hidden />
          <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
          <div className="container-xl relative">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow eyebrow-on-dark inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-accent-400" />
                  02 · Rybnik Zamysłów
                  <span className="inline-block w-6 sm:w-8 h-px bg-accent-400" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-white tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Zielona dzielnica z potencjałem.
                </h2>
              </Reveal>
            </div>

            <div className="mt-12 md:mt-16 grid grid-cols-2 lg:grid-cols-5 gap-px bg-white/10 rounded-2xl overflow-hidden">
              {LOCATION.map((item, i) => (
                <Reveal key={i} delay={i * 60} className="bg-ink-950">
                  <div className="p-6 md:p-8 h-full flex flex-col justify-between">
                    <p className="font-display text-white text-[1.6rem] md:text-[2rem] leading-tight tracking-tight tabular-nums">
                      {item.value}
                    </p>
                    <p className="mt-3 text-ink-200 text-[14px] md:text-[15px] leading-[1.5]">
                      {item.label}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Model */}
        <section className="relative py-20 md:py-28">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  03 · Model
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  „Kup - Wynajmij - Odbieraj przelew”.
                </h2>
              </Reveal>
            </div>

            <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-6 md:gap-8">
              {MODEL_STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 90}>
                  <article className="relative h-full rounded-2xl bg-paper-warm p-8 md:p-10 border border-ink-200/60">
                    <span className="font-display text-accent-500 text-[3rem] md:text-[3.4rem] leading-none tracking-tight">
                      {step.n}
                    </span>
                    <h3 className="font-display text-ink-950 text-[1.55rem] md:text-[1.8rem] leading-tight tracking-tight mt-3">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-[15.5px] text-ink-700 leading-[1.65]">
                      {step.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Liczby */}
        <section className="relative py-20 md:py-28 bg-paper-warm border-y border-ink-200/60">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  04 · Liczby, które przekonują
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Konkretne parametry, nie marketing.
                </h2>
              </Reveal>
            </div>

            <div
              className={`mt-12 md:mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 ${
                NUMBER_COLUMNS[NUMBERS.length] ?? "lg:grid-cols-4"
              }`}
            >
              {NUMBERS.map((item, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className="h-full rounded-2xl bg-white p-6 md:p-7 border border-ink-200/60 flex flex-col justify-between">
                    <p className="font-display text-ink-950 text-[1.55rem] md:text-[1.75rem] leading-tight tracking-tight tabular-nums">
                      {item.value}
                    </p>
                    <p className="mt-3 text-ink-600 text-[13.5px] md:text-[14px] leading-[1.45] uppercase tracking-wide">
                      {item.label}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Bezpieczeństwo */}
        <section className="relative py-20 md:py-28">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  05 · Bezpieczeństwo Twojej inwestycji
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Pięć filarów, na których stoi Twój kapitał.
                </h2>
              </Reveal>
            </div>

            <div className="mt-12 md:mt-16 mx-auto max-w-5xl">
              <ol className="space-y-4 md:space-y-5">
                {SAFETY.map((item, i) => (
                  <Reveal key={item.n} delay={i * 70} as="li">
                    <div className="grid grid-cols-[auto_1fr] gap-5 md:gap-7 rounded-2xl bg-white p-6 md:p-7 border border-ink-200/60">
                      <span className="font-display text-brand-700 text-[1.85rem] md:text-[2.15rem] leading-none tracking-tight tabular-nums">
                        {item.n}
                      </span>
                      <div>
                        <h3 className="font-display text-ink-950 text-[1.35rem] md:text-[1.55rem] leading-tight tracking-tight">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-[15.5px] text-ink-700 leading-[1.65]">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section className="relative py-20 md:py-28 bg-ink-950 text-ink-100 overflow-hidden">
          <div className="absolute inset-0 grad-radial-brand opacity-40" aria-hidden />
          <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
          <div className="container-xl relative">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow eyebrow-on-dark inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-accent-400" />
                  06 · Najczęstsze pytania inwestorów
                  <span className="inline-block w-6 sm:w-8 h-px bg-accent-400" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-white tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Trzy rzeczy, o które najczęściej pytacie.
                </h2>
              </Reveal>
            </div>

            <div className="mt-12 md:mt-16 mx-auto max-w-4xl space-y-4 md:space-y-5">
              {FAQ.map((item, i) => (
                <Reveal key={i} delay={i * 80}>
                  <details className="group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md open:bg-white/[0.06] transition-colors">
                    <summary className="cursor-pointer list-none p-6 md:p-7 flex items-start justify-between gap-6">
                      <span className="font-display text-white text-[1.2rem] md:text-[1.4rem] leading-tight tracking-tight">
                        {item.q}
                      </span>
                      <span
                        className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white transition-transform group-open:rotate-45"
                        aria-hidden
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-6 md:px-7 pb-7 -mt-1 text-[15.5px] md:text-[16px] text-ink-200 leading-[1.7] max-w-3xl">
                      {item.a}
                    </div>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Kolejne kroki */}
        <section className="relative py-20 md:py-28">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  07 · Kolejne kroki
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Od pierwszej rozmowy do kluczy.
                </h2>
              </Reveal>
            </div>

            <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-6 md:gap-8">
              {NEXT_STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 90}>
                  <article className="h-full rounded-2xl bg-paper-warm p-8 md:p-10 border border-ink-200/60">
                    <span className="font-display text-brand-700 text-[2.5rem] md:text-[2.8rem] leading-none tracking-tight tabular-nums">
                      {step.n}
                    </span>
                    <h3 className="font-display text-ink-950 text-[1.4rem] md:text-[1.6rem] leading-tight tracking-tight mt-3">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[15.5px] text-ink-700 leading-[1.65]">
                      {step.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA + dane */}
        <section className="relative py-20 md:py-28 bg-paper-warm border-t border-ink-200/60">
          <div className="container-xl text-center max-w-3xl mx-auto">
            <Reveal>
              <h2
                className="font-display text-ink-950 tracking-tight leading-[1.02]"
                style={{ fontSize: "clamp(1.85rem, 4.5vw, 3.25rem)" }}
              >
                Porozmawiajmy o Twojej inwestycji.
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-7 md:mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[16px] md:text-[18px] text-ink-800">
                <a
                  href={`tel:${ZAMYSLOW_PHONE.tel}`}
                  className="font-display text-[22px] md:text-[24px] text-brand-700 hover:text-brand-500 tabular-nums transition-colors"
                >
                  {ZAMYSLOW_PHONE.display}
                </a>
                <span aria-hidden className="hidden sm:inline text-ink-300">·</span>
                <a
                  href="mailto:arkadiusz.jezusek@fibra.pl"
                  className="hover:text-brand-700 transition-colors break-all sm:break-normal"
                >
                  arkadiusz.jezusek@fibra.pl
                </a>
              </div>
            </Reveal>
            <Reveal delay={200}>
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
                  href="/zarzadzanie-najmem"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-900/15 text-ink-900 hover:bg-ink-900 hover:text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium transition-colors active:scale-[0.98]"
                >
                  Zarządzanie najmem
                </Link>
              </div>
            </Reveal>
            <Reveal delay={280}>
              <p className="mt-12 mx-auto max-w-2xl text-[12.5px] text-ink-500 leading-[1.6]">
                Materiały informacyjne nie stanowią oferty w rozumieniu Kodeksu cywilnego.
                Rentowność historyczna nie gwarantuje osiągnięcia podobnych wyników w przyszłości.
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <ZamyslowFooter />
    </>
  );
}
