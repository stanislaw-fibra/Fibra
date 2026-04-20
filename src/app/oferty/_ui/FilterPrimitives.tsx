"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type PopoverProps = {
  label: ReactNode;
  activeCount?: number;
  isActive?: boolean;
  icon?: ReactNode;
  children: (close: () => void) => ReactNode;
  /** Desktop: po której stronie względem trigger-a otwiera się panel. */
  align?: "start" | "end";
  /** Desktop: minimalna szerokość panelu (Tailwind). */
  width?: string;
  /** Tytuł wyświetlany w nagłówku bottom-sheet na mobile. Fallback: `label`. */
  mobileTitle?: string;
};

const MOBILE_BREAKPOINT = 640; // <= inline bottom-sheet przez portal

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

/**
 * Popover zbudowany pod Fibra-UI:
 *
 * - **Desktop (≥640 px)**: zwykły dropdown pod buttonem, align start/end,
 *   absolutne pozycjonowanie, z-50.
 * - **Mobile (<640 px)**: bottom-sheet renderowany przez portal do `body`
 *   z własnym backdropem (z-[70]/z-[71]). Dzięki portalowi panel NIE jest
 *   uwięziony w żadnym stacking contextcie strony (sticky bar, kontenery z
 *   transform/filter/etc.) — jest zawsze on top, nawet nad odtwarzanym wideo.
 *   Dodatkowo na mobile blokujemy scroll body, żeby gesty działały tylko
 *   na liście opcji.
 */
export function FilterPopover({
  label,
  activeCount,
  isActive,
  icon,
  children,
  align = "start",
  width = "min-w-[280px]",
  mobileTitle,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
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

  // Lock scroll body tylko dla bottom-sheeta na mobile.
  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  const close = () => setOpen(false);

  const headerTitle =
    typeof mobileTitle === "string"
      ? mobileTitle
      : typeof label === "string"
        ? label
        : "Filtr";

  const sheet =
    open && isMobile && mounted ? (
      <div
        className="fixed inset-0 z-[70] flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
      >
        <button
          type="button"
          aria-label="Zamknij"
          onClick={close}
          className="absolute inset-0 bg-ink-950/55 backdrop-blur-[2px] animate-[sheetFade_.22s_ease-out] cursor-default"
        />
        <div
          ref={panelRef}
          className="relative z-[71] mx-auto w-full max-w-[520px] rounded-t-[var(--radius-lg)] bg-paper shadow-[0_-24px_60px_-20px_rgba(11,15,20,0.45)] ring-1 ring-ink-900/5 animate-[sheetUp_.28s_cubic-bezier(0.22,1,0.36,1)] max-h-[78dvh] flex flex-col pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <style>{`
            @keyframes sheetFade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes sheetUp { from { transform: translateY(100%); opacity: 0.7 } to { transform: translateY(0); opacity: 1 } }
          `}</style>
          <div className="flex flex-col pt-2.5 pb-2">
            <span className="mx-auto h-1 w-10 rounded-full bg-ink-300/80" aria-hidden />
            <div className="mt-2.5 flex items-center justify-between gap-3 px-5">
              <h3 id={`${id}-title`} className="font-medium text-ink-950 text-[15px]">
                {headerTitle}
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label="Zamknij"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className="h-px bg-ink-200/80" />
          <div className="flex-1 overflow-y-auto px-2 pt-2 pb-3">{children(close)}</div>
        </div>
      </div>
    ) : null;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className={[
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-medium",
          "cursor-pointer select-none transition-[background-color,border-color,color,transform,box-shadow] duration-150",
          "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
          isActive
            ? "border-ink-900 bg-ink-900 text-white hover:bg-ink-800 shadow-[0_4px_14px_-6px_rgba(11,15,20,0.35)]"
            : open
              ? "border-ink-400 bg-paper text-ink-950 shadow-[0_2px_8px_-4px_rgba(11,15,20,0.15)]"
              : "border-ink-200 bg-paper text-ink-700 hover:border-ink-400 hover:text-ink-950 hover:shadow-[0_2px_8px_-4px_rgba(11,15,20,0.12)]",
        ].join(" ")}
      >
        {icon}
        <span className="whitespace-nowrap">{label}</span>
        {typeof activeCount === "number" && activeCount > 0 && (
          <span
            className={[
              "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
              isActive ? "bg-white/25 text-white" : "bg-brand-500 text-white",
            ].join(" ")}
          >
            {activeCount}
          </span>
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""} opacity-60`}
          aria-hidden
        >
          <path
            d="M2.5 3.5L5 6l2.5-2.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Desktop dropdown (inline, absolute). Nie renderujemy gdy jesteśmy na mobile
          — tam obsługuje to bottom-sheet przez portal. */}
      {open && !isMobile && (
        <div
          ref={panelRef}
          id={id}
          role="dialog"
          className={[
            "absolute z-50 mt-2 rounded-[var(--radius-md)] border border-ink-200/80 bg-paper",
            "shadow-[0_24px_60px_-20px_rgba(11,15,20,0.3)] ring-1 ring-ink-900/5",
            "animate-[fadeUp_.18s_ease-out]",
            align === "end" ? "right-0" : "left-0",
            width,
          ].join(" ")}
        >
          <style>{`@keyframes fadeUp { from { opacity:0; transform: translateY(-4px) } to { opacity:1; transform: translateY(0) } }`}</style>
          {children(close)}
        </div>
      )}

      {sheet && mounted ? createPortal(sheet, document.body) : null}
    </div>
  );
}

/** Wiersz z checkboxem-pill. */
export function PopoverToggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "w-full flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left",
        "cursor-pointer transition-colors duration-150 active:scale-[0.99]",
        checked ? "bg-ink-950 text-white" : "hover:bg-paper-warm text-ink-800",
      ].join(" ")}
    >
      <span className="flex flex-col min-w-0">
        <span className="text-[13.5px] font-medium line-clamp-1">{label}</span>
        {hint && <span className={`text-[11px] ${checked ? "text-white/60" : "text-ink-500"}`}>{hint}</span>}
      </span>
      <span
        className={[
          "h-4 w-4 flex-none rounded-[4px] border flex items-center justify-center transition-colors",
          checked ? "bg-white border-white text-ink-950" : "border-ink-300 bg-paper",
        ].join(" ")}
        aria-hidden
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5.5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

/** Para pól od-do. */
export function RangeInputs({
  min,
  max,
  onMin,
  onMax,
  unit,
  step = 1,
  placeholderMin,
  placeholderMax,
}: {
  min?: number;
  max?: number;
  onMin: (v?: number) => void;
  onMax: (v?: number) => void;
  unit: string;
  step?: number;
  placeholderMin?: string;
  placeholderMax?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="relative">
        <input
          type="number"
          inputMode="numeric"
          step={step}
          value={min ?? ""}
          onChange={(e) => onMin(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder={placeholderMin ?? "od"}
          className="w-full rounded-[var(--radius-sm)] border border-ink-200 bg-paper px-3 py-2.5 text-[13.5px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-500">
          {unit}
        </span>
      </label>
      <label className="relative">
        <input
          type="number"
          inputMode="numeric"
          step={step}
          value={max ?? ""}
          onChange={(e) => onMax(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder={placeholderMax ?? "do"}
          className="w-full rounded-[var(--radius-sm)] border border-ink-200 bg-paper px-3 py-2.5 text-[13.5px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-500">
          {unit}
        </span>
      </label>
    </div>
  );
}

/** Tab-bar dla wyboru pojedynczej wartości. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid grid-cols-3 rounded-full bg-ink-100 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              "rounded-full px-3 py-1.5 text-[12px] font-medium",
              "cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.96]",
              active ? "bg-ink-950 text-white shadow-sm" : "text-ink-700 hover:text-ink-950",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
