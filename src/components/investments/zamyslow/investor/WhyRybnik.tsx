"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

// Format obiekcja -> odpowiedź. Każda odpowiedź ma być prawdziwa i sprawdzalna.
// Jeśli masz lokalne dane (liczba mieszkańców Rybnika, najwięksi pracodawcy,
// pustostany), wpisz je w treść - konkret rozwiewa obawę mocniej niż ogólnik.
type Objection = {
  objection: string;
  /** Kolejne akapity odpowiedzi. */
  answer: string[];
  /** Dłuższa odpowiedź na całą szerokość (pytanie z lewej, tekst z prawej). */
  wide?: boolean;
};

const objections: Objection[] = [
  {
    // Uwaga Bartka: w Rybniku uczelnie są, tylko małe - nie piszemy, że ich nie ma.
    objection: "„Przecież Rybnik nie jest wielkim ośrodkiem akademickim.”",
    answer: [
      "Zgadza się. Uczelnie w Rybniku kształcą łącznie około tysiąca studentów, w większości osoby z regionu. Mieszkania wynajmują tu przede wszystkim osoby pracujące: single, pary i młode rodziny. To najemcy, którzy szukają mieszkania na rok lub dłużej, dzięki czemu najem jest bardziej stabilny.",
    ],
  },
  {
    objection: "„Czy w ogóle będzie komu wynajmować?”",
    answer: [
      "Tak. Potwierdza to nasze doświadczenie. Na naszym osiedlu na bieżąco wynajmujemy mieszkania i widzimy, że dobrze wykończone lokale znajdują najemców. Popyt nie jest dla nas teorią - obserwujemy go na co dzień.",
    ],
  },
  {
    objection: "„Najemcy ciągle się zmieniają, to same kłopoty.”",
    answer: [
      "W Rybniku najemcy często zostają na dłużej niż w typowych miastach studenckich. To oznacza mniejszą rotację, mniej okresów bez najemcy i rzadszą potrzebę przygotowywania mieszkania do kolejnego wynajmu.",
    ],
  },
  {
    // Treść od Bartka: Rybnik to centrum subregionu, nie małe miasto.
    objection: "„Czy w takim mieście to się w ogóle opłaca?”",
    wide: true,
    answer: [
      "To, co wyróżnia Rybnik, to jego rola centrum subregionu zachodniego województwa śląskiego. Obsługuje on mieszkańców okolicznych miast i gmin, takich jak Żory, Wodzisław Śląski, Racibórz, Czerwionka-Leszczyny czy Jastrzębie-Zdrój.",
      "Łącznie ten obszar oddziaływania obejmuje około 500 – 700 tys. mieszkańców, dlatego pod względem handlu, usług medycznych, sądownictwa, edukacji czy administracji Rybnik pełni rolę znacznie większą, niż wynikałoby to z samej liczby jego mieszkańców.",
      "Z perspektywy rozwoju rynku nieruchomości jest to istotna przewaga. Rybnik jest na tyle duży, aby generować stabilny popyt, ale jednocześnie nie jest jeszcze nasycony w takim stopniu jak największe miasta akademickie czy metropolie.",
    ],
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

        {/* Trzy krótkie odpowiedzi w rzędzie + jedna dłuższa na całą szerokość -
            inaczej karta z rozbudowaną odpowiedzią rozpycha sąsiadkę w rzędzie. */}
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {objections.map((o, i) => (
            <motion.div
              key={o.objection}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease, delay: i * 0.08 }}
              className={[
                "rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.03] p-8 md:p-9",
                o.wide
                  ? "lg:col-span-3 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12 lg:p-10"
                  : "",
              ].join(" ")}
            >
              <p className="font-display text-[19px] leading-snug text-white/90">
                {o.objection}
              </p>
              <div className={o.wide ? "mt-4 flex gap-3 lg:mt-0" : "mt-4 flex gap-3"}>
                <span className="mt-1.5 inline-block h-px w-6 shrink-0 bg-accent-400" />
                <div className="space-y-3.5 text-[15px] leading-relaxed text-white/65">
                  {o.answer.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
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
