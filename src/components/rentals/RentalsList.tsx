"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RentalUnit } from "@/lib/rentals/zamyslow-rentals";

type StatusFilter = "all" | "available" | "unavailable";
type SortKey = "default" | "area-asc" | "area-desc" | "rent-asc" | "rent-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Kolejność (piętrami)" },
  { value: "area-asc", label: "Metraż: rosnąco" },
  { value: "area-desc", label: "Metraż: malejąco" },
  { value: "rent-asc", label: "Odstępne: rosnąco" },
  { value: "rent-desc", label: "Odstępne: malejąco" },
];

// Wspólny szablon kolumn dla nagłówka i wierszy (desktop).
const COLS =
  "md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_minmax(0,auto)]";

/** „2 600,00 zł" -> „2 600 zł" (urywa nadmiarowe grosze przy pełnych kwotach). */
function prettyMoney(s: string): string {
  if (!s) return "";
  return s.replace(/,00\s*zł/i, " zł").replace(/\s+/g, " ").trim();
}

/** Liczba z kwoty odstępnego do sortowania. */
function rentToNumber(s: string): number {
  const n = parseFloat(s.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

type StatusTone = "available" | "soon" | "muted";

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function statusMeta(u: RentalUnit): { label: string; tone: StatusTone } {
  if (u.status === "reserved") return { label: "Zarezerwowane", tone: "muted" };
  if (u.status === "rented") return { label: "Wynajęte", tone: "muted" };
  if (u.availableNote) return { label: capitalize(u.availableNote), tone: "soon" };
  return { label: "Dostępne", tone: "available" };
}

export function RentalsList({ units }: { units: RentalUnit[] }) {
  const [status, setStatus] = useState<StatusFilter>("available");
  const [sort, setSort] = useState<SortKey>("default");

  const counts = useMemo(
    () => ({
      all: units.length,
      available: units.filter((u) => u.status === "available").length,
      unavailable: units.filter((u) => u.status !== "available").length,
    }),
    [units],
  );

  const visible = useMemo(() => {
    const filtered =
      status === "all"
        ? units
        : status === "available"
          ? units.filter((u) => u.status === "available")
          : units.filter((u) => u.status !== "available");
    const arr = [...filtered];
    switch (sort) {
      case "area-asc":
        arr.sort((a, b) => a.areaNum - b.areaNum);
        break;
      case "area-desc":
        arr.sort((a, b) => b.areaNum - a.areaNum);
        break;
      case "rent-asc":
        arr.sort((a, b) => rentToNumber(a.rent) - rentToNumber(b.rent));
        break;
      case "rent-desc":
        arr.sort((a, b) => rentToNumber(b.rent) - rentToNumber(a.rent));
        break;
      default:
        break;
    }
    return arr;
  }, [units, status, sort]);

  return (
    <div>
      {/* Pasek narzędzi: filtr statusu + sortowanie */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-ink-200 bg-white p-1 text-[13px]">
          <FilterTab label="Dostępne" count={counts.available} active={status === "available"} onClick={() => setStatus("available")} />
          <FilterTab label="Wszystkie" count={counts.all} active={status === "all"} onClick={() => setStatus("all")} />
          <FilterTab label="Niedostępne" count={counts.unavailable} active={status === "unavailable"} onClick={() => setStatus("unavailable")} />
        </div>

        <div className="flex items-center gap-2 text-[13px] text-ink-500">
          <span className="hidden sm:inline">Sortuj:</span>
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-12 text-center text-[15px] text-ink-500">
          Brak lokali w tym widoku. Wybierz „Wszystkie", żeby zobaczyć cały budynek.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/80 bg-white shadow-[var(--shadow-card)]">
          {/* Nagłówek tabeli (desktop) */}
          <div className={`hidden gap-4 border-b border-ink-200/70 bg-paper-warm/60 px-5 py-3 text-[11px] uppercase tracking-[0.1em] text-ink-400 md:grid ${COLS}`}>
            <span>Lokal</span>
            <span>Powierzchnia</span>
            <span>Odstępne</span>
            <span>Kaucja</span>
            <span>Garaż / ogród</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-ink-200/70">
            {visible.map((u) => (
              <UnitRow key={u.unit} unit={u} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 font-medium transition-colors",
        active ? "bg-ink-900 text-white" : "text-ink-600 hover:text-ink-900",
      ].join(" ")}
    >
      {label}
      <span className={active ? "ml-1.5 text-white/55" : "ml-1.5 text-ink-400"}>{count}</span>
    </button>
  );
}

function UnitRow({ unit: u }: { unit: RentalUnit }) {
  const taken = u.status !== "available";
  const s = statusMeta(u);
  const [open, setOpen] = useState(false);

  const hasDetails = Boolean(u.deposit || u.parking || u.gardenBalcony || u.notes);

  return (
    <div className={taken ? "opacity-70" : "transition-colors md:hover:bg-paper-warm/40"}>
      {/* ── Mobile: esencja + szczegóły po tapnięciu ────────────── */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => hasDetails && setOpen((v) => !v)}
          aria-expanded={hasDetails ? open : undefined}
          className="flex w-full flex-col gap-2 px-5 py-4 text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[19px] leading-none text-ink-900">{u.unit}</span>
              <span className="text-[12px] text-ink-500">{u.floor}</span>
            </div>
            <StatusPill label={s.label} tone={s.tone} />
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[14px] text-ink-600">
              <span className="font-medium text-ink-900">{u.area} m²</span>
              {u.rooms ? <span className="text-ink-400"> · {u.rooms} pok.</span> : null}
            </span>
            <span className="flex items-baseline gap-2">
              {u.rent ? (
                <span className="text-[15px] font-semibold text-brand-600">
                  {prettyMoney(u.rent)}
                  <span className="text-[12px] font-normal text-ink-400"> /mies.</span>
                </span>
              ) : null}
              {hasDetails ? (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 10 10"
                  fill="none"
                  className={`text-ink-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  <path d="M2.5 3.5L5 6l2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </span>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2.5 px-5 pb-4 pt-1">
                {u.deposit ? (
                  <DetailLine icon={ICON.wallet}>Kaucja {prettyMoney(u.deposit)}</DetailLine>
                ) : null}
                {u.parking ? <DetailLine icon={ICON.parking}>{u.parking}</DetailLine> : null}
                {u.gardenBalcony ? <DetailLine icon={ICON.home}>{u.gardenBalcony}</DetailLine> : null}
                {u.notes ? (
                  <DetailLine icon={ICON.star} accent>
                    {u.notes}
                  </DetailLine>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── Desktop: wiersz tabeli ──────────────────────────────── */}
      <div className={`hidden py-4 md:grid md:items-center md:gap-4 md:px-5 ${COLS}`}>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[20px] leading-none text-ink-900">{u.unit}</span>
            <span className="text-[12.5px] text-ink-500">{u.floor}</span>
          </div>
          {u.notes ? (
            <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-medium text-accent-600">
              {u.notes}
            </span>
          ) : null}
        </div>

        <div>
          <span className="text-[15px] font-medium text-ink-900">{u.area} m²</span>
          {u.rooms ? <span className="block text-[12.5px] text-ink-500">{u.rooms} pok.</span> : null}
        </div>

        <div>
          {u.rent ? (
            <span className="text-[15px] font-semibold text-brand-600">
              {prettyMoney(u.rent)}
              <span className="font-normal text-ink-400"> /mies.</span>
            </span>
          ) : (
            <span className="text-[14px] text-ink-400">—</span>
          )}
        </div>

        <div>
          <span className="text-[14px] text-ink-700">{u.deposit ? prettyMoney(u.deposit) : "—"}</span>
        </div>

        <div>
          {u.parking ? <span className="block text-[13px] leading-snug text-ink-700">{u.parking}</span> : null}
          {u.gardenBalcony ? <span className="block text-[12.5px] leading-snug text-ink-500">{u.gardenBalcony}</span> : null}
        </div>

        <div>
          <StatusPill label={s.label} tone={s.tone} />
        </div>
      </div>
    </div>
  );
}

const ICON = {
  wallet: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 1-2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 8v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="16.5" cy="13" r="1.2" fill="currentColor" />
    </svg>
  ),
  parking: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 17V7h3.5a3 3 0 0 1 0 6H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  home: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1L12 16.8 5.7 21l2.3-7.1-6-4.5h7.6L12 2z" />
    </svg>
  ),
} as const;

function DetailLine({ icon, accent, children }: { icon: ReactNode; accent?: boolean; children: ReactNode }) {
  return (
    <div className={`flex items-center gap-2.5 text-[13px] leading-snug ${accent ? "text-accent-600" : "text-ink-600"}`}>
      <span className={accent ? "shrink-0 text-accent-500" : "shrink-0 text-ink-400"}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const styles: Record<StatusTone, { box: string; dot: string }> = {
    available: { box: "bg-brand-50 text-brand-600", dot: "bg-brand-500" },
    soon: { box: "bg-accent-50 text-accent-600", dot: "bg-accent-400" },
    muted: { box: "bg-ink-100 text-ink-500", dot: "bg-ink-400" },
  };
  const st = styles[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${st.box}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
      {label}
    </span>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-[13px] font-medium text-ink-800 transition-colors",
          open ? "border-ink-400" : "border-ink-200 hover:border-ink-300",
        ].join(" ")}
      >
        <span className="whitespace-nowrap">{current.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M2.5 3.5L5 6l2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-2 min-w-[230px] overflow-hidden rounded-[var(--radius-md)] border border-ink-200/80 bg-white p-1 shadow-[var(--shadow-soft)] ring-1 ring-ink-900/5"
        >
          {SORT_OPTIONS.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={[
                  "flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-[13.5px] transition-colors",
                  active ? "bg-ink-950 text-white" : "text-ink-700 hover:bg-paper-warm",
                ].join(" ")}
              >
                {o.label}
                {active ? (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
