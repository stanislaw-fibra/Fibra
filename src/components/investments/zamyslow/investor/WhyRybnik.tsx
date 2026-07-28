"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

// Format obiekcja -> odpowiedź. Każda odpowiedź ma być prawdziwa i sprawdzalna.
// Jeśli masz lokalne dane (liczba mieszkańców Rybnika, najwięksi pracodawcy,
// pustostany), wpisz je w treść - konkret rozwiewa obawę mocniej niż ogólnik.
const objections = [
  {
    objection: "„Przecież w Rybniku nie ma uczelni.”",
    answer:
      "Brak dużej uczelni nie oznacza braku najemców. W Rybniku mieszkania wynajmują przede wszystkim osoby pracujące - single, pary, młode rodziny. To najemcy, którzy szukają mieszkania na rok lub dłużej, dzięki czemu najem jest bardziej stabilny.",
  },
  {
    objection: "„Czy w ogóle będzie komu wynajmować?”",
    answer:
      "Tak. Potwierdza to nasze doświadczenie. Na naszym osiedlu na bieżąco wynajmujemy mieszkania i widzimy, że dobrze wykończone lokale z miejscem postojowym znajdują najemców. Popyt nie jest dla nas teorią - obserwujemy go na co dzień.",
  },
  {
    objection: "„Najemcy ciągle się zmieniają, to same kłopoty.”",
    answer:
      "W Rybniku najemcy często zostają na dłużej niż w typowych miastach studenckich. To oznacza mniejszą rotację, mniej okresów bez najemcy i rzadszą potrzebę przygotowywania mieszkania do kolejnego wynajmu.",
  },
  {
    objection: "„Czy to się w ogóle opłaca w mniejszym mieście?”",
    answer:
      "Nie każda dobra inwestycja musi być w dużym mieście. W Rybniku mieszkania kosztują mniej niż w największych aglomeracjach, a dobrze przygotowane lokale nadal cieszą się zainteresowaniem najemców. To przekłada się na atrakcyjną rentowność inwestycji.",
  },
];

export function WhyRybnik() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-ink-950 py-24 text-white md:py-32">
      <div className="container-xl">
        <div className="max-w-[54ch]">
          <p className="eyebrow eyebrow-on-dark flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-accent-400" />
            Dlaczego Rybnik?
          </p>
          <h2 className="mt-6 font-display fluid-h2 text-white">
            Masz pytania?{" "}
            <em className="italic text-accent-400">To dobrze.</em>
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-white/65">
            Zakup mieszkania inwestycyjnego warto dobrze przemyśleć.
            Odpowiadamy na pytania, które słyszymy od inwestorów najczęściej.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {objections.map((o, i) => (
            <motion.div
              key={o.objection}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease, delay: i * 0.08 }}
              className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.03] p-8 md:p-9"
            >
              <p className="font-display text-[19px] leading-snug text-white/90">
                {o.objection}
              </p>
              <div className="mt-4 flex gap-3">
                <span className="mt-1.5 inline-block h-px w-6 shrink-0 bg-accent-400" />
                <p className="text-[15px] leading-relaxed text-white/65">
                  {o.answer}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-[14px] text-white/45">
          Masz inne wątpliwości?{" "}
          <Link
            href="/czy-inwestycja-w-mieszkanie-jest-dla-mnie"
            className="text-white/70 underline underline-offset-2 transition-colors hover:text-white"
          >
            Przeczytaj, o czym warto wiedzieć przed zakupem mieszkania na wynajem
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
