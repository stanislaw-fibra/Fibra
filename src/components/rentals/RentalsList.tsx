"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { RentalUnit } from "@/lib/rentals/zamyslow-rentals";

type StatusFilter = "all" | "available" | "reserved";
type SortKey = "default" | "area-asc" | "area-desc" | "rent-asc" | "rent-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Kolejność (piętrami)" },
  { value: "area-asc", label: "Metraż: rosnąco" },
  { value: "area-desc", label: "Metraż: malejąco" },
  { value: "rent-asc", label: "Odstępne: rosnąco" },
  { value: "rent-desc", label: "Odstępne: malejąco" },
];

const ease = [0.22, 1, 0.36, 1] as const;

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

export function RentalsList({ units }: { units: RentalUnit[] }) {
  const [status, setStatus] = useState<StatusFilter>("available");
  const [sort, setSort] = useState<SortKey>("default");

  const counts = useMemo(
    () => ({
      all: units.length,
      available: units.filter((u) => u.status === "available").length,
      reserved: units.filter((u) => u.status === "reserved").length,
    }),
    [units],
  );

  const visible = useMemo(() => {
    const filtered =
      status === "all" ? units : units.filter((u) => u.status === status);
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
          <FilterTab label={`Dostępne`} count={counts.available} active={status === "available"} onClick={() => setStatus("available")} />
          <FilterTab label="Wszystkie" count={counts.all} active={status === "all"} onClick={() => setStatus("all")} />
          <FilterTab label="Zarezerwowane" count={counts.reserved} active={status === "reserved"} onClick={() => setStatus("reserved")} />
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
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((u, i) => (
            <UnitCard key={u.unit} unit={u} index={i} />
          ))}
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

function UnitCard({ unit: u, index }: { unit: RentalUnit; index: number }) {
  const reserved = u.status === "reserved";
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease, delay: Math.min(index * 0.04, 0.3) }}
      className={[
        "group relative flex flex-col rounded-[var(--radius-lg)] border bg-white p-6 transition-shadow",
        reserved
          ? "border-ink-200/70 opacity-70"
          : "border-ink-200/80 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-ink-500">{u.floor || "Lokal"}</p>
          <p className="mt-1 font-display text-[26px] leading-none text-ink-900">{u.unit}</p>
        </div>
        <StatusPill reserved={reserved} label={reserved ? "Zarezerwowane" : "Dostępne"} />
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="font-display text-[34px] leading-none text-ink-900">{u.area}</span>
        <span className="pb-1 text-[14px] text-ink-500">
          m² · {u.rooms ? `${u.rooms} pok.` : "—"}
        </span>
      </div>

      <div className="mt-5 rounded-[var(--radius-md)] bg-paper-warm px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] uppercase tracking-[0.12em] text-ink-500">Odstępne</span>
          <span className="font-display text-[22px] text-brand-600">
            {prettyMoney(u.rent) || "—"}
            {u.rent ? <span className="ml-1 text-[13px] text-ink-400">/ mies.</span> : null}
          </span>
        </div>
        {u.deposit ? (
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-[12px] uppercase tracking-[0.12em] text-ink-400">Kaucja</span>
            <span className="text-[14px] text-ink-600">{prettyMoney(u.deposit)}</span>
          </div>
        ) : null}
      </div>

      <dl className="mt-5 space-y-2.5 text-[13.5px]">
        {u.gardenBalcony ? <DetailRow icon="balcony" label={u.gardenBalcony} /> : null}
        {u.parking ? <DetailRow icon="parking" label={u.parking} /> : null}
      </dl>

      {u.notes ? (
        <p className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5 text-[12px] font-medium text-accent-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1L12 16.8 5.7 21l2.3-7.1-6-4.5h7.6L12 2z" fill="currentColor" />
          </svg>
          {u.notes}
        </p>
      ) : null}
    </motion.article>
  );
}

function StatusPill({ reserved, label }: { reserved: boolean; label: string }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        reserved ? "bg-ink-100 text-ink-500" : "bg-brand-50 text-brand-600",
      ].join(" ")}
    >
      <span className={["h-1.5 w-1.5 rounded-full", reserved ? "bg-ink-400" : "bg-brand-500"].join(" ")} />
      {label}
    </span>
  );
}

function DetailRow({ icon, label }: { icon: "parking" | "balcony"; label: string }) {
  return (
    <div className="flex items-start gap-2.5 text-ink-600">
      <span className="mt-0.5 text-ink-400">
        {icon === "parking" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 17V7h3.5a3 3 0 0 1 0 6H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="leading-snug">{label}</span>
    </div>
  );
}
