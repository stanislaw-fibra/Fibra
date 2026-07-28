"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const steps = [
  {
    label: "Cena zakupu",
    body: "Wyliczenia opieramy na rzeczywistej cenie zakupu konkretnego mieszkania wraz z miejscem postojowym.",
  },
  {
    label: "Czynsz najmu",
    body: "Szacowaną wysokość czynszu opieramy na aktualnych stawkach najmu podobnych mieszkań oraz naszym doświadczeniu z wynajmu mieszkań na Osiedlu Zamysłów.",
  },
  {
    label: "Rentowność brutto",
    body: "Na podstawie ceny zakupu i szacowanego czynszu obliczamy rentowność brutto. Podczas rozmowy przedstawiamy również przewidywany zwrot po uwzględnieniu wszystkich kosztów.",
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
                5,7 – 6,9%
              </p>
              <p className="mt-2 text-[15px] text-white/55">rocznie</p>
            </motion.div>

            <p className="mt-6 max-w-[44ch] text-[13.5px] leading-relaxed text-ink-500">
              Podana rentowność to szacunek, a nie gwarancja zysku. Zależy od
              wybranego mieszkania, ceny zakupu i wysokości czynszu. Dla każdego
              lokalu przygotowujemy indywidualne wyliczenie, uwzględniające
              wszystkie koszty.
            </p>
          </div>

          <div>
            <p className="text-[15px] leading-relaxed text-ink-600">
              Szacowaną rentowność wyliczamy na podstawie konkretnych danych.
              Pokazujemy, skąd się bierze, abyś mógł sam ocenić, czy taka
              inwestycja ma dla Ciebie sens.
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

            {/* Bezpieczeństwo inwestycji - inwestor częściej boi się straty niż
                tego, czy zarobi 6 czy 7%. Fakty prawne pochodzą z /przewodnik-inwestora. */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease, delay: 0.45 }}
              className="mt-8 rounded-[var(--radius-lg)] border border-brand-500/20 bg-brand-500/[0.04] p-7"
            >
              <p className="font-medium text-ink-950">
                Najwyższa stopa zwrotu to nie wszystko
              </p>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-600">
                Pomagamy wybrać mieszkanie z myślą o stabilnym wynajmie
                i długoterminowym bezpieczeństwie inwestycji, a nie tylko
                o najwyższej rentowności na papierze. Zakup chroni umowa
                deweloperska i rachunek powierniczy, z którego środki trafiają
                do nas dopiero po odebranym etapie budowy.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
