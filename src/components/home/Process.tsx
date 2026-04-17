"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const CARDS = [
  {
    num: "01",
    title: "Wideo zamiast zdjęć",
    body: "Każda oferta ma krótki pionowy film - tak jak oglądasz treści na co dzień. Widzisz układ, przestrzeń, światło. Nie interpretację fotografa.",
  },
  {
    num: "02",
    title: "Wirtualny spacer 3D w standardzie",
    body: "Przejdź przez każde pomieszczenie jeszcze przed wyjazdem. Zmierz ściany do centymetra. Sprawdź, czy sofa zmieści się w salonie. To nie opcja premium - to nasz standard.",
  },
  {
    num: "03",
    title: "Jeden opiekun. Od oglądania do aktu.",
    body: "Bez przekazywania między działami. Jeden człowiek zna Twoją sytuację, zna ofertę i prowadzi cały proces. Od rozmowy do notariusza.",
  },
];

export function Process() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 md:py-32 bg-paper" ref={ref}>
      <div className="container-xl">
        <div className="grid md:grid-cols-12 gap-8 items-end mb-16">
          <motion.div
            className="md:col-span-10 lg:col-span-8"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease }}
          >
            <p className="eyebrow flex items-center gap-3 mb-6">
              <span className="inline-block w-8 h-px bg-brand-500" />
              Dlaczego Fibra
            </p>
            <h2 className="font-display fluid-display text-ink-950 max-w-[22ch]">
              Czego nie znajdziesz w <em className="italic text-brand-500">standardowym</em> ogłoszeniu.
            </h2>
          </motion.div>
        </div>

        <ol className="grid md:grid-cols-3 gap-px bg-ink-200 overflow-hidden rounded-[var(--radius-md)]">
          {CARDS.map((s, i) => (
            <motion.li
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease, delay: 0.12 + i * 0.1 }}
            >
              <div className="relative p-8 md:p-10 min-h-[300px] md:min-h-[340px] flex flex-col justify-between group bg-paper hover:bg-ink-950 transition-colors duration-500">
                <div className="flex items-center justify-between">
                  <p className="font-display text-[42px] leading-none text-brand-500 group-hover:text-accent-400 transition-colors duration-500">
                    {s.num}
                  </p>
                  <span
                    className="w-7 h-7 rounded-full border border-ink-200 group-hover:border-white/30 transition-colors duration-500"
                    aria-hidden
                  />
                </div>
                <div>
                  <h3 className="font-display text-[22px] md:text-[24px] leading-[1.12] text-ink-950 group-hover:text-white transition-colors duration-500">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.65] text-ink-600 group-hover:text-white/75 transition-colors duration-500">
                    {s.body}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
