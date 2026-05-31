import { Reveal } from "@/components/ui/Reveal";
import { DlaFirmContactForm } from "./DlaFirmContactForm";
import { DlaFirmFaq } from "./DlaFirmFaq";

/* -------------------------------------------------------------------------- */
/* /dla-firm — landing B2B                                                     */
/* Ton: spokojny, korporacyjny, dużo oddechu. Bez marketingowego żargonu,      */
/* bez „Persona A/B/C/D", bez liczb-zapchajdziur. Treść skondensowana —        */
/* HR-owiec ma w 30 sekund wiedzieć, czego się spodziewać.                    */
/* -------------------------------------------------------------------------- */

const CITIES = [
  "Rybnik",
  "Wodzisław Śląski",
  "Jastrzębie-Zdrój",
  "Żory",
  "Radlin",
  "Racibórz",
  "Knurów",
  "Rydułtowy",
] as const;

const VALUES = [
  {
    title: "Jeden kontakt, jedna faktura",
    body: "Umowa B2B z Grupą Fibra. Co miesiąc jedna faktura VAT za wszystkie mieszkania — niezależnie od liczby lokali i miast.",
  },
  {
    title: "Mieszkania gotowe do wprowadzenia",
    body: "Umeblowane, z wyposażoną kuchnią, internetem i pościelą. Klucze wydajemy w terminie ustalonym z Państwa działem HR.",
  },
  {
    title: "Umowy dopasowane do projektu",
    body: "Najem od 3 do 24 miesięcy. Możliwość rozszerzenia o kolejne lokale lub wcześniejszego zakończenia na standardowych warunkach.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Zapytanie",
    body: "Telefon lub formularz. Pytamy o liczbę osób, miasto i orientacyjny termin. Bez NIP-u i bez katalogów do pobrania.",
  },
  {
    n: "02",
    title: "Propozycja",
    body: "W ciągu 24–48 godzin przesyłamy 2–3 dopasowane mieszkania ze zdjęciami i lokalizacją.",
  },
  {
    n: "03",
    title: "Umowa B2B",
    body: "Standardowy wzór najmu na firmę. Podpis online lub w biurze w Radlinie.",
  },
  {
    n: "04",
    title: "Wprowadzenie pracownika",
    body: "Przekazanie kluczy w mieszkaniu lub w biurze. Obsługa w języku polskim, angielskim i ukraińskim.",
  },
  {
    n: "05",
    title: "Opieka i rozliczenia",
    body: "Agent dyżurny, usterki w 24 h, jedna zbiorcza faktura na koniec miesiąca.",
  },
] as const;

const SEGMENTS = [
  {
    title: "Relokacja specjalistów",
    body: "Mieszkania pod osoby z wyższymi oczekiwaniami — inżynierowie, kadra zarządzająca, zespoły IT relokowane do śląskich oddziałów.",
  },
  {
    title: "Projekty i serwis w terenie",
    body: "Krótsze umowy dla ekip montażowych, kierowników budów i zespołów utrzymania ruchu. Lokum blisko miejsca pracy.",
  },
  {
    title: "Lokalne firmy",
    body: "1–2 mieszkania dla partnera handlowego lub nowego pracownika. Prosta umowa, szybkie wprowadzenie.",
  },
  {
    title: "Większe kontrakty (10+ lokali)",
    body: "Dedykowany doradca, indywidualna oferta cenowa i raportowanie. Pasuje do zespołów relokacyjnych i projektów 6–24 miesięcy.",
  },
] as const;

const APARTMENT_INCLUDES = [
  "Pełne umeblowanie (sypialnia, salon, kuchnia)",
  "Lodówka, pralka, kuchenka, w wybranych mieszkaniach zmywarka",
  "Pościel, ręczniki i zestaw startowy",
  "Internet światłowodowy w cenie",
  "Sprzątanie przed wprowadzeniem",
  "Miejsce parkingowe (gdzie dostępne)",
] as const;

const FAQ_ITEMS = [
  {
    q: "Czy wystawiacie fakturę VAT za najem mieszkania dla firmy?",
    a: "Tak. Umowę zawieramy z firmą i co miesiąc wystawiamy jedną zbiorczą fakturę VAT za wszystkie wynajęte mieszkania.",
  },
  {
    q: "Jaka jest minimalna długość umowy?",
    a: "Najczęściej zawieramy umowy na 3, 6, 12 lub 24 miesiące. Krótsze terminy dla ekip projektowych są możliwe po indywidualnym uzgodnieniu.",
  },
  {
    q: "Co jeśli pracownik wyprowadzi się wcześniej niż planowano?",
    a: "Standardowa umowa pozwala wypowiedzieć ją z jednomiesięcznym okresem, bez kar — przy zgłoszeniu z wyprzedzeniem.",
  },
  {
    q: "Czy można zakwaterować dwie osoby w jednym mieszkaniu?",
    a: "Tak, jeżeli mieszkanie ma odpowiedni metraż. Dobieramy lokal pod liczbę osób, którą Państwo wskażą.",
  },
  {
    q: "Kto odpowiada za drobne usterki i naprawy?",
    a: "Awarie techniczne (instalacje, AGD, internet) usuwamy w ciągu 24 godzin roboczych. Zniszczenia z winy najemcy regulują standardowe zapisy umowy.",
  },
  {
    q: "Czy mogę zaliczyć koszt najmu w koszty firmy?",
    a: "Najem mieszkania dla pracownika jest standardowo kosztem uzyskania przychodu. W kwestii odliczalności VAT zalecamy konsultację z Państwa księgowością.",
  },
  {
    q: "Czy obsługujecie pracowników z zagranicy?",
    a: "Tak. Wprowadzenie i bieżącą obsługę prowadzimy w językach polskim, angielskim i ukraińskim.",
  },
  {
    q: "Czy macie mieszkania dla całych zespołów?",
    a: "Tak. W Rybniku, Wodzisławiu i Radlinie dysponujemy lokalami w tych samych budynkach lub osiedlach, co pozwala ulokować zespół blisko siebie.",
  },
  {
    q: "Jak szybko można podpisać umowę i wprowadzić pracownika?",
    a: "Standardowo 5–10 dni roboczych od pierwszego kontaktu do przekazania kluczy. W trybie pilnym — następnego dnia, jeśli mamy gotowy lokal.",
  },
  {
    q: "Co jeśli w trakcie roku będę potrzebować więcej mieszkań?",
    a: "Umowę aneksujemy o dodatkowe lokale na tych samych warunkach. Nie wymaga to renegocjacji od początku.",
  },
];

function CheckIcon() {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
      <svg width="10" height="8" viewBox="0 0 14 11" fill="none" aria-hidden>
        <path
          d="M1 5.5l4 4L13 1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function DlaFirmLanding() {
  return (
    <>
      {/* ------------------------------------ HERO ------------------------------------ */}
      <section className="relative pt-[calc(72px+3.5rem)] md:pt-[calc(72px+5rem)] pb-20 md:pb-28 bg-ink-950 text-ink-100 overflow-hidden">
        <div className="absolute inset-0 grad-radial-brand opacity-60" aria-hidden />
        <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
        <div className="container-xl relative">
          <div className="max-w-4xl">
            <Reveal>
              <p className="eyebrow eyebrow-on-dark inline-flex items-center gap-3 mb-8">
                <span className="inline-block w-8 h-px bg-accent-400" />
                Najem korporacyjny · Zachodni Śląsk
              </p>
            </Reveal>
            <Reveal delay={60}>
              <h1
                className="font-display text-white tracking-tight leading-[1.02] text-balance"
                style={{ fontSize: "clamp(2.3rem, 5.5vw, 4.25rem)" }}
              >
                Mieszkania na wynajem dla firm w Rybniku,
                <br className="hidden md:inline" />{" "}
                <span className="text-accent-400 italic">Wodzisławiu i Jastrzębiu.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-8 md:mt-10 max-w-2xl text-[17px] md:text-[19px] text-ink-300 leading-[1.6]">
                Umeblowane mieszkania dla pracowników i zespołów projektowych.
                Faktura VAT, jeden punkt kontaktu i umowy od 3 miesięcy.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-12 md:mt-14 flex flex-col sm:flex-row flex-wrap gap-4">
                <a
                  href="#b2b-form"
                  className="inline-flex w-full sm:w-auto min-h-[52px] items-center justify-center gap-2 rounded-full bg-accent-500 px-8 py-3.5 text-[15px] font-medium text-white hover:bg-accent-400 transition-colors"
                >
                  Wyślij zapytanie
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a
                  href="tel:+48510777200"
                  className="inline-flex w-full sm:w-auto min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/25 px-8 py-3.5 text-[15px] font-medium text-white/90 hover:bg-white/[0.06] transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.07 2H7a2 2 0 0 1 2 1.72c.13.9.35 1.78.66 2.62a2 2 0 0 1-.45 2.11L7.9 9.77a16 16 0 0 0 6 6l1.32-1.32a2 2 0 0 1 2.11-.45c.84.3 1.72.53 2.62.66A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  510 777 200
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <p className="mt-12 md:mt-16 text-[13.5px] text-white/55 leading-relaxed max-w-2xl">
                Odpowiadamy w ciągu dwóch godzin roboczych. Działamy lokalnie —
                Grupa Fibra, biuro w Radlinie.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ----------------------------- PASEK FAKTÓW (czysty, równy) ------------------- */}
      <section className="relative bg-paper border-y border-ink-200/70">
        <div className="container-xl">
          <dl className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-ink-200/70 -mx-[clamp(1.25rem,3vw,2.5rem)] lg:-mx-0">
            {[
              { k: "Faktura VAT", v: "miesięczna, jedna zbiorcza" },
              { k: "Umowy", v: "od 3 do 24 miesięcy" },
              { k: "Wprowadzenie", v: "5–10 dni roboczych" },
              { k: "Obszar działania", v: "30 km od Radlina" },
            ].map((s, i) => (
              <div
                key={s.k}
                className={[
                  "py-8 md:py-10 px-[clamp(1.25rem,3vw,2.5rem)] lg:px-8",
                  i < 2 ? "border-b border-ink-200/70 lg:border-b-0" : "",
                ].join(" ")}
              >
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  {s.k}
                </dt>
                <dd className="mt-3 font-display text-ink-950 text-[1.25rem] md:text-[1.4rem] leading-tight tracking-tight">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------------- WARTOŚCI --------------------------------- */}
      <section className="relative py-24 md:py-32 bg-paper">
        <div className="container-xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 mb-14 md:mb-20">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Co oferujemy
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.85rem, 3.6vw, 2.65rem)" }}
                >
                  Najem dla firm zorganizowany tak,
                  <br className="hidden md:inline" />
                  jak najem powinien być zorganizowany.
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:pt-3">
              <Reveal delay={140}>
                <p className="text-[16.5px] md:text-[17px] text-ink-700 leading-[1.7] max-w-xl">
                  Działamy w segmencie, który na zachodnim Śląsku nie ma operatora
                  najmu instytucjonalnego. Łączymy standard mieszkań dopasowany do
                  pracownika z prostym procesem księgowym.
                </p>
              </Reveal>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-ink-100 rounded-[var(--radius-md)] overflow-hidden border border-ink-200/70">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 80}>
                <article className="h-full bg-paper p-8 md:p-10">
                  <span className="font-display text-brand-500 text-[1.4rem] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-6 font-display text-ink-950 text-[1.4rem] md:text-[1.55rem] leading-tight tracking-tight">
                    {v.title}
                  </h3>
                  <p className="mt-4 text-[15.5px] text-ink-700 leading-[1.7]">
                    {v.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- PROCES ----------------------------------- */}
      <section className="relative py-24 md:py-32 bg-paper-warm border-y border-ink-200/60">
        <div className="container-xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Jak to działa
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.85rem, 3.6vw, 2.65rem)" }}
                >
                  Pięć kroków od zapytania
                  <br className="hidden md:inline" />
                  do przekazania kluczy.
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-8">
              <ol className="space-y-0">
                {STEPS.map((step, i) => {
                  const isLast = i === STEPS.length - 1;
                  return (
                    <Reveal key={step.n} as="li" delay={i * 50} className="flex gap-6 md:gap-8 list-none pb-10 md:pb-12 last:pb-0">
                      <div className="relative flex w-10 shrink-0 flex-col items-center">
                        <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-ink-200 text-[12px] font-semibold tracking-wide text-brand-600 tabular-nums">
                          {step.n}
                        </span>
                        {!isLast ? (
                          <div className="absolute left-1/2 top-10 bottom-0 w-px -translate-x-1/2 bg-ink-200" aria-hidden />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <p className="font-display text-ink-950 text-[1.35rem] md:text-[1.5rem] tracking-tight leading-tight">
                          {step.title}
                        </p>
                        <p className="mt-3 text-ink-700 text-[15.5px] md:text-[16px] leading-[1.7] max-w-xl">
                          {step.body}
                        </p>
                      </div>
                    </Reveal>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------- DLA KOGO --------------------------------- */}
      <section className="relative py-24 md:py-32 bg-paper">
        <div className="container-xl">
          <div className="max-w-3xl mb-14 md:mb-20">
            <Reveal>
              <p className="eyebrow inline-flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Dla kogo
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h2
                className="font-display text-ink-950 tracking-tight leading-[1.05]"
                style={{ fontSize: "clamp(1.85rem, 3.6vw, 2.65rem)" }}
              >
                Cztery typowe sytuacje, w których
                <br className="hidden md:inline" />
                pomagamy działom HR.
              </h2>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-ink-100 rounded-[var(--radius-md)] overflow-hidden border border-ink-200/70">
            {SEGMENTS.map((s, i) => (
              <Reveal key={s.title} delay={i * 60}>
                <article className="h-full bg-paper p-8 md:p-10">
                  <h3 className="font-display text-ink-950 text-[1.35rem] md:text-[1.55rem] leading-tight tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-4 text-[15.5px] text-ink-700 leading-[1.7] max-w-md">
                    {s.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- CO DOSTAJESZ W MIESZKANIU ---------------------- */}
      <section className="relative py-24 md:py-32 bg-paper-warm border-y border-ink-200/60">
        <div className="container-xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Standard mieszkań
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.85rem, 3.6vw, 2.65rem)" }}
                >
                  Wyposażenie gotowe
                  <br className="hidden md:inline" />
                  na pierwszy dzień.
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-7 text-[16px] md:text-[16.5px] text-ink-700 leading-[1.7] max-w-md">
                  Standardowe wyposażenie każdego mieszkania w portfolio. Szczegółowy
                  zakres dla wybranych lokali przesyłamy razem z propozycją.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                {APARTMENT_INCLUDES.map((item, i) => (
                  <Reveal as="li" key={item} delay={i * 40} className="flex items-start gap-3 list-none">
                    <span className="mt-1.5">
                      <CheckIcon />
                    </span>
                    <span className="text-[15.5px] md:text-[16px] text-ink-800 leading-[1.6]">
                      {item}
                    </span>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------- LOKALIZACJE ------------------------------ */}
      <section className="relative py-24 md:py-32 bg-paper">
        <div className="container-xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Gdzie działamy
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.85rem, 3.6vw, 2.65rem)" }}
                >
                  Subregion zachodniego Śląska
                  <br className="hidden md:inline" />
                  w jednym obszarze działania.
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-7 text-[16px] md:text-[16.5px] text-ink-700 leading-[1.7] max-w-md">
                  Mieszkania w obszarze 30 km od Radlina. W razie potrzeby
                  organizujemy lokal w dodatkowych lokalizacjach na zapytanie.
                </p>
              </Reveal>
            </div>

            <Reveal delay={120} className="lg:col-span-7">
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CITIES.map((city) => (
                  <li
                    key={city}
                    className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-ink-200/70 bg-white px-4 py-3.5 text-[14.5px] text-ink-800"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {city}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --------------------------------- FAQ -------------------------------------- */}
      <section className="relative py-24 md:py-32 bg-paper-warm border-y border-ink-200/60">
        <div className="container-xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-28">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Pytania
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.85rem, 3.6vw, 2.65rem)" }}
                >
                  Odpowiedzi przed rozmową z księgowością.
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-6 text-[15.5px] text-ink-700 leading-[1.7] max-w-md">
                  Brak odpowiedzi na konkretne pytanie? Zapraszamy do kontaktu —
                  odpowiadamy w ciągu dwóch godzin roboczych.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <div className="mt-8 flex flex-col gap-1.5 text-[15px]">
                  <a href="tel:+48510777200" className="font-display text-[20px] text-brand-700 hover:text-brand-500 tabular-nums transition-colors">
                    510 777 200
                  </a>
                  <a href="mailto:biuro@grupafibra.pl" className="text-ink-700 hover:text-brand-700 transition-colors break-all">
                    biuro@grupafibra.pl
                  </a>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-8">
              <Reveal>
                <DlaFirmFaq items={FAQ_ITEMS} />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------- FORMULARZ -------------------------------- */}
      <section id="kontakt" className="relative py-24 md:py-32 bg-ink-950 text-ink-100 overflow-hidden">
        <div className="absolute inset-0 grad-radial-brand opacity-55" aria-hidden />
        <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
        <div className="container-xl relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="eyebrow eyebrow-on-dark inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-8 h-px bg-accent-400" />
                  Zapytanie B2B
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-white tracking-tight leading-[1.02]"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
                >
                  Krótka rozmowa,
                  <br />
                  konkretna propozycja.
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-7 text-ink-300 text-[16px] md:text-[17px] leading-[1.7] max-w-md">
                  Pięć pól. Bez NIP-u i bez logowania. W odpowiedzi otrzymują
                  Państwo 2–3 dopasowane mieszkania razem z warunkami najmu.
                </p>
              </Reveal>

              <Reveal delay={220}>
                <dl className="mt-12 space-y-6 text-[14.5px]">
                  <div>
                    <dt className="text-white/55 text-[11.5px] uppercase tracking-[0.16em] font-medium">
                      Telefon
                    </dt>
                    <dd className="mt-1.5">
                      <a href="tel:+48510777200" className="font-display text-white text-[20px] tabular-nums hover:text-accent-400 transition-colors">
                        510 777 200
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-white/55 text-[11.5px] uppercase tracking-[0.16em] font-medium">
                      E-mail
                    </dt>
                    <dd className="mt-1.5">
                      <a href="mailto:biuro@grupafibra.pl" className="text-white hover:text-accent-400 transition-colors break-all">
                        biuro@grupafibra.pl
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-white/55 text-[11.5px] uppercase tracking-[0.16em] font-medium">
                      Biuro
                    </dt>
                    <dd className="mt-1.5 text-white/85 leading-relaxed">
                      Grupa Fibra Sp. z o.o.
                      <br />
                      <span className="text-white/55">ul. Rymera 177, 44-310 Radlin</span>
                      <br />
                      <span className="text-white/55">Pon.–Pt. 8:00–16:00</span>
                    </dd>
                  </div>
                </dl>
              </Reveal>
            </div>

            <Reveal delay={120} className="lg:col-span-7">
              <DlaFirmContactForm />
            </Reveal>
          </div>
        </div>
      </section>

      {/* --------------------------- STICKY MOBILE CTA ------------------------------ */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-[100] bg-ink-950/95 backdrop-blur-md border-t border-white/10 shadow-[0_-12px_32px_-12px_rgba(0,0,0,0.5)]">
        <div className="container-xl py-3 flex gap-2.5">
          <a
            href="tel:+48510777200"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.08] border border-white/15 text-white px-4 py-3 text-[14px] font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.07 2H7a2 2 0 0 1 2 1.72c.13.9.35 1.78.66 2.62a2 2 0 0 1-.45 2.11L7.9 9.77a16 16 0 0 0 6 6l1.32-1.32a2 2 0 0 1 2.11-.45c.84.3 1.72.53 2.62.66A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Zadzwoń
          </a>
          <a
            href="#b2b-form"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 text-white px-4 py-3 text-[14px] font-medium"
          >
            Zapytanie
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
      <div className="lg:hidden h-[72px]" aria-hidden />
    </>
  );
}
