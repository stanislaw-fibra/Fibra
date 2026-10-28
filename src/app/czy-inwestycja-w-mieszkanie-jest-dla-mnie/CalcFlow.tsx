"use client";

import { useEffect, useRef, useState } from "react";
import { CALC_STEPS } from "./content";

/**
 * Grafika „z czego składa się rachunek najmu": paski kurczą się z każdym kosztem.
 * Celowo bez kwot - liczby dla konkretnego mieszkania podaje specjalista, a kwota
 * na stronie byłaby czytana jak oferta. Paski rosną po kolei, gdy grafika wjedzie
 * na ekran; bez JS i przy ograniczonym ruchu są od razu pełne.
 */
export function CalcFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`calc-flow rounded-[var(--radius-lg)] bg-white p-6 sm:p-9 ${visible ? "is-visible" : ""}`}
    >
      <ol className="space-y-3">
        {CALC_STEPS.map((s, i) => (
          <li key={s.label} className="grid grid-cols-[1.75rem_1fr] items-center gap-3">
            <span
              aria-hidden
              className={`text-center text-[20px] font-medium leading-none ${s.sign === "+" ? "text-brand-600" : "text-ink-400"}`}
            >
              {s.sign}
            </span>
            <div className="relative h-11">
              <span
                aria-hidden
                className={`calc-bar absolute inset-y-0 left-0 rounded-[var(--radius-sm)] ${i === 0 ? "bg-brand-100" : "bg-ink-100"}`}
                style={{ width: `${s.width}%`, ["--bar-delay" as string]: `${i * 140}ms` }}
              />
              <span className="relative flex h-full items-center whitespace-nowrap px-4 text-[16px] text-ink-900">
                <span className="sr-only">{s.sign === "+" ? "Plus: " : "Minus: "}</span>
                {s.label}
              </span>
            </div>
          </li>
        ))}
        <li className="grid grid-cols-[1.75rem_1fr] items-center gap-3 pt-2">
          <span aria-hidden className="text-center text-[20px] font-medium leading-none text-accent-500">
            =
          </span>
          <div className="relative h-12">
            <span
              aria-hidden
              className="calc-bar absolute inset-y-0 left-0 rounded-[var(--radius-sm)] bg-accent-400"
              style={{ width: "68%", ["--bar-delay" as string]: `${CALC_STEPS.length * 140}ms` }}
            />
            <span className="relative flex h-full items-center whitespace-nowrap px-4 text-[16px] font-semibold text-ink-950">
              <span className="sr-only">Wynik: </span>
              Zostaje na czysto
            </span>
          </div>
        </li>
      </ol>
    </div>
  );
}
