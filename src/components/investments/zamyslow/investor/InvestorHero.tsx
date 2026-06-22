"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buildingImage } from "@/lib/investments/zamyslow-data";

const ease = [0.22, 1, 0.36, 1] as const;

const group = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const item = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.8, ease } },
};

export function InvestorHero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-white">
      <img
        src={buildingImage}
        alt="Osiedle Zamysłów - wizualizacja inwestycji w Rybniku"
        className="absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/70 to-ink-950/90" />
      <div className="absolute inset-0 grad-radial-brand opacity-40" />

      <div className="container-xl relative py-28 md:py-40">
        <motion.div
          variants={group}
          initial="hidden"
          animate="show"
          className="max-w-[60ch]"
        >
          <motion.p
            variants={item}
            className="eyebrow eyebrow-on-dark flex items-center gap-3"
          >
            <span className="inline-block h-px w-8 bg-accent-400" />
            Inwestycja w Rybniku · Osiedle Zamysłów
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-7 font-display fluid-display text-white"
          >
            Czy to się wynajmie?{" "}
            <em className="italic text-accent-400">Sprawdźmy liczby,</em> zanim
            zainwestujesz.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-8 max-w-[46ch] text-[17px] leading-relaxed text-white/70"
          >
            Mieszkanie na wynajem to decyzja na lata. Zebraliśmy tu wszystko, co
            inwestor chce wiedzieć o Zamysłowie: komu można zaufać, dlaczego
            akurat Rybnik, jaką rentowność przyjąć i które mieszkanie ma
            sens przy Twoim budżecie.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-11 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <a
              href="#kontakt"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-400 px-8 py-4 text-[14px] font-medium text-ink-950 transition-colors duration-300 hover:bg-white"
            >
              Porozmawiajmy o inwestycji
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="#mieszkania"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-8 py-4 text-[14px] font-medium text-white backdrop-blur-md transition-colors duration-300 hover:bg-white hover:text-ink-950"
            >
              Zobacz dostępne mieszkania
            </a>
          </motion.div>

          <motion.p variants={item} className="mt-7 text-[13px] text-white/45">
            Dopiero rozważasz pierwsze mieszkanie na wynajem?{" "}
            <Link
              href="/czy-inwestycja-w-mieszkanie-jest-dla-mnie"
              className="text-white/70 underline underline-offset-2 transition-colors hover:text-white"
            >
              Przeczytaj, czy taka inwestycja jest dla Ciebie
            </Link>
            .
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
