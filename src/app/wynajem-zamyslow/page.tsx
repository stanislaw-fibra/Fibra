import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { RentalsList } from "@/components/rentals/RentalsList";
import { RentalContact } from "@/components/rentals/RentalContact";
import { getZamyslowRentals, RENTAL_AGENT } from "@/lib/rentals/zamyslow-rentals";

// Lista odświeżana z arkusza co 5 minut (ISR). Arkadiusz aktualizuje arkusz,
// strona dociąga zmiany bez deployu.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Mieszkania na wynajem - Rybnik, Zamysłów (Niedobczycka 128F) | Fibra",
  description:
    "Aktualna lista mieszkań na wynajem przy ulicy Niedobczyckiej 128F w Rybniku (Zamysłów): metraż, liczba pokoi, odstępne, kaucja i miejsce postojowe. Standard premium, klimatyzacja, garaż podziemny.",
  // Strona dostępna z bezpośredniego linku, poza menu i poza wyszukiwarką.
  robots: { index: false, follow: false },
  alternates: { canonical: "/wynajem-zamyslow" },
};

const BUILDING_FACTS = [
  "Oddany do użytkowania w styczniu 2026",
  "Pięć pięter, winda",
  "Garaż podziemny",
  "Mieszkania dostępne od zaraz",
];

const AMENITIES = [
  "Klimatyzacja",
  "Rolety elektryczne w każdym oknie",
  "Balkon lub ogród przy mieszkaniu",
  "Miejsce postojowe, garaż lub miejsce w garażu podziemnym w cenie",
  "Ogrzewanie podłogowe z indywidualnym termostatem",
  "Dodatkowa przestrzeń na szafy i garderobę",
  "Światłowód doprowadzony do salonu",
  "Rowerownia i wózkownia dla mieszkańców",
];

const TERMS = [
  "Minimalny okres najmu: 12 miesięcy, z możliwością przedłużenia.",
  "Umowa najmu okazjonalnego. Koszty notarialne po stronie najemcy, około 600 zł brutto.",
  "Wymagana obecność u notariusza osoby zapewniającej lokal zastępczy.",
  "Obowiązkowe ubezpieczenie OC najemcy, około 80 zł rocznie na osobę. Pomagamy przygotować ofertę.",
  "Umowy zawierane na czas określony, bez okresu wypowiedzenia.",
  "Do odstępnego dochodzi opłata do wspólnoty około 250 zł miesięcznie oraz śmieci około 34 zł za osobę.",
  "Media (internet, prąd, woda, ogrzewanie) płatne dodatkowo według zużycia.",
  "Umowę na prąd najemca zawiera samodzielnie (przygotowujemy dokumenty). Wodę i ogrzewanie rozlicza wspólnota.",
  "Kaucja zwrotna: dwukrotność odstępnego.",
  "Bez prowizji dla biura zarządzającego najmem.",
];

const TOURS = [
  { area: "Parter, 35,15 m²", matterport: "https://spacer3d.fibranieruchomosci.pl/show/?m=HRz67Zsa9PR", youtube: "https://www.youtube.com/watch?v=vJLKSJY8Wn4" },
  { area: "27,72 m²", matterport: "https://spacer3d.fibranieruchomosci.pl/show/?m=S72qKRNS5gD", youtube: "https://www.youtube.com/watch?v=_kwZopdEIYE" },
  { area: "29,65 m²", matterport: "https://spacer3d.fibranieruchomosci.pl/show/?m=ff7htrSvnG1", youtube: "https://www.youtube.com/watch?v=8YTBwn4MwIk" },
  { area: "33,43 m²", matterport: "https://spacer3d.fibranieruchomosci.pl/show/?m=NUvomZZ1zJN", youtube: "https://www.youtube.com/watch?v=n0XiDkj-H60" },
  { area: "41,09 m²", matterport: "https://spacer3d.fibranieruchomosci.pl/show/?m=r7WCvFsviJq&mpu=439", youtube: "https://www.youtube.com/watch?v=1flD1x8C0jA" },
  { area: "52,27 m²", matterport: "https://spacer3d.fibranieruchomosci.pl/show/?m=ndifDntYvvU&mpu=439", youtube: "https://www.youtube.com/watch?v=BlutTZEi1UQ&t=3s" },
  { area: "Parter, 50,12 m²", matterport: "https://spacer3d.fibranieruchomosci.pl/show/?m=vhfYrTbt5oC&mpu=439", youtube: "https://www.youtube.com/watch?v=_czfnG-sWdA&t=8s" },
  { area: "Parter, 67 m²", matterport: "https://spacer3d.fibranieruchomosci.pl/show/?m=2YETsr3W6kF&mpu=439", youtube: "https://www.youtube.com/watch?v=ExCZ72GZWCo" },
];

export default async function Page() {
  const listing = await getZamyslowRentals();

  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-ink-950 text-ink-100">
          <div className="absolute inset-0 grad-radial-hero opacity-80" />
          <div className="container-xl relative py-20 md:py-28">
            <p className="eyebrow eyebrow-on-dark flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-accent-400" />
              Rybnik · Zamysłów
            </p>
            <h1 className="mt-6 max-w-[18ch] font-display fluid-hero text-white">
              Mieszkania na wynajem
            </h1>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-white/65">
              Nowy budynek przy ulicy Niedobczyckiej 128F. Standard premium, gotowe do wprowadzenia.
              Poniżej aktualna lista lokali, którą prowadzimy na bieżąco.
            </p>

            <ul className="mt-10 grid max-w-3xl gap-x-8 gap-y-3 sm:grid-cols-2">
              {BUILDING_FACTS.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[15px] text-white/80">
                  <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <a
                href="#mieszkania"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14px] font-medium text-ink-950 transition-colors duration-300 hover:bg-accent-400"
              >
                Zobacz mieszkania
                {listing ? <span className="text-ink-500">· {listing.available} dostępnych</span> : null}
              </a>
              <a
                href={`tel:${RENTAL_AGENT.phoneTel}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-[14px] font-medium text-white transition-colors duration-300 hover:border-white/60"
              >
                Zadzwoń: {RENTAL_AGENT.phoneDisplay}
              </a>
            </div>
          </div>
        </section>

        {/* ── Standard / wyposażenie ────────────────────────────── */}
        <section className="bg-paper py-20 md:py-28">
          <div className="container-xl">
            <div className="max-w-3xl">
              <p className="eyebrow">Standard premium</p>
              <h2 className="mt-4 font-display fluid-h2 text-ink-900">
                W każdym mieszkaniu
              </h2>
            </div>
            <ul className="mt-10 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-2">
              {AMENITIES.map((a) => (
                <li key={a} className="flex items-start gap-3 border-t border-ink-200/70 pt-4 text-[15px] text-ink-700">
                  <svg className="mt-0.5 shrink-0 text-brand-500" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Lista mieszkań ────────────────────────────────────── */}
        <section id="mieszkania" className="scroll-mt-24 bg-paper-warm py-20 md:py-28">
          <div className="container-xl">
            <div className="max-w-3xl">
              <p className="eyebrow">Niedobczycka 128F</p>
              <h2 className="mt-4 font-display fluid-h2 text-ink-900">Dostępne lokale</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
                {listing
                  ? `Aktualnie ${listing.available} z ${listing.total} lokali jest dostępnych. Listę aktualizujemy na bieżąco, ceny odstępnego podane są miesięcznie.`
                  : "Aktualną listę lokali przygotowujemy. Zadzwoń, a podamy bieżącą dostępność."}
              </p>
            </div>

            <div className="mt-10">
              {listing ? (
                <RentalsList units={listing.units} />
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-ink-200/80 bg-white p-8 text-center">
                  <p className="text-[15px] text-ink-600">
                    Lista chwilowo niedostępna.{" "}
                    <a href={`tel:${RENTAL_AGENT.phoneTel}`} className="font-medium text-brand-600 hover:text-brand-500">
                      Zadzwoń: {RENTAL_AGENT.phoneDisplay}
                    </a>
                    , a podamy aktualną dostępność.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Spacery 3D + filmy ────────────────────────────────── */}
        <section className="bg-paper py-20 md:py-28">
          <div className="container-xl">
            <div className="max-w-3xl">
              <p className="eyebrow">Zobacz wnętrza</p>
              <h2 className="mt-4 font-display fluid-h2 text-ink-900">Wirtualne spacery i filmy</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
                Przykładowe wnętrza w różnych metrażach. Obejrzyj spacer 3D albo film, zanim umówisz oglądanie.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TOURS.map((t) => (
                <div
                  key={t.matterport}
                  className="flex flex-col rounded-[var(--radius-lg)] border border-ink-200/80 bg-white p-6 shadow-[var(--shadow-card)]"
                >
                  <p className="font-display text-[22px] text-ink-900">{t.area}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={t.matterport}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-brand-500"
                    >
                      Spacer 3D
                    </a>
                    <a
                      href={t.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-4 py-2 text-[13px] font-medium text-ink-700 transition-colors hover:border-ink-400"
                    >
                      Film
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Warunki najmu ─────────────────────────────────────── */}
        <section className="bg-paper-warm py-20 md:py-28">
          <div className="container-xl">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="eyebrow">Na co warto zwrócić uwagę</p>
                <h2 className="mt-4 font-display fluid-h2 text-ink-900">Warunki najmu</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
                  Najważniejsze zasady w skrócie. Szczegóły omówimy przy rozmowie.
                </p>
              </div>
              <div className="lg:col-span-8">
                <ul className="space-y-0">
                  {TERMS.map((t) => (
                    <li
                      key={t}
                      className="flex items-start gap-4 border-t border-ink-200/70 py-4 text-[15px] leading-relaxed text-ink-700 last:border-b"
                    >
                      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Kontakt + formularz ──────────────────────────────── */}
        <RentalContact agent={{ ...RENTAL_AGENT }} />
      </main>
      <Footer />
    </>
  );
}
