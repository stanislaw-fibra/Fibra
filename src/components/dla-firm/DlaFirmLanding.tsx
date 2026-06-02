import { Reveal } from "@/components/ui/Reveal";
import { DlaFirmContactForm } from "./DlaFirmContactForm";
import { DlaFirmFaq } from "./DlaFirmFaq";

/* -------------------------------------------------------------------------- */
/* /dla-firm - landing B2B (wersja uproszczona).                              */
/* Ton: neutralny, korporacyjny. Bez marketingowych superlatyw. Treść         */
/* sprowadzona do informacji, które firma nieruchomości może bezpiecznie      */
/* obiecać przed potwierdzeniem szczegółów z klientem.                        */
/* -------------------------------------------------------------------------- */

const OFFER = [
  "Umeblowane mieszkania gotowe do wprowadzenia",
  "Umowa najmu z firmą i faktura VAT",
  "Umowy na 3, 6, 12 lub 24 miesiące",
  "Obsługa techniczna i jeden kontakt do całej współpracy",
] as const;

const STEPS = [
  {
    n: "01",
    title: "Zostawiasz kontakt",
    body: "Zostaw numer telefonu lub napisz krótko, czego potrzebujesz. Oddzwaniamy w ciągu dwóch godzin roboczych.",
  },
  {
    n: "02",
    title: "Przedstawiamy mieszkania",
    body: "Wybieramy dopasowane lokale ze zdjęciami i lokalizacją. Ustalamy warunki umowy.",
  },
  {
    n: "03",
    title: "Umowa i wprowadzenie",
    body: "Podpisujemy umowę najmu z firmą. Wydajemy klucze pracownikowi w ustalonym terminie.",
  },
] as const;

const CITIES = [
  "Rybnik",
  "Wodzisław Śląski",
  "Jastrzębie-Zdrój",
  "Żory",
  "Radlin",
  "Racibórz",
] as const;

const FAQ_ITEMS = [
  {
    q: "Czy wystawiacie fakturę VAT?",
    a: "Tak. Umowę zawieramy z firmą i co miesiąc wystawiamy fakturę VAT.",
  },
  {
    q: "Jaka jest minimalna długość umowy?",
    a: "Najczęściej zawieramy umowy na 3, 6, 12 lub 24 miesiące. Inne terminy ustalamy indywidualnie.",
  },
  {
    q: "Co jest w mieszkaniu?",
    a: "Standardowo: pełne umeblowanie, AGD, internet i podstawowy zestaw startowy. Szczegółowy zakres dla wybranego lokalu przesyłamy z propozycją.",
  },
  {
    q: "Czy można zakwaterować dwie osoby w jednym mieszkaniu?",
    a: "Tak, jeżeli mieszkanie ma odpowiedni metraż. Dobieramy lokal pod liczbę osób wskazaną w zapytaniu.",
  },
  {
    q: "Co jeśli w trakcie roku będę potrzebować więcej mieszkań?",
    a: "Umowę aneksujemy o dodatkowe lokale. Nie wymaga to renegocjacji od początku.",
  },
];

export function DlaFirmLanding() {
  return (
    <>
      {/* ------------------------------------ HERO ------------------------------------ */}
      <section className="relative pt-[calc(72px+3rem)] md:pt-[calc(72px+4rem)] pb-20 md:pb-28 bg-ink-950 text-ink-100 overflow-hidden">
        <div className="absolute inset-0 grad-radial-brand opacity-55" aria-hidden />
        <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
        <div className="container-xl relative">
          <div className="max-w-3xl">
            <Reveal>
              <p className="eyebrow eyebrow-on-dark inline-flex items-center gap-3 mb-8">
                <span className="inline-block w-8 h-px bg-accent-400" />
                Oferta dla firm
              </p>
            </Reveal>
            <Reveal delay={60}>
              <h1
                className="font-display text-white tracking-tight leading-[1.05] text-balance"
                style={{ fontSize: "clamp(2.1rem, 5vw, 3.75rem)" }}
              >
                Mieszkania na wynajem dla firm
                <br className="hidden md:inline" />{" "}
                w Rybniku, Wodzisławiu i okolicach.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-7 max-w-xl text-[17px] md:text-[18px] text-ink-300 leading-[1.6]">
                Umeblowane mieszkania, umowa z firmą, faktura VAT.
                Zostaw kontakt - oddzwonimy w ciągu dwóch godzin roboczych.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-10 md:mt-12 max-w-2xl">
                <DlaFirmContactForm variant="compact" formId="b2b-hero-form" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --------------------------------- CO OFERUJEMY ----------------------------- */}
      <section className="relative py-20 md:py-28 bg-paper border-b border-ink-200/70">
        <div className="container-xl">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Oferta
                </p>
              </Reveal>
              <Reveal delay={60}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.45rem)" }}
                >
                  Najem mieszkania dla pracownika
                  <br className="hidden md:inline" />
                  na zasadach umowy B2B.
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-7">
              <ul className="divide-y divide-ink-200/70 border-y border-ink-200/70">
                {OFFER.map((item, i) => (
                  <Reveal as="li" key={item} delay={i * 50} className="flex items-center gap-5 py-5 md:py-6 list-none">
                    <span className="font-display text-brand-500 text-[15px] tabular-nums w-6">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[16px] md:text-[17px] text-ink-800 leading-[1.55]">
                      {item}
                    </span>
                  </Reveal>
                ))}
              </ul>
              <Reveal delay={250}>
                <p className="mt-8 text-[14px] text-ink-500 leading-relaxed max-w-xl">
                  Szczegółowy zakres usługi i wyposażenia dla wybranych mieszkań
                  przesyłamy razem z propozycją po pierwszym kontakcie.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------- JAK TO DZIAŁA ---------------------------- */}
      <section className="relative py-20 md:py-28 bg-paper-warm border-b border-ink-200/70">
        <div className="container-xl">
          <div className="max-w-2xl mb-12 md:mb-16">
            <Reveal>
              <p className="eyebrow inline-flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Jak to działa
              </p>
            </Reveal>
            <Reveal delay={60}>
              <h2
                className="font-display text-ink-950 tracking-tight leading-[1.05]"
                style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.45rem)" }}
              >
                Trzy kroki od zapytania do umowy.
              </h2>
            </Reveal>
          </div>

          <ol className="grid md:grid-cols-3 gap-px bg-ink-200/70 rounded-[var(--radius-md)] overflow-hidden border border-ink-200/70">
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.n} delay={i * 70} className="list-none">
                <div className="h-full bg-paper-warm p-7 md:p-9">
                  <span className="font-display text-brand-500 text-[1.4rem] tabular-nums">
                    {step.n}
                  </span>
                  <p className="mt-5 font-display text-ink-950 text-[1.3rem] md:text-[1.45rem] leading-tight tracking-tight">
                    {step.title}
                  </p>
                  <p className="mt-4 text-[15.5px] text-ink-700 leading-[1.65]">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------- GDZIE DZIAŁAMY --------------------------- */}
      <section className="relative py-20 md:py-28 bg-paper border-b border-ink-200/70">
        <div className="container-xl">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Gdzie działamy
                </p>
              </Reveal>
              <Reveal delay={60}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.45rem)" }}
                >
                  Zachodni Śląsk - w obszarze
                  <br className="hidden md:inline" />
                  30 km od Radlina.
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-6 text-[15.5px] text-ink-700 leading-[1.7] max-w-md">
                  Mieszkania dostępne w wymienionych miastach. Inne lokalizacje
                  w regionie ustalamy indywidualnie po zapytaniu.
                </p>
              </Reveal>
            </div>
            <Reveal delay={120} className="lg:col-span-7">
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CITIES.map((city) => (
                  <li
                    key={city}
                    className="rounded-[var(--radius-sm)] border border-ink-200/70 bg-white px-4 py-3.5 text-[14.5px] text-ink-800"
                  >
                    {city}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --------------------------------- FAQ -------------------------------------- */}
      <section className="relative py-20 md:py-28 bg-paper-warm border-b border-ink-200/70">
        <div className="container-xl">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-28">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Pytania
                </p>
              </Reveal>
              <Reveal delay={60}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.45rem)" }}
                >
                  Krótkie odpowiedzi
                  <br className="hidden md:inline" />
                  na podstawowe pytania.
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-6 text-[15px] text-ink-700 leading-[1.7] max-w-sm">
                  Inne pytanie? Zadzwoń lub zostaw numer - wrócimy z odpowiedzią.
                </p>
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
                  Kontakt
                </p>
              </Reveal>
              <Reveal delay={60}>
                <h2
                  className="font-display text-white tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)" }}
                >
                  Zostaw numer
                  <br />
                  lub napisz do nas.
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-6 text-ink-300 text-[16px] md:text-[17px] leading-[1.7] max-w-md">
                  Oddzwaniamy w ciągu dwóch godzin roboczych. W weekend -
                  najpóźniej w poniedziałek rano.
                </p>
              </Reveal>

              <Reveal delay={200}>
                <dl className="mt-10 space-y-6 text-[14.5px]">
                  <div>
                    <dt className="text-white/55 text-[11.5px] uppercase tracking-[0.16em] font-medium">
                      Telefon
                    </dt>
                    <dd className="mt-1.5">
                      <a href="tel:+48510777200" className="font-display text-white text-[22px] tabular-nums hover:text-accent-400 transition-colors">
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
              <DlaFirmContactForm variant="full" formId="b2b-form" />
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
            href="#kontakt"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 text-white px-4 py-3 text-[14px] font-medium"
          >
            Zostaw kontakt
          </a>
        </div>
      </div>
      <div className="lg:hidden h-[72px]" aria-hidden />
    </>
  );
}
