"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const ITEMS: [string, string][] = [
  ["Wycena i strategia", "Oceniamy nieruchomość, ustalamy cenę i plan komunikacji."],
  ["Wideo i spacer 3D", "Nagrywamy krótki film i robimy wirtualny spacer. Kupujący zobaczą wszystko, zanim do Ciebie zadzwonią - do Twoich drzwi trafiają tylko poważni klienci."],
  ["Promocja, nie tylko publikacja", "Twoja oferta trafia na portale, do naszych kampanii reklamowych i do bazy zainteresowanych. Nie czekamy."],
  ["Finalizacja", "Prowadzimy formalną stronę transakcji. Kredyt, umowy, notariusz - jeśli chcesz, robimy to za Ciebie."],
];

export function SellWithFibra() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="sprzedaz" className="py-24 md:py-32 bg-paper-warm" ref={ref}>
      <div className="container-xl">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease }}
          >
            <p className="eyebrow flex items-center gap-3 mb-6">
              <span className="inline-block w-8 h-px bg-brand-500" />
              Sprzedaj z Fibrą
            </p>
            <h2 className="font-display fluid-display text-ink-950 max-w-[18ch] leading-[1.02]">
              Twoja nieruchomość zasługuje
              <br />
              <em className="italic text-brand-500">na więcej niż tylko ogłoszenie.</em>
            </h2>
            <p className="mt-8 text-[16px] md:text-[17px] leading-[1.65] text-ink-700 max-w-xl">
              Pomagamy przygotować ofertę, pokazać ją tak, żeby przykuła uwagę, i dotrzeć do kupujących, którzy właśnie
              tego szukają. Od wyceny i strategii, przez wideo i spacer 3D, po kontakt z kupującymi.
            </p>

            <div className="mt-10 rounded-[var(--radius-md)] border border-brand-500/25 bg-brand-500/[0.06] p-6 md:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600 mb-2">
                Wirtualny spacer 3D
              </p>
              <p className="text-[15px] text-ink-800 leading-relaxed">
                Standard u nas - nie dodatek za dopłatą. Kupujący mierzą ściany, widzą rzeczywisty układ i wracają do
                Ciebie już po świadomym „tak”.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 rounded-full bg-ink-900 hover:bg-brand-500 text-white px-7 py-4 text-[14px] font-medium transition-colors"
              >
                Porozmawiajmy o sprzedaży
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/jak-dzialamy"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-900 hover:text-brand-500 transition-colors"
              >
                Zobacz jak działamy
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
          >
            <div className="rounded-[var(--radius-lg)] bg-paper p-8 md:p-10 shadow-[var(--shadow-soft)]">
              <p className="eyebrow mb-6">Co robimy w praktyce</p>
              <ul className="space-y-5">
                {ITEMS.map(([t, d]) => (
                  <li key={t} className="flex items-start gap-4">
                    <span className="mt-1 inline-flex w-6 h-6 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 shrink-0 text-[12px] font-semibold">
                      ✓
                    </span>
                    <div>
                      <p className="text-[15px] font-medium text-ink-950">{t}</p>
                      <p className="text-[13.5px] text-ink-600 mt-0.5 leading-[1.55]">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
