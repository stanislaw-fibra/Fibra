import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, ChevronDown, MapPin, Phone, Quote } from "lucide-react";
import { ZamyslowFooter } from "@/components/investments/zamyslow/ZamyslowFooter";
import { ZamyslowNav } from "@/components/investments/zamyslow/ZamyslowNav";
import { InvestorCta } from "@/components/investments/zamyslow/investor/InvestorCta";
import { Reveal } from "@/components/ui/Reveal";
import { getPublicFounder, getPublicTeamMember } from "@/lib/team-query";
import { getZamyslowUnitsSummary } from "@/lib/investments/zamyslow-units";
import { proofFacts } from "@/lib/investments/zamyslow-proof";
import {
  ZAMYSLOW_AGENT_BIO,
  ZAMYSLOW_AGENT_FALLBACK,
  ZAMYSLOW_PHONE,
} from "@/lib/investments/zamyslow-data";
import { ArticleToc, type TocItem } from "./ArticleToc";
import { CalcFlow } from "./CalcFlow";
import {
  CHOICE,
  FAQ,
  FIT_NO,
  FIT_YES,
  MARKET_FIGURES,
  RISKS,
  SUMMARY,
  type IconItem,
} from "./content";

// Portrety (Bartosz, Arek) i liczba lokali lecą z bazy i arkusza - odświeżamy
// stronę co minutę, zamiast zamrażać ją na buildzie.
export const revalidate = 60;

const TITLE = "Czy inwestycja w mieszkanie jest dla mnie?";
const DESCRIPTION =
  "Poradnik dla osób z odłożonym kapitałem: komu najem się opłaca, a komu nie, jakie są ryzyka i koszty, co trzeba policzyć i na co patrzeć przy wyborze mieszkania.";

export const metadata: Metadata = {
  title: `${TITLE} | Fibra Nieruchomości`,
  description: DESCRIPTION,
  alternates: { canonical: "/czy-inwestycja-w-mieszkanie-jest-dla-mnie" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/czy-inwestycja-w-mieszkanie-jest-dla-mnie",
    type: "article",
    locale: "pl_PL",
  },
};

const TOC: TocItem[] = [
  { id: "dla-kogo", label: "Komu najem się opłaca" },
  { id: "rynek", label: "Dlaczego kapitał trafia do mieszkań" },
  { id: "ryzyka", label: "Ryzyka i jak je ograniczać" },
  { id: "rachunek", label: "Co trzeba policzyć" },
  { id: "wybor", label: "Jak wybrać mieszkanie" },
  { id: "pytania", label: "Najczęstsze pytania" },
];

/**
 * Układ jak w blogach firmowych: na desktopie trzy kolumny - spis treści,
 * artykuł, karta kontaktu - w tej samej siatce co nagłówek i zdjęcie otwierające.
 * Poniżej `lg` zostaje sama kolumna artykułu.
 */
const FRAME = "mx-auto w-full max-w-[86rem] px-5 sm:px-8 lg:px-10";
const GRID =
  "lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-x-14 xl:grid-cols-[13rem_minmax(0,1fr)_18rem] xl:gap-x-16";
const SECTION = "mt-20 md:mt-24";
const H2 = "scroll-mt-28 font-display text-[clamp(2rem,3vw,2.5rem)] leading-[1.08] text-ink-950 text-balance";
const P = "text-[18px] leading-[1.7] text-ink-800";

export default async function CzyInwestycjaPage() {
  const [founder, arek, units] = await Promise.all([
    getPublicFounder(),
    getPublicTeamMember(ZAMYSLOW_AGENT_FALLBACK.name),
    getZamyslowUnitsSummary(),
  ]);

  const agent = {
    name: arek?.name ?? ZAMYSLOW_AGENT_FALLBACK.name,
    role: arek?.role ?? ZAMYSLOW_AGENT_FALLBACK.role,
    photoUrl: arek?.photoUrl ?? ZAMYSLOW_AGENT_FALLBACK.photoUrl,
    videoId: arek?.cloudflareVideoId,
    bio: ZAMYSLOW_AGENT_BIO,
  };
  const founderPhoto = founder?.photoUrl ?? "/kurs/bartosz-nosiadek.jpg";
  const proof = proofFacts.filter((f): f is { value: string; label: string } => f.value !== null);

  return (
    <>
      <a
        href="#tresc"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-ink-950 focus:px-5 focus:py-3 focus:text-[15px] focus:text-white"
      >
        Przejdź do treści
      </a>
      <ZamyslowNav />
      <main id="tresc" className="flex-1 bg-paper pt-[72px]">
        <article className="pb-24 md:pb-32">
          {/* Nagłówek: tytuł na linii kolumny artykułu, zdjęcie na całą szerokość */}
          <header className={`${FRAME} pt-14 md:pt-20`}>
            <div className={GRID}>
              <div className="lg:col-start-2 xl:col-span-2">
                <Reveal>
                  <h1 className="max-w-[20ch] font-display text-[clamp(2.6rem,5.2vw,4.5rem)] leading-[1.02] text-ink-950 text-balance">
                    {TITLE}
                  </h1>
                </Reveal>
                <Reveal delay={90}>
                  <p className="mt-6 max-w-[46ch] text-[19px] leading-[1.6] text-ink-700 text-pretty md:text-[21px]">
                    Zanim kupisz mieszkanie pod wynajem, sprawdź, czy pasuje do Twojej sytuacji, jakie ma
                    ryzyka i ile naprawdę zostaje po kosztach.
                  </p>
                </Reveal>
              </div>
            </div>
            <Reveal delay={180} className="mt-12 md:mt-14">
              <Photo
                src="/wynajem-zamyslow/hero.jpg"
                alt="Budynki Osiedla Zamysłów w Rybniku o zmierzchu, przed nimi pole"
                caption="Osiedle Zamysłów w Rybniku"
                aspect="aspect-[16/9] lg:aspect-[21/9]"
                sizes="(min-width: 1380px) 1300px, 100vw"
                priority
              />
            </Reveal>
          </header>

          <div className={`${FRAME} mt-14 md:mt-20`}>
            <div className={GRID}>
              {/* Lewa kolumna: spis treści */}
              <aside className="hidden lg:block">
                <div className="sticky top-[104px]">
                  <ArticleToc items={TOC} />
                </div>
              </aside>

              {/* Środek: artykuł */}
              <div className="min-w-0">
                <Reveal>
                  <p className={`${P} text-ink-950`}>
                    Masz odłożone kilkaset tysięcy złotych i zastanawiasz się, co z nimi zrobić. Lokata
                    ledwo nadąża za inflacją, a coraz więcej osób kupuje mieszkania pod wynajem.
                  </p>
                </Reveal>
                <Reveal delay={60}>
                  <p className={`${P} mt-5`}>
                    Od ponad 20 lat budujemy w Rybniku, a od 17 lat zarządzamy najmem. Dziś mamy pod opieką
                    ponad 120 mieszkań. Mieszkanie na wynajem może być bardzo dobrym miejscem na kapitał.
                    Potrafi też nie zarabiać, jeśli stoi puste albo trafi się zły lokator.
                  </p>
                </Reveal>

                <Reveal delay={120}>
                  <aside aria-labelledby="w-skrocie" className="mt-10 rounded-[var(--radius-lg)] bg-brand-50 p-7 sm:p-9">
                    <h2 id="w-skrocie" className="font-display text-[1.75rem] leading-tight text-ink-950">
                      Najważniejsze w skrócie
                    </h2>
                    <ul className="mt-6 grid gap-x-8 gap-y-4 md:grid-cols-2">
                      {SUMMARY.map((s) => (
                        <li key={s} className="flex gap-3.5 text-[17px] leading-[1.55] text-ink-800">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                            <Check size={14} strokeWidth={2.5} aria-hidden />
                          </span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </aside>
                </Reveal>

                {/* Komu najem się opłaca */}
                <section aria-labelledby="dla-kogo" className={SECTION}>
                  <Reveal>
                    <h2 id="dla-kogo" className={H2}>
                      Komu najem się opłaca
                    </h2>
                  </Reveal>
                  <Reveal delay={60}>
                    <p className={`${P} mt-5`}>
                      Najem nie pasuje do każdej sytuacji finansowej. Jeśli więcej punktów z drugiej listy
                      dotyczy Ciebie, lepiej jeszcze poczekać.
                    </p>
                  </Reveal>
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <FitCard title="Ma sens, gdy" tone="yes" items={FIT_YES} />
                    <FitCard title="Lepiej poczekać, gdy" tone="no" items={FIT_NO} delay={90} />
                  </div>
                </section>

                <PullQuote
                  photo={founderPhoto}
                  text="Inwestowanie to przeznaczanie nadwyżek, a nie nalewanie wody do dziurawego wiadra."
                />

                {/* Rynek */}
                <section aria-labelledby="rynek" className={SECTION}>
                  <Reveal>
                    <h2 id="rynek" className={H2}>
                      Dlaczego kapitał trafia do mieszkań
                    </h2>
                  </Reveal>
                  <Reveal delay={60}>
                    <p className={`${P} mt-5`}>
                      Mieszkań w Polsce wciąż brakuje, a rynek najmu jest dużo mniejszy niż w zachodniej
                      Europie.
                    </p>
                  </Reveal>
                  <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                    {MARKET_FIGURES.map((f, i) => (
                      <Reveal key={f.value} delay={(i % 2) * 80}>
                        <div className="flex h-full flex-col rounded-[var(--radius-lg)] bg-white p-7 transition-transform duration-300 hover:-translate-y-0.5">
                          <dt className="font-display text-[2.75rem] leading-none tabular-nums text-brand-600">
                            {f.value}
                          </dt>
                          <dd className="mt-4 flex flex-1 flex-col justify-between gap-4">
                            <span className="text-[16.5px] leading-[1.55] text-ink-800">{f.label}</span>
                            <span className="text-[13.5px] text-ink-500">Źródło: {f.source}</span>
                          </dd>
                        </div>
                      </Reveal>
                    ))}
                  </dl>
                  <Reveal>
                    <p className={`${P} mt-8`}>
                      Coraz więcej młodych osób wynajmuje, bo na własne mieszkanie potrzeba dużego wkładu.
                      Widzą to fundusze z Zachodu: u siebie mają z najmu około 1,5% rocznie, więc kupują w
                      Polsce całe osiedla. Ceny mogą jednak stać w miejscu albo lekko spaść, dlatego tych
                      liczb nie traktujemy jak obietnicy.
                    </p>
                  </Reveal>
                  <Reveal className="mt-12">
                    <Photo
                      src="/wynajem-zamyslow/wnetrza/01.jpg"
                      alt="Salon wynajmowanego mieszkania z czerwoną sofą i wyjściem do ogródka"
                      caption="Wynajmowane mieszkanie na Osiedlu Zamysłów"
                    />
                  </Reveal>
                </section>

                {/* Ryzyka */}
                <section aria-labelledby="ryzyka" className={SECTION}>
                  <Reveal>
                    <h2 id="ryzyka" className={H2}>
                      Ryzyka i jak je ograniczać
                    </h2>
                  </Reveal>
                  <Reveal delay={60}>
                    <p className={`${P} mt-5`}>
                      Najem to coś za coś: czynsz wpływa co miesiąc, ale po drodze może się trafić pusty
                      miesiąc, zły najemca albo awaria. Przy każdym ryzyku piszemy, co pomaga je ograniczyć.
                    </p>
                  </Reveal>
                  <ul className="mt-8 grid gap-4 md:grid-cols-2">
                    {RISKS.map((r, i) => (
                      <Reveal
                        key={r.title}
                        as="li"
                        delay={(i % 2) * 80}
                        className={i === RISKS.length - 1 && RISKS.length % 2 === 1 ? "md:col-span-2" : ""}
                      >
                        <div className="flex h-full flex-col rounded-[var(--radius-lg)] bg-white p-7">
                          <div className="flex items-center gap-4">
                            <IconBadge icon={r.icon} />
                            <h3 className="text-[18px] font-semibold leading-snug text-ink-950">{r.title}</h3>
                          </div>
                          <p className="mb-5 mt-4 text-[16.5px] leading-[1.6] text-ink-700">{r.risk}</p>
                          <p className="mt-auto flex gap-2.5 rounded-[var(--radius-sm)] bg-brand-50 p-4 text-[16px] leading-[1.55] text-ink-900">
                            <Check size={18} strokeWidth={2.25} className="mt-[3px] shrink-0 text-brand-500" aria-hidden />
                            <span>
                              <span className="font-medium">Co pomaga: </span>
                              {r.help}
                            </span>
                          </p>
                        </div>
                      </Reveal>
                    ))}
                  </ul>
                </section>

                {/* Co trzeba policzyć */}
                <section aria-labelledby="rachunek" className={`${SECTION} rounded-[var(--radius-xl)] bg-paper-warm px-6 py-10 sm:px-10 sm:py-12`}>
                  <div className="grid gap-8">
                    <div className="max-w-[40rem]">
                      <Reveal>
                        <h2 id="rachunek" className={H2}>
                          Co trzeba policzyć przed zakupem
                        </h2>
                      </Reveal>
                      <Reveal delay={60}>
                        <p className={`${P} mt-5`}>
                          Rentowność w ogłoszeniach to zwykle sam czynsz podzielony przez cenę. Na czysto
                          zostaje mniej, bo po drodze są pustostan, zarządzanie, podatek i naprawy.
                        </p>
                      </Reveal>
                    </div>
                    <Reveal delay={120}>
                      <CalcFlow />
                    </Reveal>
                  </div>
                  <Reveal delay={120}>
                    <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4 rounded-[var(--radius-lg)] bg-white p-5 sm:p-6">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-ink-200">
                        <Image src={agent.photoUrl} alt="" fill sizes="48px" className="object-cover" />
                      </span>
                      <p className="min-w-[14rem] flex-1 text-[16px] leading-[1.5] text-ink-800">
                        Dla konkretnego mieszkania na Osiedlu Zamysłów taki rachunek przygotuje nasz specjalista{" "}
                        {agent.name}. Czynsz oszacuje na podstawie stawek z mieszkań, którymi już zarządzamy.
                      </p>
                      <a
                        href="#kontakt"
                        className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-ink-950 px-6 text-[15px] font-medium text-white transition-colors duration-300 hover:bg-brand-500 active:scale-[0.98]"
                      >
                        Poproś o wyliczenie
                        <ArrowRight size={16} aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5" />
                      </a>
                    </div>
                  </Reveal>
                </section>

                {/* Wybór mieszkania */}
                <section aria-labelledby="wybor" className={SECTION}>
                  <Reveal>
                    <h2 id="wybor" className={H2}>
                      Jak wybrać mieszkanie pod wynajem
                    </h2>
                  </Reveal>
                  <Reveal delay={60}>
                    <p className={`${P} mt-5`}>
                      O tym, czy mieszkanie będzie się dobrze wynajmować, decyduje kilka rzeczy. Sprawdź każdą
                      z nich przed podpisaniem umowy.
                    </p>
                  </Reveal>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {CHOICE.map((c, i) => (
                      <Reveal key={c.title} delay={(i % 2) * 80}>
                        <div className="h-full rounded-[var(--radius-lg)] bg-white p-7">
                          <IconBadge icon={c.icon} />
                          <h3 className="mt-5 text-[18px] font-semibold text-ink-950">{c.title}</h3>
                          <p className="mt-2 text-[16.5px] leading-[1.6] text-ink-700">{c.body}</p>
                        </div>
                      </Reveal>
                    ))}
                    <Reveal delay={80}>
                      <div className="flex h-full flex-col rounded-[var(--radius-lg)] bg-brand-700 p-7 text-white">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
                          <MapPin size={20} strokeWidth={1.75} aria-hidden />
                        </span>
                        <h3 className="mt-5 text-[18px] font-semibold">Dlaczego Rybnik</h3>
                        <p className="mt-2 text-[16.5px] leading-[1.6] text-white/85">
                          Rybnik jest centrum subregionu, do którego należą też Żory, Wodzisław Śląski, Racibórz
                          i Jastrzębie-Zdrój. Mieszkają tu setki tysięcy osób, a miasto pracuje cały rok.
                        </p>
                      </div>
                    </Reveal>
                  </div>
                </section>

                <PullQuote
                  photo={founderPhoto}
                  text="Nie chodzi o idealny moment, tylko o to, żeby spędzić wystarczająco dużo czasu na rynku."
                />

                <Reveal className={SECTION}>
                  <Photo
                    src="/wynajem-zamyslow/osiedle/01.jpg"
                    alt="Budynki Osiedla Zamysłów w słoneczny dzień, widok od strony pól"
                    caption="Budynki, którymi zarządzamy na Osiedlu Zamysłów"
                  />
                </Reveal>

                {/* Pytania */}
                <section aria-labelledby="pytania" className={SECTION}>
                  <Reveal>
                    <h2 id="pytania" className={H2}>
                      Pytania, które słyszymy najczęściej
                    </h2>
                  </Reveal>
                  <div className="mt-8 space-y-2.5">
                    {FAQ.map((f, i) => (
                      <Reveal key={f.q} delay={Math.min(i, 4) * 50}>
                        <details className="faq-item group rounded-[var(--radius-md)] bg-white">
                          <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-4 px-6 py-4 text-[17px] font-medium text-ink-950 transition-colors duration-200 hover:text-brand-600">
                            {f.q}
                            <ChevronDown size={20} aria-hidden className="faq-chevron shrink-0 text-ink-500" />
                          </summary>
                          <p className="px-6 pb-6 text-[16.5px] leading-[1.65] text-ink-700">{f.a}</p>
                        </details>
                      </Reveal>
                    ))}
                  </div>
                  <p className="mt-10 text-[14px] leading-relaxed text-ink-500">
                    Artykuł ma charakter informacyjny i nie jest poradą inwestycyjną, podatkową ani prawną.
                  </p>
                </section>
              </div>

              {/* Prawa kolumna: kto policzy i dlaczego warto nam zaufać */}
              <aside aria-label="Kontakt ze specjalistą" className="hidden xl:block">
                <div className="sticky top-[104px] space-y-4">
                  <div className="rounded-[var(--radius-lg)] bg-white p-6">
                    <div className="flex items-center gap-3.5">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-ink-200">
                        <Image src={agent.photoUrl} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                      <p className="text-[15px] leading-snug">
                        <span className="block font-semibold text-ink-950">{agent.name}</span>
                        <span className="text-ink-600">{agent.role}</span>
                      </p>
                    </div>
                    <p className="mt-5 text-[15.5px] leading-[1.55] text-ink-800">
                      Policzy rentowność dla konkretnego mieszkania i odpowie na pytania o najem.
                    </p>
                    <a
                      href="#kontakt"
                      className="group mt-5 flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink-950 px-5 text-[15px] font-medium text-white transition-colors duration-300 hover:bg-brand-500"
                    >
                      Umów rozmowę
                      <ArrowRight size={16} aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </a>
                    <a
                      href={`tel:${ZAMYSLOW_PHONE.tel}`}
                      className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-full text-[15px] text-ink-800 transition-colors duration-200 hover:bg-ink-100/70 hover:text-ink-950"
                    >
                      <Phone size={16} aria-hidden />
                      {ZAMYSLOW_PHONE.display}
                    </a>
                  </div>
                  {proof.length > 0 ? (
                    <dl className="rounded-[var(--radius-lg)] bg-brand-700 p-6 text-white">
                      {proof.map((f, i) => (
                        <div key={f.label} className={i > 0 ? "mt-4" : ""}>
                          <dt className="font-display text-[2rem] leading-none tabular-nums">{f.value}</dt>
                          <dd className="mt-1 text-[14.5px] leading-snug text-white/80">{f.label}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              </aside>
            </div>
          </div>

          {/* Konkretna inwestycja: znów na całą szerokość */}
          <section aria-labelledby="osiedle" className={`${FRAME} mt-24 md:mt-32`}>
            <Reveal>
              <div className="grid overflow-hidden rounded-[var(--radius-xl)] bg-ink-950 text-white lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="article-photo relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[30rem]">
                  <Image
                    src="/investments/zamyslow/images/wizualizacja-6-master-3309x1847.jpg"
                    alt="Wizualizacja nowego budynku Osiedla Zamysłów wśród zieleni"
                    fill
                    quality={85}
                    sizes="(min-width: 1024px) 760px, 100vw"
                    className="object-cover object-[40%_50%]"
                  />
                </div>
                <div className="flex flex-col justify-center px-7 py-12 sm:px-12 sm:py-14">
                  <h2 id="osiedle" className="font-display text-[clamp(2rem,3.2vw,2.75rem)] leading-[1.05]">
                    Osiedle Zamysłów w Rybniku
                  </h2>
                  <p className="mt-5 max-w-[44ch] text-[17px] leading-[1.65] text-white/85">
                    Nowy budynek na osiedlu, na którym od lat wynajmujemy mieszkania i zarządzamy najmem.
                    {units?.total ? ` ${units.total} mieszkań` : " Mieszkania"} dwu- i trzypokojowych
                    {units?.areaFromToLabel ? `, ${units.areaFromToLabel},` : ""} wykończonych pod klucz.
                    Odbiór budynku planujemy na maj 2028 roku.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
                    <Link
                      href="/zamyslow#mieszkania"
                      className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 text-[15px] font-medium text-ink-950 transition-colors duration-300 hover:bg-accent-400"
                    >
                      Zobacz mieszkania
                      <ArrowRight size={16} aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                    <a
                      href="#kontakt"
                      className="inline-flex min-h-11 items-center text-[15px] text-white/80 underline underline-offset-4 transition-colors duration-200 hover:text-white"
                    >
                      Porozmawiaj o liczbach
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        </article>

        <InvestorCta agent={agent} />
      </main>
      <ZamyslowFooter />
    </>
  );
}

function Photo({
  src,
  alt,
  caption,
  priority = false,
  aspect = "aspect-[16/9]",
  sizes = "(min-width: 1024px) 760px, 100vw",
}: {
  src: string;
  alt: string;
  caption: string;
  priority?: boolean;
  aspect?: string;
  sizes?: string;
}) {
  return (
    <figure>
      <div className={`article-photo relative overflow-hidden rounded-[var(--radius-xl)] bg-ink-200 ${aspect}`}>
        <Image src={src} alt={alt} fill priority={priority} quality={85} sizes={sizes} className="object-cover" />
      </div>
      <figcaption className="mt-3 text-[14px] text-ink-500">{caption}</figcaption>
    </figure>
  );
}

function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
      <Icon size={20} strokeWidth={1.75} aria-hidden />
    </span>
  );
}

function FitCard({
  title,
  tone,
  items,
  delay = 0,
}: {
  title: string;
  tone: "yes" | "no";
  items: IconItem[];
  delay?: number;
}) {
  const badge = tone === "yes" ? "bg-brand-50 text-brand-600" : "bg-accent-50 text-accent-600";
  return (
    <Reveal delay={delay} className="h-full">
      <div className="h-full rounded-[var(--radius-lg)] bg-white p-7">
        <h3 className="font-display text-[1.65rem] leading-tight text-ink-950">{title}</h3>
        <ul className="mt-6 space-y-5">
          {items.map(({ icon: Icon, title: t, body }) => (
            <li key={t} className="grid grid-cols-[auto_1fr] gap-4">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${badge}`}>
                <Icon size={19} strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-[17px] font-semibold leading-snug text-ink-950">{t}</p>
                <p className="mt-1 text-[16px] leading-[1.55] text-ink-700">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

/** Krótka myśl Bartosza z kursu, wpleciona między rozdziały. */
function PullQuote({ text, photo }: { text: string; photo: string }) {
  return (
    <figure className={`${SECTION} border-l-0`}>
      <Reveal>
        <div className="rounded-[var(--radius-xl)] bg-ink-950 px-7 py-10 text-white sm:px-12 sm:py-12">
          <Quote size={32} strokeWidth={1.5} aria-hidden className="text-accent-400" />
          <blockquote className="mt-4 font-display text-[22px] leading-[1.3] sm:text-[28px] md:text-[32px] md:leading-[1.25]">
            „{text}”
          </blockquote>
          <figcaption className="mt-7 flex items-center gap-3.5">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
              <Image src={photo} alt="" fill sizes="44px" className="object-cover" />
            </span>
            <span className="text-[15px] leading-snug text-white/70">
              <span className="block font-medium text-white">Bartosz Nosiadek</span>
              prezes zarządu Grupy Fibra
            </span>
          </figcaption>
        </div>
      </Reveal>
    </figure>
  );
}
