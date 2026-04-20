"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

type PopoverProps = {
  label: ReactNode;
  activeCount?: number;
  isActive?: boolean;
  icon?: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  width?: string;
};

/**
 * Lekki Popover przycisk-trigger + overlay z panelem. Bez Radixa — chcemy w 100%
 * kontrolować look & feel. Klikniecie poza panelem, Escape i blur zamykają.
 */
export function FilterPopover({
  label,
  activeCount,
  isActive,
  icon,
  children,
  align = "start",
  width = "min-w-[280px]",
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();

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

  const close = () => setOpen(false);

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

      {open && (
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
