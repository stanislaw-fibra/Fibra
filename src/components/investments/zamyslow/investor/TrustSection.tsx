"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

// Punkty zaufania oparte na sposobie działania (proces, jawność), a nie na
// deklaracjach typu "najlepsi". Jeśli masz twarde dowody (liczba zrealizowanych
// inwestycji, lata na rynku, konkretne osiedla), dopisz je do `proof` poniżej -
// najmocniej działa konkret, nie przymiotnik.
const pillars = [
  {
    title: "Lokalny deweloper, nie anonimowa spółka",
    body: "Działamy z Radlina, w regionie, w którym budujemy. Za inwestycją stoi Grupa Fibra Sp. z o.o. - z adresem, numerem telefonu i ludźmi, do których zadzwonisz przed zakupem i po nim.",
  },
  {
    title: "Liczby pokazujemy wprost",
    body: "Ceny, metraże, status każdego lokalu i szacowaną rentowność dostajesz na stół. Bez gwiazdek drobnym drukiem i obietnic, których nie da się sprawdzić.",
  },
  {
    title: "Wynajem prowadzimy też sami",
    body: "Na sąsiedniej inwestycji przy Niedobczyckiej 128F wynajmujemy mieszkania na bieżąco. Widzimy popyt z pierwszej ręki, a nie z prognoz.",
  },
  {
    title: "Jeden opiekun przez całą transakcję",
    body: "Od pierwszej rozmowy przez prospekt informacyjny i umowę aż po odbiór masz jedną osobę po swojej stronie. Nie przekazujemy Cię między działami.",
  },
];

export function TrustSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-paper py-24 md:py-32">
      <div className="container-xl">
        <div className="max-w-[52ch]">
          <p className="eyebrow flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-brand-500" />
            Czy mogę zaufać?
          </p>
          <h2 className="mt-6 font-display fluid-h2 text-ink-950">
            Zanim zaufasz pieniędzmi,{" "}
            <em className="italic text-brand-600">sprawdź, kto za tym stoi.</em>
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-ink-600">
            Inwestycja w mieszkanie to nie zakup impulsowy. Masz prawo wiedzieć,
            z kim siadasz do umowy i na czym opieramy to, co mówimy.
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
