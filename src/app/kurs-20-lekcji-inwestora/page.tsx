import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { StickyCta } from "./StickyCta";
import { BookVideo } from "./BookVideo";
import { HeroMedia } from "./HeroMedia";
import { StreamVideo } from "./StreamVideo";
import { getFreeLesson } from "@/app/kurs/lessons";
import { Logo } from "@/components/site/Logo";
import bartoszBooks from "../../../public/kurs/bartosz-nosiadek.jpg";
import bookMockup from "../../../public/kurs/bartosz-nosiadek-zarabianie-uczciwych-pieniedzy.png";
import bookCta from "../../../public/kurs/ksiazka_cta.png";
import { CourseCta } from "./CourseCta";
import { ScarcityNote } from "./ScarcityNote";
import { PRICE } from "./config";

/* -------------------------------------------------------------------------
   DO UZUPEŁNIENIA przed publikacją:
   - HERO_VIDEO_ID: tymczasowa autoprezentacja (Cloudflare Stream) - Bartek
     podmieni na docelowy film.
   CHECKOUT_URL, PRICE i pozostałe stałe kursu są w ./config.ts.
   Cena, opinie, value stack, zdjęcia, wideo o książce, link do koszyka są realne.

   CTA: przyciski-zachęty z góry strony kotwiczą do sekcji zamówienia (#zamow)
   przez <CourseCta mode="anchor">; przyciski realnego zakupu (sekcja zamówienia
   i finał) przez <CourseCta mode="checkout"> wysyłają AddToCart (piksel + CAPI).
   ------------------------------------------------------------------------- */

/**
 * Bonus czasowy: do 15 lipca do kursu dorzucamy pakiet książki o wartości
 * 297 zł. Po tej dacie oferta się zmienia - żeby zdjąć bonus, wystarczy
 * ustawić `active: false` (cała komunikacja bonusu zniknie z hero, sekcji
 * bonusu i cennika; zostaje sam kurs za 177 zł). Datę/wartości zmieniasz tu.
 */
const BONUS = {
  active: true,
  /** Wartość pakietu książki podawana jako prezent (nie dawna cena kursu). */
  value: "297 zł",
  /** Do kiedy obowiązuje bonus. */
  deadline: "15 lipca",
  /** Wartość przy zakupie osobno: 177 zł (kurs) + 297 zł (pakiet). */
  priceSeparate: "474 zł",
  /**
   * Ograniczony nakład drukowanej książki (scarcity zgodny z prawdą).
   * stockLeft = null → komunikat „do wyczerpania nakładu" (bez liczby, nie wymaga
   * aktualizacji). Wpisz liczbę tylko, gdy znasz realny stan i chcesz go pokazać.
   */
  stockLeft: null as number | null,
  /** Co wchodzi w pakiet książki (wartość 297 zł). */
  items: [
    "Drukowana książka „Zarabianie Uczciwych Pieniędzy”",
    "E-book",
    "Audiobook (CD + MP3)",
    "Szkolenie VOD 2,5 h",
    "Darmowa wysyłka",
  ],
};
const BOOK_VIDEO_ID = "PZxnHJVVP7A";
const HERO_VIDEO_ID = "d0e5dfcdcb14ec9f7f8f0bc918ddb590";

const AUTHOR_PHOTO =
  "https://yrkvochsziertbvzbnol.supabase.co/storage/v1/object/public/agent-photos/Bartosz%20Nosiadek.jpg";

const FACEBOOK_URL = "https://www.facebook.com/fibradreamPL";
const YOUTUBE_URL = "https://www.youtube.com/user/BartoszNosiadekTV/videos";

export const metadata: Metadata = {
  title: "20 Lekcji Inwestora - kurs inwestowania w mieszkania na wynajem | Bartosz Nosiadek",
  description:
    "Praktyczny kurs inwestowania w mieszkania na wynajem od praktyka, który od 20 lat zarządza setkami mieszkań. 20 lekcji wideo + bestsellerowa książka gratis. Dostęp od razu po zakupie.",
  alternates: { canonical: "/kurs-20-lekcji-inwestora" },
  openGraph: {
    title: "20 Lekcji Inwestora - kurs inwestowania w mieszkania na wynajem",
    description:
      "20 lekcji wideo od praktyka z 20-letnim stażem + bestsellerowa książka „Zarabianie Uczciwych Pieniędzy” w gratisie. Dostęp od razu po zakupie.",
    url: "/kurs-20-lekcji-inwestora",
    type: "website",
    locale: "pl_PL",
  },
};

const PROBLEMS = [
  "Boisz się, że trafisz na najemcę, którego nie da się eksmitować?",
  "Nie wiesz, czy to dobry moment, czy właśnie pęka bańka?",
  "Obawiasz się, że źle policzysz rentowność i kupisz mieszkanie, które nie zarabia?",
  "Boisz się, że kupisz mieszkanie z ładnego folderu dewelopera, które potem trudno wynająć?",
];

type Module = { n: string; title: string; lead: string; topics: string[] };

const MODULES: Module[] = [
  {
    n: "01",
    title: "Rynek i trendy",
    lead: "Zrozum, co naprawdę rządzi cenami mieszkań w Polsce.",
    topics: [
      "Dlaczego najem, a nie lokata czy giełda",
      "Co napędza ceny mieszkań",
      "Jak czytać ryzyko bańki",
    ],
  },
  {
    n: "02",
    title: "Ceny i rentowność",
    lead: "Policz, zanim kupisz. Na liczbach, nie na przeczuciu.",
    topics: [
      "Jak policzyć rentowność (cap rate)",
      "Dlaczego nieruchomości drożeją",
      "Kawalerka czy M4 - co się bardziej opłaca",
    ],
  },
  {
    n: "03",
    title: "Jak wybrać i sprawdzić nieruchomość",
    lead: "Czego nie wolno pominąć przed podpisaniem umowy.",
    topics: [
      "Sprawdzenie stanu prawnego przed umową",
      "Lokalizacja, która wynajmie się sama",
      "Stan techniczny - na co zwrócić uwagę",
    ],
  },
  {
    n: "04",
    title: "Najem w praktyce",
    lead: "Bezpiecznie wynajmij i ogranicz pustostan.",
    topics: [
      "Najem okazjonalny i bezpieczne wynajęcie",
      "Ile naprawdę trwa eksmisja",
      "Jak ograniczyć pustostany",
    ],
  },
  {
    n: "05",
    title: "Za kulisami",
    lead: "Pokazuję, jak robimy to naprawdę.",
    topics: [
      "Jak budujemy i wykańczamy mieszkania pod najem",
      "Czy deweloper może być uczciwy - szczera rozmowa",
    ],
  },
];

const AUTHORITY = [
  { value: "20 lat", label: "na rynku nieruchomości" },
  { value: "setki", label: "mieszkań na wynajem" },
  { value: "1", label: "bestsellerowa książka" },
];

const TESTIMONIALS = [
  {
    name: "Witek Wiśniewski",
    role: "Czytelnik",
    quote:
      "Dzięki lekturze znalazłem oszczędności na kwotę ponad 6 000 zł rocznie, łącznie w budżecie prywatnym i firmowym. To 120 razy więcej niż wyniosła cena książki. Zdecydowanie polecam.",
  },
  {
    name: "Waldemar Rudnicki",
    role: "Przedsiębiorca",
    quote:
      "Wielu inwestorów mówi tylko o sukcesach albo podkolorowuje swoje sukcesy, a w tej książce jest zwrócenie uwagi na niebezpieczeństwa, szczególnie dla tych, co się zachłysnęli książkami Kiyosakiego.",
  },
  {
    name: "Andrzej Sobczyk",
    role: "Współtwórca Grupy Rafael i Akademii Właściwy TOR",
    quote:
      "Nie są to zwykłe sukcesy biznesowe, ale skutecznie realizowana całościowa wizja człowieka szczęśliwego. Z przyjemnością układam swoje sprawy finansowe w oparciu o jego wiedzę. Polecam zdecydowanie.",
  },
  {
    name: "Franciszek Kucharczak",
    role: "Redaktor Gość.pl",
    quote:
      "Po przeczytaniu tej książki łatwiej dostrzec, że ekonomia, obojętnie w jakiej skali, jest tak samo terenem walki duchowej, jak każda inna dziedzina ludzkiego życia.",
  },
];

const FAQ = [
  {
    q: "Dla kogo jest ten kurs?",
    a: "Dla osób, które chcą bezpiecznie zacząć inwestować w mieszkania na wynajem, oraz dla tych, którzy mają już jedno-dwa mieszkania i chcą uniknąć kosztownych błędów. Tłumaczę od podstaw, ale na konkretnych liczbach i przypadkach.",
  },
  {
    q: "Jak i kiedy dostaję dostęp?",
    a: "Dostęp do kursu otrzymujesz od razu po opłaceniu zamówienia. Wszystko w formie cyfrowej - oglądasz online, kiedy chcesz.",
  },
  {
    q: "Na jak długo mam dostęp?",
    a: "Na stałe. Możesz wracać do lekcji, gdy będziesz analizować konkretne mieszkanie.",
  },
  {
    q: "Jakie są formy płatności? Czy dostanę fakturę?",
    a: "Płacisz wygodnie przez BLIK, Przelewy24 lub kartą. Fakturę wystawiamy na życzenie - wystarczy podać dane przy zamówieniu.",
  },
  {
    q: "Jak działa gwarancja?",
    a: "Masz 30 dni. Jeśli uznasz, że kurs nic Ci nie dał - napisz do nas, a oddamy pieniądze. Gramy fair.",
  },
  {
    q: "Co dostaję w bonusie i jak odebrać materiały dla zapisanych?",
    a: BONUS.active
      ? `Do ${BONUS.deadline} do kursu dorzucam pakiet książki „Zarabianie Uczciwych Pieniędzy” o wartości ${BONUS.value} gratis - drukowana książka, e-book, audiobook (CD + MP3), szkolenie VOD 2,5 h i darmowa wysyłka. Zapisując się do newslettera przy zakupie, dostajesz ode mnie dodatkowo streszczenie rysunkowe książki.`
      : "Zapisując się do newslettera przy zakupie, dostajesz ode mnie streszczenie rysunkowe książki „Zarabianie Uczciwych Pieniędzy” - wyślę Ci je na maila.",
  },
  {
    q: "Czy to nie jest „szybkie wzbogacenie się”?",
    a: "Nie. Nie obiecuję, że staniesz się milionerem w 30 dni i nie obiecuję żadnych gwarantowanych zwrotów. To konkret z praktyki - aktualny stan prawny i doświadczenie z setek mieszkań, który ma Cię uchronić przed kosztownym błędem.",
  },
];

export default function Kurs20LekcjiPage() {
  const freeLesson = getFreeLesson();
  return (
    <>
      {/* Strona standalone - bez menu. Tylko logo w lewym górnym rogu jako
          standardowy sygnał zaufania. href={null} - logo NIE prowadzi na stronę
          główną (to myliło wchodzących z reklam), tylko przewija na górę. */}
      <header className="relative z-10">
        <div className="container-xl flex items-center py-5 md:py-6">
          <Logo href={null} />
        </div>
      </header>

      <main className="flex-1">
        {/* ============ 1. HERO ============ */}
        <section className="relative pt-6 pb-20 md:pt-8 md:pb-28 overflow-hidden">
          <div className="absolute inset-0 grad-radial-hero opacity-70" aria-hidden />
          <div className="container-xl relative">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 lg:items-center">
              <div>
                <Reveal>
                  <p className="eyebrow inline-flex items-center gap-3 mb-7">
                    <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                    Praktyczny kurs inwestowania w&nbsp;mieszkania na wynajem
                  </p>
                </Reveal>
                <Reveal delay={80}>
                  <h1
                    className="font-display text-ink-950 leading-[1.06] tracking-tight text-balance"
                    style={{ fontSize: "clamp(2.1rem, 5.2vw, 4rem)" }}
                  >
                    20 lat praktyki w&nbsp;mieszkaniach na wynajem, zebrane w&nbsp;jednym kursie.
                  </h1>
                </Reveal>
                <Reveal delay={160}>
                  <p className="mt-7 text-[16px] md:text-[19px] leading-[1.6] text-ink-700 text-pretty max-w-xl">
                    Ponad rok nagrywania i&nbsp;konkret z&nbsp;setek mieszkań. Pokazuję od środka, jak
                    to naprawdę działa, a&nbsp;nie suchą teorię.
                  </p>
                </Reveal>

                <Reveal delay={240}>
                  <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <CourseCta
                      mode="anchor"
                      section="hero"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium shadow-[var(--shadow-card)] transition-colors active:scale-[0.98]"
                    >
                      Chcę kurs + pakiet książki gratis
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </CourseCta>
                    <a
                      href="#program"
                      className="group inline-flex items-center justify-center gap-1.5 text-[15px] md:text-[16px] font-medium text-ink-700 hover:text-ink-950 transition-colors"
                    >
                      Zobacz program
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="transition-transform group-hover:translate-y-0.5">
                        <path d="M7 3v8M3 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </div>
                </Reveal>

                <Reveal delay={320}>
                  <p className="mt-7 text-[14px] text-ink-600">
                    Dostęp od razu po zakupie · BLIK, Przelewy24, karta
                  </p>
                </Reveal>
              </div>

              <Reveal delay={200}>
                <HeroMedia
                  videoId={HERO_VIDEO_ID}
                  price={PRICE}
                  bonusActive={BONUS.active}
                  bonusValue={BONUS.value}
                  bonusDeadline={BONUS.deadline}
                  priceSeparate={BONUS.priceSeparate}
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============ 2. PROBLEM ============ */}
        <section className="relative py-20 md:py-28 bg-paper-warm border-y border-ink-200/60">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Znasz to uczucie?
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Pierwsze mieszkanie na wynajem to nie miejsce na drogie błędy.
                </h2>
              </Reveal>
            </div>

            <div className="mt-14 md:mt-16 mx-auto max-w-3xl grid sm:grid-cols-2 gap-4 md:gap-5">
              {PROBLEMS.map((p, i) => (
                <Reveal key={i} delay={i * 70}>
                  <div className="h-full rounded-2xl bg-white p-6 md:p-7 border border-ink-200/60 flex gap-4">
                    <span className="mt-1 shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-500/10 text-accent-600" aria-hidden>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v9M7 13h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </span>
                    <p className="text-[15.5px] text-ink-800 leading-[1.6]">{p}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <p className="mt-14 mx-auto max-w-2xl text-center text-[17px] md:text-[19px] text-ink-700 leading-[1.65] text-pretty">
                Nie obiecuję, że staniesz się milionerem w 30 dni. Ale pokażę Ci, jak liczyć,
                sprawdzać i wynajmować tak, żeby nie tracić na błędach, które kosztują najwięcej.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ============ 3. ROZWIĄZANIE ============ */}
        <section className="relative py-20 md:py-28">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Rozwiązanie
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  „20 Lekcji Inwestora” to konkret z mojej praktyki.
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-7 text-[16px] md:text-[19px] leading-[1.65] text-ink-700 text-pretty">
                  Zebrałem w 20 lekcjach wideo aktualny stan prawny i praktykę z setek mieszkań. Po
                  kursie sam ocenisz mieszkanie, policzysz rentowność, bezpiecznie wynajmiesz
                  i ograniczysz pustostan.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-10">
                  <CourseCta
                    mode="anchor"
                    section="solution"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium transition-colors active:scale-[0.98]"
                  >
                    Zobacz, co dostajesz
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M7 3v8M3 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </CourseCta>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============ 4. PROGRAM ============ */}
        <section id="program" className="relative py-20 md:py-28 bg-paper-warm border-y border-ink-200/60 scroll-mt-24">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Program · 5 modułów
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Od rynku po klucze do najemcy.
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-5 text-[15px] md:text-[16px] text-ink-600">
                  20 lekcji wideo · ponad 3 godziny nagrań · 5 modułów
                </p>
              </Reveal>
            </div>

            <div className="mt-14 md:mt-16 mx-auto max-w-4xl space-y-5 md:space-y-6">
              {MODULES.map((mod, mi) => (
                <Reveal key={mod.n} delay={mi * 60}>
                  <article className="rounded-2xl bg-white border border-ink-200/60 p-6 md:p-8">
                    <div className="flex items-start gap-5">
                      <span className="font-display text-accent-500 text-[2.4rem] md:text-[2.8rem] leading-none tracking-tight tabular-nums">
                        {mod.n}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-display text-ink-950 text-[1.5rem] md:text-[1.75rem] leading-tight tracking-tight">
                          {mod.title}
                        </h3>
                        <p className="mt-2 text-[15px] text-ink-600 leading-[1.6]">{mod.lead}</p>
                        <ul className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
                          {mod.topics.map((t, ti) => (
                            <li key={ti} className="flex items-start gap-2.5 text-[15px] text-ink-800 leading-snug">
                              <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <div className="mt-14 text-center">
                <CourseCta
                  mode="anchor"
                  section="program"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium transition-colors active:scale-[0.98]"
                >
                  Chcę cały kurs + książkę gratis
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M7 3v8M3 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </CourseCta>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============ 4b. DARMOWA LEKCJA (teaser) ============ */}
        {freeLesson && (
          <section
            id="darmowa-lekcja"
            className="relative py-20 md:py-28 bg-ink-950 text-white grain-on-dark scroll-mt-24"
          >
            <div className="grad-radial-hero pointer-events-none absolute inset-0" />
            <div className="container-xl relative z-10">
              <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
                {/* Lewa: opis */}
                <div className="order-2 lg:order-1">
                  <Reveal>
                    <p className="eyebrow inline-flex items-center gap-3 mb-6 text-brand-300">
                      <span className="inline-block w-6 sm:w-8 h-px bg-brand-400" />
                      Obejrzyj za darmo
                    </p>
                  </Reveal>
                  <Reveal delay={80}>
                    <h2
                      className="font-display tracking-tight leading-[1.05] text-balance"
                      style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                    >
                      Zobacz jedną lekcję, zanim kupisz.
                    </h2>
                  </Reveal>
                  <Reveal delay={160}>
                    <p className="mt-5 text-[15px] md:text-[16px] leading-[1.65] text-ink-300">
                      Udostępniamy Ci jedną pełną lekcję z kursu - „{freeLesson.title}”.
                      Bez zapisów i bez płatności. Zobacz, jak Bartosz tłumaczy temat,
                      i sam oceń, czy taki sposób prowadzenia Ci pasuje.
                    </p>
                  </Reveal>
                  <Reveal delay={220}>
                    <ul className="mt-7 space-y-3">
                      {[
                        "1 z 20 lekcji, które dostajesz w kursie",
                        "Reszta materiału czeka po zakupie",
                      ].map((t, i) => (
                        <li key={i} className="flex items-start gap-3 text-[15px] text-ink-200 leading-snug">
                          <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                  <Reveal delay={280}>
                    <CourseCta
                      mode="anchor"
                      section="free_lesson"
                      className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium transition-colors active:scale-[0.98]"
                    >
                      Chcę pozostałe 19 lekcji + książkę gratis
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path d="M7 3v8M3 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </CourseCta>
                  </Reveal>
                </div>

                {/* Prawa: player */}
                <Reveal delay={120} className="order-1 lg:order-2">
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-[var(--shadow-cinematic)] border border-white/10">
                    <StreamVideo
                      id={freeLesson.videoId}
                      title={freeLesson.title}
                      poster={freeLesson.poster}
                      showCaption={false}
                    />
                  </div>
                  <p className="mt-3 text-center text-[12.5px] text-ink-400">
                    Lekcja {freeLesson.n}: {freeLesson.title}
                  </p>
                </Reveal>
              </div>
            </div>
          </section>
        )}

        {/* ============ 5. AUTOR ============ */}
        <section id="autor" className="relative py-20 md:py-28 scroll-mt-24">
          <div className="container-xl">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-center">
              <Reveal>
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[var(--shadow-cinematic)] border border-ink-200/60 max-w-md mx-auto lg:mx-0">
                  <Image
                    src={AUTHOR_PHOTO}
                    alt="Bartosz Nosiadek"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>

              <div>
                <Reveal>
                  <p className="eyebrow inline-flex items-center gap-3 mb-6">
                    <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                    Zaufaj praktykowi
                  </p>
                </Reveal>
                <Reveal delay={80}>
                  <h2
                    className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                    style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                  >
                    Bartosz Nosiadek. 20 lat na rynku, setki mieszkań na wynajem.
                  </h2>
                </Reveal>
                <Reveal delay={160}>
                  <div className="mt-7 space-y-4 text-[16px] md:text-[17px] text-ink-700 leading-[1.75] text-pretty max-w-2xl">
                    <p>
                      Od 20 lat jestem na rynku nieruchomości. Razem z zespołem wybudowaliśmy
                      osiedla, prowadzę firmę deweloperską, biuro nieruchomości i - wspólnie z żoną -
                      sieć mieszkań na wynajem.
                    </p>
                    <p>
                      Dzielę się tym, co przeszedłem naprawdę: od budowania zespołów po spłatę
                      wielomilionowych długów. Tworząc Fibrę przyjąłem prostą dewizę:{" "}
                      <span className="text-ink-950 font-medium">
                        interesy robi się z ludźmi, a nie na ludziach
                      </span>
                      . Dlatego ten kurs to konkret z praktyki, a nie obietnice bez pokrycia.
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={240}>
                  <div className="mt-9 grid grid-cols-3 gap-px bg-ink-200/60 rounded-2xl overflow-hidden border border-ink-200/60">
                    {AUTHORITY.map((a, i) => (
                      <div key={i} className="bg-paper-warm p-5 md:p-6">
                        <p className="font-display text-ink-950 text-[1.6rem] md:text-[2rem] leading-none tracking-tight tabular-nums">
                          {a.value}
                        </p>
                        <p className="mt-2 text-ink-600 text-[12.5px] leading-[1.4]">{a.label}</p>
                      </div>
                    ))}
                  </div>
                </Reveal>

                <Reveal delay={300}>
                  <div className="mt-7 flex flex-wrap gap-3 text-[14px]">
                    <a
                      href={FACEBOOK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 px-5 py-2.5 text-ink-800 hover:bg-ink-900 hover:text-white transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
                        <path d="M13.5 21v-7h2.4l.36-2.8H13.5V9.4c0-.81.22-1.36 1.38-1.36h1.47V5.53c-.25-.03-1.13-.11-2.15-.11-2.12 0-3.58 1.3-3.58 3.68v2.05H8.2V14h2.4v7h2.9z" />
                      </svg>
                      Facebook
                    </a>
                    <a
                      href={YOUTUBE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 px-5 py-2.5 text-ink-800 hover:bg-ink-900 hover:text-white transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
                        <path d="M21.6 7.2a2.4 2.4 0 0 0-1.69-1.7C18.4 5.1 12 5.1 12 5.1s-6.4 0-7.91.4A2.4 2.4 0 0 0 2.4 7.2 25 25 0 0 0 2 12a25 25 0 0 0 .4 4.8 2.4 2.4 0 0 0 1.69 1.7c1.51.4 7.91.4 7.91.4s6.4 0 7.91-.4a2.4 2.4 0 0 0 1.69-1.7A25 25 0 0 0 22 12a25 25 0 0 0-.4-4.8zM10 15V9l5.2 3-5.2 3z" />
                      </svg>
                      YouTube
                    </a>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 5b. DLACZEGO TAK TANIO ============ */}
        <section className="relative py-20 md:py-28 bg-paper-warm border-y border-ink-200/60">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Dlaczego tak tanio
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Oddaję ten kurs za {PRICE} i powiem wprost dlaczego.
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <div className="mt-7 space-y-4 text-[16px] md:text-[18px] text-ink-700 leading-[1.75] text-pretty">
                  <p>
                    Kursy o inwestowaniu w nieruchomości potrafią kosztować setki, a nawet tysiące
                    złotych. Ja nie żyję ze sprzedaży kursów. Żyję z mieszkań, które buduję i którymi
                    zarządzam.
                  </p>
                  <p>
                    Zależy mi, żebyś najpierw zobaczył, jak pracuję i jak myślę o inwestowaniu. Nie ma
                    tu haczyka ani upsellu - nie sprzedaję potem kolejnych szkoleń. Po prostu
                    przekazuję to, co wiem.
                  </p>
                  <p>
                    Gram w otwarte karty - tym kierowałem się przez całą swoją karierę. Mój cel jest
                    prosty: przekazać Ci wiedzę o inwestowaniu w nieruchomości, bo sam uważam je za
                    dobrą inwestycję i sam się na tym znam.
                  </p>
                  <p>
                    Mam nadzieję, że kiedy już tę wiedzę zdobędziesz i zechcesz kupić mieszkanie na
                    wynajem, zrobisz to razem z nami - bo będziesz już wiedział, jak pracujemy i jakie
                    mamy wartości.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============ 6. BONUS (pakiet książki, do BONUS.deadline) ============ */}
        {/* Cała sekcja znika, gdy BONUS.active = false (po terminie bonusu). */}
        {BONUS.active && (
        <section id="bonus" className="relative py-20 md:py-32 bg-ink-950 text-ink-100 overflow-hidden scroll-mt-24">
          <div className="absolute inset-0 grad-radial-brand opacity-50" aria-hidden />
          <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
          <div className="container-xl relative">
            <div className="grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center">
              <Reveal>
                <div className="relative mx-auto max-w-md">
                  <Image
                    src={bookMockup}
                    alt="Książka „Zarabianie Uczciwych Pieniędzy” Bartosza Nosiadka - przód i tył okładki"
                    sizes="(max-width: 1024px) 80vw, 40vw"
                    className="w-full h-auto drop-shadow-2xl"
                  />
                  <div className="absolute -bottom-4 -left-2 sm:-left-5 rotate-[-3deg] rounded-full bg-accent-500 text-white px-5 py-2 text-[13px] font-semibold shadow-lg">
                    Wartość {BONUS.value} - w prezencie
                  </div>
                </div>
              </Reveal>

              <div>
                <Reveal>
                  <p className="eyebrow eyebrow-on-dark inline-flex items-center gap-2.5 mb-6">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent-400" aria-hidden>
                      <path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7H8.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h3.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Bonus do {BONUS.deadline}
                  </p>
                </Reveal>
                <Reveal delay={80}>
                  <h2
                    className="font-display text-white tracking-tight leading-[1.05] text-balance"
                    style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                  >
                    Do {BONUS.deadline} dorzucam pakiet książki o wartości {BONUS.value}.
                  </h2>
                </Reveal>
                <Reveal delay={160}>
                  <p className="mt-7 text-[16px] md:text-[18px] text-ink-200 leading-[1.75] text-pretty max-w-2xl">
                    Do kursu dokładam cały pakiet wokół mojego bestsellera „Zarabianie Uczciwych
                    Pieniędzy” - <span className="text-white font-medium">wartość {BONUS.value}</span>,
                    Ty dostajesz go ode mnie w prezencie. Szczera, oparta na wartościach lektura o
                    wychodzeniu z długów i porządkowaniu finansów, w kilku formatach naraz.
                  </p>
                </Reveal>

                <Reveal delay={200}>
                  <div className="mt-7">
                    <ScarcityNote tone="dark" stockLeft={BONUS.stockLeft} />
                  </div>
                </Reveal>

                <Reveal delay={220}>
                  <ul className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3">
                    {BONUS.items.map((it, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15.5px] md:text-[16px] text-ink-100 leading-snug">
                        <span className="mt-0.5 shrink-0 text-accent-400" aria-hidden>
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3.5 9.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </Reveal>

                <Reveal delay={280}>
                  <div className="mt-8 rounded-2xl border border-white/12 bg-white/[0.05] backdrop-blur-md p-6 md:p-7">
                    <p className="eyebrow eyebrow-on-dark mb-3">Dla zapisanych do newslettera</p>
                    <p className="text-[15.5px] md:text-[16px] text-ink-200 leading-[1.75]">
                      Zapisując się do newslettera, dostajesz ode mnie dodatkowo{" "}
                      <span className="text-white font-medium">streszczenie rysunkowe</span> książki -
                      wyślę Ci je na maila.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>

            <div className="mt-16 lg:mt-20 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-14 items-center">
              <Reveal delay={80}>
                <div>
                  <p className="eyebrow eyebrow-on-dark mb-5">Obejrzyj, o czym jest książka</p>
                  <BookVideo
                    id={BOOK_VIDEO_ID}
                    title="O czym jest książka „Zarabianie Uczciwych Pieniędzy”"
                  />
                </div>
              </Reveal>

              <Reveal delay={160}>
                <div className="relative">
                  <div className="overflow-hidden rounded-2xl border border-white/12 shadow-2xl">
                    <Image
                      src={bartoszBooks}
                      alt="Bartosz Nosiadek przy nakładzie swojej książki „Zarabianie Uczciwych Pieniędzy”"
                      placeholder="blur"
                      sizes="(max-width: 1024px) 90vw, 32vw"
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="mt-4 text-[14px] text-ink-300 leading-[1.6]">
                    Tysiące sprzedanych egzemplarzy. Jeden z nich trafia do Ciebie razem z kursem.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
        )}

        {/* ============ 7. CO DOSTAJESZ + CENA ============ */}
        <section id="zamow" className="relative py-20 md:py-28 scroll-mt-24">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Co dostajesz
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Wszystko w jednym pakiecie.
                </h2>
              </Reveal>
            </div>

            <Reveal delay={120}>
              <div className="mt-14 mx-auto max-w-2xl rounded-3xl bg-white border border-ink-200/60 shadow-[var(--shadow-card)] overflow-hidden">
                <ul className="divide-y divide-ink-200/60">
                  <li className="flex items-center justify-between gap-4 px-6 md:px-8 py-5">
                    <span className="flex items-start gap-3 text-[15px] md:text-[16px] text-ink-800 leading-snug">
                      <span className="mt-0.5 text-brand-600" aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M3.5 9.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      Kurs „20 Lekcji Inwestora” (20 lekcji wideo, ponad 3 h nagrań)
                    </span>
                    <span className="shrink-0 font-display text-ink-950 text-[1.1rem] tabular-nums whitespace-nowrap">
                      {PRICE}
                    </span>
                  </li>

                  {BONUS.active && (
                    <li className="flex items-center justify-between gap-4 px-6 md:px-8 py-5">
                      <span className="flex items-start gap-3 text-[15px] md:text-[16px] text-ink-800 leading-snug">
                        <span className="mt-0.5 text-brand-600" aria-hidden>
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3.5 9.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span>
                          Pakiet książki „Zarabianie Uczciwych Pieniędzy”
                          <span className="block text-[13px] text-ink-500">{BONUS.items.join(" · ")}</span>
                        </span>
                      </span>
                      <span className="shrink-0 inline-flex flex-col items-end">
                        <span className="text-[13px] text-ink-400 line-through tabular-nums">{BONUS.value}</span>
                        <span className="text-[13px] font-semibold text-brand-700 uppercase tracking-wide">Gratis</span>
                      </span>
                    </li>
                  )}

                  <li className="flex items-center justify-between gap-4 px-6 md:px-8 py-5">
                    <span className="flex items-start gap-3 text-[15px] md:text-[16px] text-ink-800 leading-snug">
                      <span className="mt-0.5 text-brand-600" aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M3.5 9.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>
                        Streszczenie rysunkowe
                        <span className="block text-[13px] text-ink-500">przy zapisie do newslettera</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px] font-semibold text-brand-700 uppercase tracking-wide">Gratis</span>
                  </li>
                </ul>

                <div className="bg-paper-warm px-6 md:px-8 py-8 border-t border-ink-200/60">
                  <div className="text-center">
                    <p className="text-[13px] uppercase tracking-wide text-ink-500">Płacisz dziś</p>
                    <p className="mt-2 font-display text-ink-950 leading-none tracking-tight" style={{ fontSize: "clamp(2.8rem, 8vw, 3.8rem)" }}>
                      {PRICE}
                    </p>
                    {BONUS.active && (
                      <p className="mt-3 mx-auto max-w-md text-[13.5px] text-ink-600 leading-[1.6]">
                        Pakiet książki o wartości{" "}
                        <span className="text-ink-900 font-medium tabular-nums">{BONUS.value}</span> w
                        prezencie, do {BONUS.deadline}. Przy zakupie osobno:{" "}
                        <span className="tabular-nums">{BONUS.priceSeparate}</span>.
                      </p>
                    )}
                    <p className="mt-2 text-[14px] text-ink-600">Jedna płatność, dostęp na stałe.</p>
                  </div>

                  <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2.5 text-[13.5px] text-ink-700">
                    {[
                      "Dostęp na stałe",
                      ...(BONUS.active ? ["Pakiet książki gratis", "Wysyłka gratis"] : []),
                    ].map((b) => (
                      <li key={b} className="inline-flex items-center gap-2">
                        <span className="text-brand-600" aria-hidden>
                          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                            <path d="M3.5 9.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  {BONUS.active && (
                    <div className="mt-6 flex justify-center">
                      <ScarcityNote tone="light" stockLeft={BONUS.stockLeft} />
                    </div>
                  )}

                  <CourseCta
                    mode="checkout"
                    section="order"
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-8 py-4 text-[16px] font-medium transition-colors active:scale-[0.98]"
                  >
                    Kupuję dostęp ({PRICE})
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </CourseCta>
                  <p className="mt-3 text-center text-[12.5px] text-ink-500">
                    Dostęp od razu po zakupie · BLIK, Przelewy24, karta
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-12 mx-auto max-w-2xl text-center text-[15px] md:text-[16px] text-ink-600 leading-[1.7] text-pretty">
                Pomyśl o koszcie <span className="text-ink-900 font-medium">jednego</span> złego
                najemcy, <span className="text-ink-900 font-medium">jednego</span> miesiąca
                pustostanu albo <span className="text-ink-900 font-medium">jednego</span>{" "}
                nietrafionego zakupu. Każdy z nich potrafi kosztować wielokrotność ceny kursu. Te 20
                lekcji ma Ci pomóc tego uniknąć.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ============ 8. OPINIE ============ */}
        <section id="opinie" className="relative py-20 md:py-28 bg-paper-warm border-y border-ink-200/60 scroll-mt-24">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Opinie
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Co mówią o pracy i książkach Bartosza.
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-4 text-[14px] text-ink-500">
                  Opinie o książce „Zarabianie Uczciwych Pieniędzy”. Opinie uczestników kursu
                  dołączymy wkrótce.
                </p>
              </Reveal>
            </div>

            <div className="mt-14 md:mt-16 grid sm:grid-cols-2 gap-5 md:gap-6 max-w-4xl mx-auto">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={i} delay={i * 70}>
                  <figure className="h-full rounded-2xl bg-white p-7 md:p-8 border border-ink-200/60 flex flex-col">
                    <span className="font-display text-brand-300 text-[2.5rem] leading-none" aria-hidden>“</span>
                    <blockquote className="-mt-3 text-[16px] md:text-[17px] text-ink-800 leading-[1.7] text-pretty flex-1">
                      {t.quote}
                    </blockquote>
                    <figcaption className="mt-5 pt-5 border-t border-ink-200/60">
                      <p className="font-medium text-ink-950 text-[15px]">{t.name}</p>
                      <p className="text-ink-500 text-[13px]">{t.role}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ 9. GWARANCJA ============ */}
        <section className="relative py-20 md:py-28">
          <div className="container-xl">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center rounded-3xl border border-brand-200 bg-brand-50/60 p-10 md:p-14">
                <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-500/10 text-brand-700" aria-hidden>
                  <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                    <path d="M16 3l11 4v8c0 7-4.5 11.5-11 14C9.5 26.5 5 22 5 15V7l11-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    <path d="M11 16l3.5 3.5L21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h2 className="mt-6 font-display text-ink-950 tracking-tight leading-[1.05]" style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}>
                  30-dniowa gwarancja satysfakcji.
                </h2>
                <p className="mt-5 text-[16px] md:text-[18px] text-ink-700 leading-[1.75] text-pretty max-w-2xl mx-auto">
                  Masz 30 dni. Jeśli uznasz, że kurs nic Ci nie dał - napisz do nas, a oddamy
                  pieniądze. Nie robimy problemów. Gramy fair.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============ 10. FAQ ============ */}
        <section id="faq" className="relative py-20 md:py-28 bg-ink-950 text-ink-100 overflow-hidden scroll-mt-24">
          <div className="absolute inset-0 grad-radial-brand opacity-40" aria-hidden />
          <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
          <div className="container-xl relative">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow eyebrow-on-dark inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-accent-400" />
                  Najczęstsze pytania
                  <span className="inline-block w-6 sm:w-8 h-px bg-accent-400" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="font-display text-white tracking-tight leading-[1.05] text-balance" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}>
                  Wszystko, o co zwykle pytacie.
                </h2>
              </Reveal>
            </div>

            <div className="mt-14 md:mt-16 mx-auto max-w-4xl space-y-4 md:space-y-5">
              {FAQ.map((item, i) => (
                <Reveal key={i} delay={i * 60}>
                  <details className="group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md open:bg-white/[0.06] transition-colors">
                    <summary className="cursor-pointer list-none p-6 md:p-7 flex items-start justify-between gap-6">
                      <span className="font-display text-white text-[1.2rem] md:text-[1.4rem] leading-tight tracking-tight">
                        {item.q}
                      </span>
                      <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white transition-transform group-open:rotate-45" aria-hidden>
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

        {/* ============ 11. FINAŁOWY CTA ============ */}
        <section className="relative py-20 md:py-32 bg-paper-warm border-t border-ink-200/60">
          <div className="container-xl text-center max-w-3xl mx-auto">
            <Reveal>
              <Image
                src={bookCta}
                alt="Książka „Zarabianie Uczciwych Pieniędzy” dołączona do kursu"
                sizes="120px"
                className="mx-auto mb-8 h-28 w-auto drop-shadow-xl"
              />
            </Reveal>
            <Reveal delay={60}>
              <p className="eyebrow inline-flex items-center gap-3 mb-6">
                <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                Ostatnia rzecz
                <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="font-display text-ink-950 tracking-tight leading-[1.05]" style={{ fontSize: "clamp(1.9rem, 4.5vw, 3.25rem)" }}>
                {BONUS.active
                  ? "20 lekcji wideo, pakiet książki w prezencie i 30 dni gwarancji."
                  : "20 lekcji wideo i 30 dni gwarancji."}
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-7 text-[16px] md:text-[18px] text-ink-700 leading-[1.75] text-pretty">
                Dostajesz cały kurs „20 Lekcji Inwestora”.{" "}
                {BONUS.active && (
                  <>
                    Do {BONUS.deadline} dorzucam pakiet książki „Zarabianie Uczciwych Pieniędzy” o
                    wartości {BONUS.value} w prezencie. Zapisz się do newslettera, a wyślę Ci też
                    streszczenie rysunkowe.{" "}
                  </>
                )}
                Dostęp od razu po zakupie. Jeśli kurs Ci nie pomoże, masz 30 dni na zwrot.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-10">
                <CourseCta
                  mode="checkout"
                  section="final"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-10 sm:px-14 py-5 text-[17px] md:text-[18px] font-medium transition-colors active:scale-[0.98]"
                >
                  {BONUS.active ? "Chcę kurs + pakiet książki gratis" : "Chcę dostęp do kursu"}
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </CourseCta>
                <p className="mt-4 text-[13.5px] text-ink-500">
                  Dostęp od razu po zakupie · BLIK, Przelewy24, karta · 30 dni gwarancji
                </p>
              </div>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-12 mx-auto max-w-2xl text-[12.5px] text-ink-500 leading-[1.6]">
                Kurs nie stanowi porady inwestycyjnej. Nie obiecujemy gwarantowanych zwrotów. Celem
                jest przekazanie wiedzy i praktyki, które pomagają podejmować lepsze decyzje.
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Minimalna stopka - strona standalone, bez menu i bez linków na stronę
          główną. Tylko obowiązki prawne: polityka prywatności, regulamin, cookies. */}
      <footer className="border-t border-ink-200/60 bg-paper">
        <div className="container-xl py-10 pb-28">
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="font-display text-[1.4rem] leading-none text-ink-950">Fibra</p>
            {/* Dokumenty prawne dotyczą sprzedaży kursu (Bartosz Nosiadek,
                NIP 647-236-75-67) - linkujemy do oficjalnych dokumentów tej
                działalności (salescrm + gorodo), te same co na
                zarabianieuczciwychpieniedzy.pl. NIE wewnętrzne strony Grupy Fibra. */}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-ink-600">
              {[
                ["Polityka prywatności", "https://bartosznosiadek.salescrm.pl/page/polityka-prywatnosci"],
                ["Regulamin", "https://bartosznosiadek.salescrm.pl/regulamin"],
                ["Klauzula informacyjna", "https://app.gorodo.pl/api/klauzula_informacyjna_klient/6472367567"],
                ["Zgoda klienta", "https://app.gorodo.pl/api/zgoda_klient/6472367567"],
                ["Klauzula marketingowa", "https://app.gorodo.pl/api/klauzula_informacyjna_marketing/6472367567"],
                ["Żądanie RODO", "https://app.gorodo.pl/api/zadanie/6472367567"],
                ["Certyfikat RODO", "https://www.gorodo.pl/certyfikat.php?nip=647-236-75-67"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="hover:text-ink-950 transition-colors"
                >
                  {label}
                </a>
              ))}
            </nav>
            <p className="max-w-xl text-[12px] leading-relaxed text-ink-400">
              Grupa Fibra Sp. z o.o. · ul. Rymera 177, 44-310 Radlin · © {new Date().getFullYear()}{" "}
              Wszelkie prawa zastrzeżone.
            </p>
          </div>
        </div>
      </footer>

      <StickyCta />
    </>
  );
}
