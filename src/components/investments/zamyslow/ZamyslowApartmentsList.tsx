"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zamyslowData } from "@/lib/investments/zamyslow-data";
import {
  AVAILABILITY_LABEL,
  AVAILABILITY_STYLE,
  type UnitAvailability,
  type UnitStatusMap,
} from "@/lib/investments/zamyslow-status";

const formatArea = (v: number) => `${v.toFixed(2).replace(".", ",")} m²`;
const roomsWord = (n: number) => (n === 1 ? "pokój" : n >= 2 && n <= 4 ? "pokoje" : "pokoi");

type Row = {
  id: string;
  areaM2: number;
  rooms: number;
  /** null = arkusz nie odpowiedział; nie zgadujemy statusu. */
  availability: UnitAvailability | null;
  /** Cena tylko dla lokali w sprzedaży (serwer nie wysyła kwot zajętych). */
  priceLabel: string | null;
  floorLabel: string;
  floorIndex: number;
  href?: string;
};

// Płaska lista mieszkań ze wszystkich pięter + link do oferty tam, gdzie jest gotowa.
function buildRows(statuses: UnitStatusMap): Row[] {
  const rows: Row[] = [];
  zamyslowData.floors.forEach((floor, floorIndex) => {
    const planUnits = floor.floorPlan?.units ?? [];
    floor.units.forEach((u) => {
      const plan = planUnits.find((p) => p.id === u.id);
      const status = statuses[u.id] ?? null;
      rows.push({
        id: u.id,
        areaM2: u.areaM2,
        rooms: u.rooms,
        availability: status?.availability ?? null,
        priceLabel: status?.priceLabel ?? null,
        floorLabel: floor.label,
        floorIndex,
        href: plan?.href,
      });
    });
  });
  return rows;
}

type SortKey = "floor" | "area-asc" | "area-desc" | "rooms-asc" | "rooms-desc";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "floor", label: "Piętrami (od parteru)" },
  { value: "area-asc", label: "Metraż: rosnąco" },
  { value: "area-desc", label: "Metraż: malejąco" },
  { value: "rooms-asc", label: "Pokoje: rosnąco" },
  { value: "rooms-desc", label: "Pokoje: malejąco" },
];

const GRID =
  "grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.25fr)_auto]";

export function ZamyslowApartmentsList({ statuses }: { statuses: UnitStatusMap }) {
  const [sort, setSort] = useState<SortKey>("floor");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const allRows = useMemo(() => buildRows(statuses), [statuses]);

  // Filtr „Dostępne" ma sens tylko wtedy, gdy znamy statusy. Gdy arkusz nie
  // odpowiedział, chowamy go zamiast pokazywać „Dostępne 0".
  const hasStatuses = allRows.some((r) => r.availability !== null);

  const rows = useMemo(() => {
    const r =
      onlyAvailable && hasStatuses
        ? allRows.filter((x) => x.availability === "available")
        : [...allRows];
    switch (sort) {
      case "area-asc":
        r.sort((a, b) => a.areaM2 - b.areaM2);
        break;
      case "area-desc":
        r.sort((a, b) => b.areaM2 - a.areaM2);
        break;
      case "rooms-asc":
        r.sort((a, b) => a.rooms - b.rooms || a.areaM2 - b.areaM2);
        break;
      case "rooms-desc":
        r.sort((a, b) => b.rooms - a.rooms || b.areaM2 - a.areaM2);
        break;
      default:
        r.sort((a, b) => a.floorIndex - b.floorIndex);
    }
    return r;
  }, [allRows, sort, onlyAvailable, hasStatuses]);

  const availableCount = allRows.filter((r) => r.availability === "available").length;

  return (
    <section id="lista-mieszkan" className="scroll-mt-[80px] bg-paper-warm py-20 md:py-28">
      <div className="container-xl">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-brand-500" />
            Lista mieszkań
          </p>
          <h2 className="mt-6 font-display fluid-h2 text-ink-950">
            Wszystkie lokale w jednym miejscu.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-600">
            Wolisz przejrzeć listę zamiast klikać po rzucie? Posortuj mieszkania po
            metrażu, liczbie pokoi albo piętrze i przejdź prosto do oferty.
          </p>
        </div>

        {/* Pasek narzędzi: filtr + sortowanie */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {hasStatuses ? (
            <div className="inline-flex rounded-full border border-ink-200 bg-white p-1 text-[13px]">
              <button
                type="button"
                onClick={() => setOnlyAvailable(true)}
                className={[
                  "rounded-full px-4 py-2 font-medium transition-colors",
                  onlyAvailable ? "bg-ink-900 text-white" : "text-ink-600 hover:text-ink-900",
                ].join(" ")}
              >
                Dostępne
                <span className={onlyAvailable ? "ml-1.5 text-white/55" : "ml-1.5 text-ink-400"}>
                  {availableCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setOnlyAvailable(false)}
                className={[
                  "rounded-full px-4 py-2 font-medium transition-colors",
                  !onlyAvailable ? "bg-ink-900 text-white" : "text-ink-600 hover:text-ink-900",
                ].join(" ")}
              >
                Wszystkie
                <span className={!onlyAvailable ? "ml-1.5 text-white/55" : "ml-1.5 text-ink-400"}>
                  {allRows.length}
                </span>
              </button>
            </div>
          ) : (
            <span />
          )}

          <label className="flex items-center gap-2.5 text-[13px] text-ink-500">
            <span className="hidden sm:inline">Sortuj:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="cursor-pointer rounded-full border border-ink-200 bg-white px-4 py-2 text-[13.5px] font-medium text-ink-800 transition-colors hover:border-ink-300 focus:border-ink-400 focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Tabela / lista */}
        <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/80 bg-white shadow-[var(--shadow-card)]">
          {/* Nagłówek (desktop) */}
          <div
            className={`hidden ${GRID} gap-4 border-b border-ink-200/70 bg-paper-warm/60 px-5 py-3 text-[11px] uppercase tracking-[0.1em] text-ink-400 md:grid`}
          >
            <span>Mieszkanie</span>
            <span>Piętro</span>
            <span>Metraż</span>
            <span>Pokoje</span>
            <span>Cena</span>
            <span className="text-right">Oferta</span>
          </div>

          <ul className="divide-y divide-ink-200/70">
            {rows.map((r) => {
              const taken = r.availability === "reserved" || r.availability === "sold";
              const inner = (
                <>
                  {/* Mobile */}
                  <div className="flex items-center justify-between gap-3 md:hidden">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-sans text-[17px] font-bold tabular-nums tracking-tight text-ink-950">
                        {r.id}
                      </span>
                      <span className="text-[12.5px] text-ink-500">{r.floorLabel}</span>
                    </div>
                    <StatusPill availability={r.availability} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-3 md:hidden">
                    <span className="text-[14px] text-ink-600">
                      <span className="font-medium text-ink-900">{formatArea(r.areaM2)}</span>
                      <span className="text-ink-400"> · {r.rooms} {roomsWord(r.rooms)}</span>
                    </span>
                    {/* Status stoi już wyżej w wierszu - tu zostaje sama cena
                        (albo nic, gdy lokalu nie da się kupić). */}
                    {r.priceLabel ? (
                      <span className="text-[14px] font-semibold tabular-nums text-ink-950">
                        {r.priceLabel}
                      </span>
                    ) : !r.availability || r.availability === "available" ? (
                      <span className="text-[13px] text-ink-400">Cena na zapytanie</span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex justify-end md:hidden">
                    {r.href ? (
                      <span className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600">
                        {taken ? "Zobacz szczegóły" : "Zobacz ofertę"}
                        <Arrow />
                      </span>
                    ) : (
                      <span className="text-[12px] text-ink-400">Rzut wkrótce</span>
                    )}
                  </div>

                  {/* Desktop */}
                  <div className={`hidden ${GRID} items-center gap-4 md:grid`}>
                    <span className="font-sans text-[16px] font-bold tabular-nums tracking-tight text-ink-950">
                      {r.id}
                    </span>
                    <span className="text-[14px] text-ink-600">{r.floorLabel}</span>
                    <span className="text-[14px] font-medium tabular-nums text-ink-900">
                      {formatArea(r.areaM2)}
                    </span>
                    <span className="text-[14px] text-ink-600">
                      {r.rooms} {roomsWord(r.rooms)}
                    </span>
                    <PriceCell priceLabel={r.priceLabel} availability={r.availability} />
                    <span className="text-right text-[13px] font-medium">
                      {r.href ? (
                        <span className="inline-flex items-center gap-1 text-brand-600">
                          Zobacz
                          <Arrow />
                        </span>
                      ) : (
                        <span className="text-ink-400">Wkrótce</span>
                      )}
                    </span>
                  </div>
                </>
              );

              return (
                <li key={`${r.floorIndex}-${r.id}`}>
                  {r.href ? (
                    <Link
                      href={r.href}
                      className={[
                        "block px-5 py-4 transition-colors hover:bg-paper-warm/50",
                        taken ? "bg-ink-50/40" : "",
                      ].join(" ")}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="px-5 py-4">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Kolumna „Cena": kwota dla lokali w sprzedaży, a dla zajętych - plakietka
 * statusu DOKŁADNIE w miejscu ceny. Kwoty zajętych lokali w ogóle nie
 * przychodzą z serwera, więc nie ma czego ukrywać w HTML-u.
 */
function PriceCell({
  priceLabel,
  availability,
}: {
  priceLabel: string | null;
  availability: UnitAvailability | null;
}) {
  if (priceLabel) {
    return (
      <span className="text-[14px] font-semibold tabular-nums text-ink-950">{priceLabel}</span>
    );
  }
  if (availability && availability !== "available") {
    return <StatusPill availability={availability} />;
  }
  return <span className="text-[13.5px] text-ink-400">Cena na zapytanie</span>;
}

function StatusPill({ availability }: { availability: UnitAvailability | null }) {
  // Brak statusu = arkusz nie odpowiedział. Wtedy nic nie pokazujemy, tak samo
  // jak rzut nie kreskuje wtedy żadnej strefy - nie zgadujemy.
  if (!availability) return null;
  const style = AVAILABILITY_STYLE[availability];
  return (
    <span
      className={[
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
        style.chip,
      ].join(" ")}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {AVAILABILITY_LABEL[availability]}
    </span>
  );
}
