import type { Metadata } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ZamyslowNav } from "@/components/investments/zamyslow/ZamyslowNav";
import { ZamyslowFooter } from "@/components/investments/zamyslow/ZamyslowFooter";
import { Reveal } from "@/components/ui/Reveal";
import { RentalsGallery } from "@/components/rentals/RentalsGallery";
import { UnitFloorPlanCard } from "@/components/investments/zamyslow/offer/UnitFloorPlanCard";
import { UnitLayout } from "@/components/investments/zamyslow/offer/UnitLayout";
import { UnitPlanViewer } from "@/components/investments/zamyslow/offer/UnitPlanViewer";
import { UnitKitchenOffer } from "@/components/investments/zamyslow/offer/UnitKitchenOffer";
import { UnitContact } from "@/components/investments/zamyslow/offer/UnitContact";
import { UnitStickyBar } from "@/components/investments/zamyslow/offer/UnitStickyBar";
import { AgentAvatar } from "@/components/offers/AgentAvatar";
import { getPublicTeamMember } from "@/lib/team-query";
import {
  ZAMYSLOW_PHONE,
  ZAMYSLOW_AGENT_FALLBACK,
} from "@/lib/investments/zamyslow-data";
import {
  getZamyslowUnit,
  formatPln,
  type ZamyslowUnitListing,
} from "@/lib/investments/zamyslow-units";
import {
  AVAILABILITY_LABEL,
  AVAILABILITY_STYLE,
  isAvailable,
} from "@/lib/investments/zamyslow-status";
import { kitchenPriceDigits } from "@/lib/investments/zamyslow-kitchen";

// ─────────────────────────────────────────────────────────────────────────────
// Strona oferty pojedynczego mieszkania (36 lokali, wspólny szablon).
// Wszystkie dane pochodzą z opublikowanego arkusza Google (zarządza Arek) -
// zmiana statusu/ceny w arkuszu pojawia się tu sama w ciągu ~5 minut.
// ─────────────────────────────────────────────────────────────────────────────

const GALLERY = Array.from({ length: 12 }, (_, i) => i + 1).map((n) => ({
  src: `/wynajem-zamyslow/wnetrza/${String(n).padStart(2, "0")}.jpg`,
  alt: "Wnętrze mieszkania - ukończony etap inwestycji przy Niedobczyckiej 128F",
}));

const roomsWord = (n: number) =>
  n === 1 ? "pokój" : n >= 2 && n <= 4 ? "pokoje" : "pokoi";

/** Miejscownik: „na parterze" / „na 3. piętrze" (do zdań w metadanych). */
const floorLocative = (floor: number) =>
  floor === 0 ? "na parterze" : `na ${floor}. piętrze`;

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const data = await getZamyslowUnit(id);
  if (!data) return { title: "Mieszkanie - Osiedle Zamysłów", robots: { index: false, follow: false } };
  const { unit } = data;
  return {
    title: `Mieszkanie ${unit.id} - ${unit.areaLabel.replace(".", ",")}, ${unit.rooms} ${roomsWord(unit.rooms)} | Osiedle Zamysłów`,
    description: `Mieszkanie ${unit.id} ${floorLocative(unit.floor)} - ${unit.areaLabel.replace(".", ",")}, ${unit.rooms} ${roomsWord(unit.rooms)}. Osiedle Zamysłów, Rybnik.`,
    alternates: { canonical: `/zamyslow/mieszkania/${unit.id.toLowerCase()}` },
  };
}

export default async function UnitPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [data, arek] = await Promise.all([
    getZamyslowUnit(id),
    getPublicTeamMember(ZAMYSLOW_AGENT_FALLBACK.name),
  ]);
  if (!data) notFound();
  const { unit, all } = data;

  // Opiekun inwestycji przy każdym punkcie kontaktu (telefon, formularz,
  // sticky bar) - dane z bazy z fallbackiem, żeby twarz była zawsze.
  const agent = {
    name: arek?.name ?? ZAMYSLOW_AGENT_FALLBACK.name,
    role: arek?.role ?? ZAMYSLOW_AGENT_FALLBACK.role,
    photoUrl: arek?.photoUrl ?? ZAMYSLOW_AGENT_FALLBACK.photoUrl,
  };

  const n = Number(unit.id.slice(1));
  const prev = all.find((u) => Number(u.id.slice(1)) === n - 1) ?? null;
  const next = all.find((u) => Number(u.id.slice(1)) === n + 1) ?? null;
  const sameFloor = all.filter((u) => u.floor === unit.floor && u.id !== unit.id);

  // Cena pokazuje się WYŁĄCZNIE przy lokalu w sprzedaży. Zarezerwowany albo
  // sprzedany lokal ma w miejscu ceny sam status (feedback klienta 08.2026):
  // kwota po rezerwacji nie jest już ofertą, więc znika ze strony.
  const forSale = isAvailable(unit.availability);
  const priceLabel = forSale
    ? unit.price
      ? formatPln(unit.price)
      : "Cena na zapytanie"
    : AVAILABILITY_LABEL[unit.availability];

  // Karta lokalu (PDF) - generowana skryptem zamyslow-unit-cards.ts dla
  // wszystkich 36 lokali (parter doszedł razem z ogródkami). Warunkiem jest
  // wyłącznie obecność pliku, więc brakująca karta nie daje martwego linku.
  const cardPdfHref = `/investments/zamyslow/karty/karta-lokalu-${unit.id.toLowerCase()}.pdf`;
  const cardPdf = existsSync(path.join(process.cwd(), "public", cardPdfHref))
    ? cardPdfHref
    : null;
  const status = AVAILABILITY_STYLE[unit.availability];

  // Kuchnia na wymiar: opcja dodatkowa przy każdej ofercie. Przy lokalu, którego
  // nie da się już kupić, nie ma czego zamawiać - a jej cena jest ceną na
  // stronie, więc znika razem z ceną mieszkania.
  const kitchenPrice = forSale ? unit.kitchenPrice : null;

  // Karta lokalu - tylko pola, które faktycznie mają wartość w arkuszu.
  const facts: { label: string; value: string }[] = [
    { label: "Piętro", value: unit.floorLabel },
    { label: "Numer lokalu", value: `${unit.building}/${unit.unitNumber}` },
    { label: "Powierzchnia", value: unit.areaLabel.replace(".", ",") },
    { label: "Pokoje", value: String(unit.rooms) },
    { label: "Sypialnie", value: String(unit.bedrooms || "") },
    { label: "Typ układu", value: unit.layoutType },
    {
      label: unit.outdoor || "Balkon / taras",
      value: unit.outdoorArea ? unit.outdoorArea.replace(".", ",") : unit.outdoor ? "Tak" : "",
    },
    {
      label: "Ogródek",
      value: unit.gardenAreaM2 ? `${String(unit.gardenAreaM2).replace(".", ",")} m²` : "",
    },
    { label: "Ekspozycja", value: unit.exposure },
    { label: "Miejsce postojowe", value: unit.parkingSpot },
    {
      label: "Cena miejsca postojowego",
      value: forSale && unit.parkingPrice ? formatPln(unit.parkingPrice) : "",
    },
    { label: "Komórka lokatorska", value: unit.storageRoom },
    { label: "Status", value: unit.statusLabel },
  ].filter((f) => f.value);

  return (
    <>
      <ZamyslowNav />
      <main className="flex-1 pt-[72px]">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section id="unit-hero" className="relative overflow-hidden bg-paper-warm">
          <div className="container-xl relative pb-14 pt-10 md:pb-20 md:pt-14">
            {/* Pasek nawigacji po ofertach: powrót + poprzednie/następne */}
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/zamyslow#lista-mieszkan"
                className="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-500 transition-colors hover:text-ink-900"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Wszystkie mieszkania
              </Link>
              <div className="flex items-center gap-2">
                <PagerLink unit={prev} dir="prev" />
                <PagerLink unit={next} dir="next" />
              </div>
            </div>

            <div className="mt-10 grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
              {/* Lewa kolumna: tożsamość mieszkania + cena + CTA */}
              <div className="lg:col-span-5">
                <Reveal>
                  <p className="eyebrow flex items-center gap-3">
                    <span className="inline-block h-px w-8 bg-brand-500" />
                    Osiedle Zamysłów · Rybnik
                  </p>

                  <h1 className="mt-7">
                    <span className="block font-display text-[clamp(22px,2.4vw,30px)] italic leading-none text-ink-500">
                      Mieszkanie
                    </span>
                    <span className="mt-2 block font-sans text-[clamp(64px,9vw,104px)] font-bold leading-[0.9] tracking-[-0.035em] tabular-nums text-ink-950">
                      {unit.id}
                      <span className="text-accent-500">.</span>
                    </span>
                  </h1>

                  <p className="mt-6 text-[16.5px] leading-relaxed text-ink-600">
                    {unit.floorLabel} · {unit.rooms} {roomsWord(unit.rooms)} ·{" "}
                    {unit.areaLabel.replace(".", ",")}
                    {unit.outdoor ? ` · ${unit.outdoor.toLowerCase()}` : ""}
                    {/* Ogródek to najczęstsze pytanie kupujących o parter
                        („dokąd sięga, jaki duży"), więc stoi już w nagłówku. */}
                    {unit.gardenAreaM2
                      ? ` · ogródek ${String(unit.gardenAreaM2).replace(".", ",")} m²`
                      : ""}
                  </p>
                </Reveal>

                <Reveal delay={80}>
                  <div className="mt-10 border-t border-ink-950/10 pt-8">
                    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
                          {forSale ? "Cena" : "Status"}
                        </p>
                        <p
                          className={[
                            "mt-1.5 font-sans text-[clamp(26px,3vw,34px)] font-bold tabular-nums tracking-tight",
                            forSale ? "text-ink-950" : status.text,
                          ].join(" ")}
                        >
                          {priceLabel}
                        </p>
                        {forSale && unit.pricePerM2 ? (
                          <p className="mt-1 text-[13.5px] tabular-nums text-ink-500">
                            {formatPln(unit.pricePerM2)}/m²
                          </p>
                        ) : null}
                        {!forSale ? (
                          <p className="mt-1.5 max-w-[34ch] text-[13.5px] leading-snug text-ink-500">
                            Pokażemy dostępne mieszkania o zbliżonym układzie
                            i metrażu.
                          </p>
                        ) : null}
                      </div>
                      {/* Przy zajętym lokalu status niesie już wielki napis
                          w miejscu ceny - plakietka obok byłaby trzecim
                          powtórzeniem tego samego słowa na jednym ekranie. */}
                      {forSale ? (
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ${status.chip}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {unit.statusLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <a
                        href="#kontakt"
                        className="inline-flex items-center gap-2.5 rounded-full bg-ink-900 px-7 py-3.5 text-[14px] font-medium text-white transition-colors duration-300 hover:bg-brand-500"
                      >
                        {forSale ? "Zapytaj o to mieszkanie" : "Zapytaj o podobne mieszkania"}
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                      {/* Twarz opiekuna w pigułce z numerem - widać, kto odbierze. */}
                      <a
                        href={`tel:${ZAMYSLOW_PHONE.tel}`}
                        title={`${agent.name}, ${agent.role} · ${ZAMYSLOW_PHONE.display}`}
                        className="inline-flex items-center gap-2.5 rounded-full border border-ink-950/15 py-3.5 pl-2.5 pr-6 text-[14px] font-medium text-ink-800 transition-colors hover:border-ink-950/40"
                      >
                        <AgentAvatar
                          photoUrl={agent.photoUrl}
                          name={agent.name}
                          size="sm"
                          className="!h-7 !w-7 ring-1 ring-ink-950/10"
                        />
                        {ZAMYSLOW_PHONE.display}
                      </a>
                    </div>

                    {/* Kuchnia jest opcją, nie częścią ceny - dlatego pod ceną
                        stoi tylko sygnał z kwotą i link do panelu niżej. */}
                    {kitchenPrice ? (
                      <a
                        href="#kuchnia"
                        className="group mt-6 inline-flex items-center gap-2.5 rounded-full border border-ink-950/12 bg-white/70 py-2 pl-4 pr-3.5 text-[13px] text-ink-600 transition-colors hover:border-brand-400 hover:text-ink-950"
                      >
                        <span>
                          Kuchnia z zabudową i AGD{" "}
                          <span className="font-medium tabular-nums text-ink-900">
                            +{kitchenPriceDigits(kitchenPrice)} zł
                          </span>{" "}
                          <span className="text-ink-400">jako opcja</span>
                        </span>
                        <svg
                          className="text-ink-400 transition-transform duration-300 group-hover:translate-y-0.5"
                          width="13"
                          height="13"
                          viewBox="0 0 14 14"
                          fill="none"
                          aria-hidden
                        >
                          <path d="M7 3v8M3.8 7.8 7 11l3.2-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    ) : null}

                    {cardPdf ? (
                      <a
                        href={cardPdf}
                        download={`karta-lokalu-${unit.id.toLowerCase()}.pdf`}
                        className="mt-5 flex w-fit items-center gap-2 text-[13.5px] font-medium text-ink-500 transition-colors hover:text-ink-950"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                          <path d="M7 2v7M3.8 6.2 7 9.4l3.2-3.2M2.5 12h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Pobierz kartę lokalu (PDF)
                      </a>
                    ) : null}
                  </div>
                </Reveal>
              </div>

              {/* Prawa kolumna: położenie na rzucie piętra */}
              <div className="lg:col-span-7">
                <Reveal delay={120}>
                  <UnitFloorPlanCard unitId={unit.id} />
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── Karta lokalu ─────────────────────────────────────────────── */}
        <section className="border-y border-ink-950/8 bg-paper py-16 md:py-24">
          <div className="container-xl">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow flex items-center gap-3">
                    <span className="inline-block h-px w-8 bg-brand-500" />
                    Karta lokalu
                  </p>
                  <h2 className="mt-6 font-display fluid-h2 text-ink-950">
                    Najważniejsze informacje.
                  </h2>
                  <p className="mt-4 max-w-[40ch] text-[15.5px] leading-relaxed text-ink-600">
                    Piętro, metraż, liczba pokoi i status sprzedaży - zebrane w
                    jednym miejscu.
                  </p>

                  {cardPdf ? (
                    <a
                      href={cardPdf}
                      download={`karta-lokalu-${unit.id.toLowerCase()}.pdf`}
                      className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-ink-900 px-6 py-3.5 text-[14px] font-medium text-white transition-colors duration-300 hover:bg-brand-500"
                    >
                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path d="M7 2v7M3.8 6.2 7 9.4l3.2-3.2M2.5 12h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Pobierz kartę lokalu (PDF)
                    </a>
                  ) : null}
                </Reveal>
              </div>

              <div className="lg:col-span-8">
                <Reveal delay={80}>
                  <dl className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/70 bg-white shadow-[var(--shadow-card)] md:grid-cols-3">
                    {facts.map((f) => (
                      <div
                        key={f.label}
                        className="border-b border-r border-ink-200/50 px-6 py-5 [&:nth-child(2n)]:border-r-0 md:[&:nth-child(2n)]:border-r md:[&:nth-child(3n)]:border-r-0"
                      >
                        <dt className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-400">
                          {f.label}
                        </dt>
                        <dd className="mt-1.5 text-[15.5px] font-medium tabular-nums text-ink-900">
                          {f.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── Rozkład pomieszczeń ──────────────────────────────────────── */}
        <section className="bg-paper-warm py-16 md:py-24">
          <div className="container-xl">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow flex items-center gap-3">
                    <span className="inline-block h-px w-8 bg-brand-500" />
                    Rozkład
                  </p>
                  <h2 className="mt-6 font-display fluid-h2 text-ink-950">
                    {unit.rooms} {roomsWord(unit.rooms)} na{" "}
                    {unit.areaLabel.replace(".", ",")}.
                  </h2>
                  {/* Gdy arkusz zna powierzchnię balkonu/tarasu, pokazuje ją kafelek
                      w rozkładzie - wtedy to zdanie tylko by ją powtarzało. */}
                  {unit.outdoor && !unit.outdoorArea ? (
                    <p className="mt-4 max-w-[40ch] text-[15.5px] leading-relaxed text-ink-600">
                      Do mieszkania przynależy {unit.outdoor.toLowerCase()}.
                    </p>
                  ) : null}
                  {unit.gardenAreaM2 ? (
                    <p className="mt-4 max-w-[40ch] text-[15.5px] leading-relaxed text-ink-600">
                      Do lokalu przynależy ogródek o powierzchni{" "}
                      {String(unit.gardenAreaM2).replace(".", ",")} m². Jego granice
                      zaznaczyliśmy na rzucie piętra.
                    </p>
                  ) : null}
                  {(unit.links.floorPlanPdf || unit.links.tour3d || unit.links.visualization) ? (
                    <div className="mt-8 flex flex-wrap gap-3">
                      {unit.links.floorPlanPdf ? (
                        <MaterialLink href={unit.links.floorPlanPdf} label="Rzut lokalu (PDF)" />
                      ) : null}
                      {unit.links.visualization ? (
                        <MaterialLink href={unit.links.visualization} label="Wizualizacja" />
                      ) : null}
                      {unit.links.tour3d ? (
                        <MaterialLink href={unit.links.tour3d} label="Spacer 3D" />
                      ) : null}
                    </div>
                  ) : null}
                </Reveal>
              </div>
              {/* Rzut mieszkania dostaje pełną szerokość kolumny - to główny
                  element, po którym kupujący ocenia układ. Metraże pomieszczeń
                  siadają pod nim w rzędzie kafelków. */}
              <div className="lg:col-span-8">
                <Reveal delay={80}>
                  <UnitPlanViewer
                    unitId={unit.id}
                    rooms={unit.roomsList}
                    totalLabel={unit.areaLabel}
                    outdoor={
                      unit.outdoor
                        ? { name: unit.outdoor, areaLabel: unit.outdoorArea }
                        : null
                    }
                  />
                </Reveal>
                <Reveal delay={140} className="mt-6">
                  <UnitLayout unit={unit} />
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── Kuchnia na wymiar (opcja dodatkowa) ──────────────────────────
            Siada zaraz pod rozkładem: kupujący dopiero co zobaczył salon
            z aneksem, więc to moment, w którym pytanie „a kuchnia?" pada samo. */}
        {kitchenPrice ? (
          <UnitKitchenOffer unitId={unit.id} price={kitchenPrice} agent={agent} />
        ) : null}

        {/* ── Galeria ──────────────────────────────────────────────────── */}
        <section className="border-t border-ink-950/8 bg-paper py-16 md:py-24">
          <div className="container-xl">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="eyebrow flex items-center gap-3">
                    <span className="inline-block h-px w-8 bg-brand-500" />
                    Galeria
                  </p>
                  <h2 className="mt-6 font-display fluid-h2 text-ink-950">
                    Standard wykończenia.
                  </h2>
                </div>
                <p className="max-w-[46ch] text-[13.5px] leading-relaxed text-ink-500">
                  Zdjęcia poglądowe wnętrz z ukończonego etapu inwestycji przy
                  Niedobczyckiej 128F.
                </p>
              </div>
            </Reveal>
            <Reveal delay={80} className="mt-10">
              <RentalsGallery images={GALLERY} />
            </Reveal>
          </div>
        </section>

        {/* ── Inne mieszkania na tym piętrze ───────────────────────────── */}
        {sameFloor.length > 0 ? (
          <section className="border-t border-ink-950/8 bg-paper py-16 md:py-20">
            <div className="container-xl">
              <Reveal>
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <h2 className="font-display text-[clamp(24px,2.6vw,32px)] text-ink-950">
                    Inne mieszkania · {unit.floorLabel.toLowerCase()}
                  </h2>
                  <Link
                    href="/zamyslow#lista-mieszkan"
                    className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-brand-600 transition-colors hover:text-brand-700"
                  >
                    Zobacz wszystkie ({all.length})
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={60} className="mt-8">
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {sameFloor.map((u) => (
                    <li key={u.id}>
                      <SiblingCard unit={u} />
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>
        ) : null}

        <UnitContact
          unitId={unit.id}
          areaLabel={unit.areaLabel}
          floorLabel={unit.floorLabel}
          availability={unit.availability}
          agent={agent}
        />
      </main>

      <UnitStickyBar
        unitId={unit.id}
        areaLabel={unit.areaLabel}
        rooms={unit.rooms}
        priceLabel={priceLabel}
        availability={unit.availability}
        agent={agent}
      />
      <ZamyslowFooter />
    </>
  );
}

/* ── Drobne komponenty ─────────────────────────────────────────────────── */

function PagerLink({
  unit,
  dir,
}: {
  unit: ZamyslowUnitListing | null;
  dir: "prev" | "next";
}) {
  const arrow =
    dir === "prev" ? (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  // Skrajne mieszkania (M1/M36) - nie pokazujemy wyłączonego przycisku.
  if (!unit) return null;
  return (
    <Link
      href={`/zamyslow/mieszkania/${unit.id.toLowerCase()}`}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink-950/15 bg-white/60 px-3.5 text-[13px] font-medium text-ink-700 transition-colors hover:border-ink-950/40 hover:text-ink-950"
    >
      {dir === "prev" ? arrow : null}
      <span className="tabular-nums">{unit.id}</span>
      {dir === "next" ? arrow : null}
    </Link>
  );
}

function SiblingCard({ unit }: { unit: ZamyslowUnitListing }) {
  const s = AVAILABILITY_STYLE[unit.availability];
  const taken = !isAvailable(unit.availability);
  return (
    <Link
      href={`/zamyslow/mieszkania/${unit.id.toLowerCase()}`}
      className={[
        "group flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-ink-200/70 px-5 py-4 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
        taken ? "bg-ink-50/60" : "bg-white",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2">
          <span className="font-sans text-[16px] font-bold tabular-nums tracking-tight text-ink-950">
            {unit.id}
          </span>
          {/* Przy zajętym lokalu status stoi słowem pod spodem - tooltip na
              kropce byłby powtórzeniem; dla dostępnego niesie go sama kropka. */}
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`}
            title={taken ? undefined : unit.statusLabel}
          />
        </p>
        <p className="mt-0.5 truncate text-[12.5px] tabular-nums text-ink-500">
          {unit.areaLabel.replace(".", ",")} · {unit.rooms} pok.
        </p>
        {taken ? (
          <p className={`mt-0.5 text-[11.5px] font-medium ${s.text}`}>
            {AVAILABILITY_LABEL[unit.availability]}
          </p>
        ) : null}
      </div>
      <svg
        className="shrink-0 text-ink-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand-600"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden
      >
        <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function MaterialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-ink-950/15 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-800 transition-colors hover:border-brand-500 hover:text-brand-700"
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M6 3H3v8h8V8M8 2h4v4M12 2 6.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </a>
  );
}
