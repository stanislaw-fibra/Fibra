"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const steps = [
  {
    label: "Cena zakupu",
    body: "Ustalamy kwotę wejścia dla konkretnego mieszkania, z miejscem postojowym włącznie.",
  },
  {
    label: "Czynsz najmu",
    body: "Szacujemy możliwy czynsz na podstawie tego, za ile wynajmują się podobne lokale w okolicy.",
  },
  {
    label: "Rentowność brutto",
    body: "Roczny czynsz dzielimy przez cenę zakupu. To punkt wyjścia do rozmowy o zwrocie netto po kosztach.",
  },
];

export function ReturnsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-paper py-24 md:py-32">
      <div className="container-xl">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-20">
          <div>
            <p className="eyebrow flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-brand-500" />
              Stopa zwrotu
            </p>
            <h2 className="mt-6 font-display fluid-h2 text-ink-950">
              Ile na tym{" "}
              <em className="italic text-brand-600">faktycznie zarobisz?</em>
            </h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease }}
              className="mt-10 rounded-[var(--radius-lg)] bg-ink-950 p-9 text-white"
            >
              <p className="eyebrow eyebrow-on-dark">Szacowana rentowność brutto</p>
              <p className="mt-3 font-display text-[44px] leading-none text-accent-400 md:text-[56px]">
                6,2 – 7,4%
              </p>
              <p className="mt-2 text-[15px] text-white/55">rocznie</p>
            </motion.div>

            <p className="mt-6 max-w-[44ch] text-[13.5px] leading-relaxed text-ink-500">
              To szacunek, nie obietnica zysku. Rentowność zależy od wybranego
              mieszkania, ceny zakupu i czynszu najmu w danym momencie. Pełne
              wyliczenie dla konkretnego lokalu, łącznie z kosztami, przejdziemy
              z Tobą podczas rozmowy.
            </p>
          </div>

          <div>
            <p className="text-[15px] leading-relaxed text-ink-600">
              Nie chcemy, żebyś brał tę liczbę na wiarę. Pokazujemy, z czego
              wynika, żebyś mógł ją sprawdzić samodzielnie:
            </p>
            <ol className="mt-8 space-y-px overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/70 bg-ink-200/70">
              {steps.map((s, i) => (
                <motion.li
                  key={s.label}
                  initial={{ opacity: 0, x: 16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.55, ease, delay: 0.15 + i * 0.1 }}
                  className="flex gap-5 bg-white p-7"
                >
                  <span className="font-display text-[20px] leading-none text-brand-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium text-ink-950">{s.label}</p>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">
                      {s.body}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
