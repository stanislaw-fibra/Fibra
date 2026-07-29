"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

// Punkty zaufania oparte na sposobie działania (proces, jawność), a nie na
// deklaracjach typu "najlepsi". Twarde liczby (lata na rynku, mieszkania
// w zarządzaniu, liczba inwestorów) żyją osobno w `zamyslow-proof.ts` i lądują
// w pasku nad tą sekcją - najmocniej działa konkret, nie przymiotnik.
const pillars = [
  {
    title: "Deweloper z 20-letnim doświadczeniem",
    body: "Budujemy tutaj i jesteśmy tutaj na co dzień. Inwestycję prowadzi Grupa Fibra Sp. z o.o. - z biurem, zespołem i konkretnymi osobami, z którymi będziesz w kontakcie przed i po zakupie mieszkania.",
  },
  {
    title: "Pełna przejrzystość oferty",
    body: "Nie każemy niczego wyliczać. Przy każdym mieszkaniu znajdziesz cenę, metraż, status dostępności, przewidywany czynsz i szacowaną rentowność. Wszystkie najważniejsze informacje masz od razu przed sobą.",
  },
  {
    title: "Mamy własny dział zarządzania najmem",
    body: "Najmem mieszkań na naszym osiedlu zajmujemy się od lat. Dzięki temu wiemy, jak wygląda rzeczywistość: ile trwa znalezienie najemców i czego oni oczekują.",
  },
  {
    title: "Jeden opiekun przez całą transakcję",
    body: "Od pierwszej rozmowy aż po odbiór mieszkania prowadzi Cię jedna osoba. Nie zmieniamy opiekuna w trakcie zakupu.",
  },
];

export function TrustSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-paper py-24 md:py-32">
      <div className="container-xl">
        <div className="grid gap-x-14 gap-y-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="eyebrow flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-brand-500" />
              Czy mogę zaufać?
            </p>
            <h2 className="mt-6 font-display fluid-h2 text-ink-950">
              Kiedy inwestujesz pieniądze,{" "}
              <em className="italic text-brand-600">warto wiedzieć, komu je powierzasz.</em>
            </h2>
          </div>
          <p className="max-w-[48ch] text-[17px] leading-relaxed text-ink-600 lg:pb-1.5">
            Zakup mieszkania inwestycyjnego to decyzja na lata. Dlatego
            pokazujemy nie tylko ofertę, ale również ludzi, doświadczenie
            i liczby, na których możesz się oprzeć.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/70 bg-ink-200/70 sm:grid-cols-2">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease, delay: i * 0.08 }}
              className="bg-white p-8 md:p-10"
            >
              <h3 className="font-display text-[20px] text-ink-950">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
