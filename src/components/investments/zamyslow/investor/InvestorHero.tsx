"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buildingImage } from "@/lib/investments/zamyslow-data";

const ease = [0.22, 1, 0.36, 1] as const;

const group = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } },
};
const item = {
  hidden: { y: 22, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.7, ease } },
};

export function InvestorHero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-white">
      <div className="grid md:min-h-[86vh] md:grid-cols-[0.92fr_1.08fr]">
        {/* Wizualizacja - na mobile u góry, na desktopie po prawej; soczysta, bez przyciemnienia */}
        <div className="relative order-1 h-[42vh] min-h-[280px] md:order-2 md:h-auto md:min-h-full">
          <img
            src={buildingImage}
            alt="Osiedle Zamysłów - nowa inwestycja mieszkaniowa w Rybniku"
            className="absolute inset-0 h-full w-full object-cover object-[42%_center]"
            draggable={false}
          />
          {/* Delikatne zlanie krawędzi z ciemnym panelem tekstu (reszta zdjęcia ostra) */}
          <div
            className="pointer-events-none absolute inset-0 md:hidden"
            style={{
              background:
                "linear-gradient(to top, var(--color-ink-950) 0%, rgba(7,9,12,0.55) 12%, rgba(7,9,12,0.18) 26%, rgba(7,9,12,0) 44%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 hidden md:block"
            style={{
              background:
                "linear-gradient(to right, var(--color-ink-950) 0%, rgba(7,9,12,0.6) 9%, rgba(7,9,12,0.2) 20%, rgba(7,9,12,0) 34%)",
            }}
          />
        </div>

        {/* Tekst - na mobile pod zdjęciem, na desktopie po lewej na ciemnym, czytelnym tle */}
        <div className="relative order-2 flex items-center md:order-1">
          <div className="pointer-events-none absolute inset-0 grad-radial-brand opacity-25" />
          <motion.div
            variants={group}
            initial="hidden"
            animate="show"
            className="relative max-w-[40rem] px-6 py-14 sm:px-8 md:py-24 md:pl-10 md:pr-12 lg:pl-16 xl:pl-24"
          >
            <motion.h1
              variants={item}
              className="font-display fluid-display text-white"
            >
              Nowe mieszkanie w Rybniku, które{" "}
              <em className="italic text-accent-400">pracuje na Ciebie każdego miesiąca.</em>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-8 max-w-[48ch] text-[17px] leading-relaxed text-white/75"
            >
              Osiedle Zamysłów to nowa inwestycja w Rybniku. Pomagamy wybrać
              i kupić mieszkanie, a potem prowadzimy cały najem za Ciebie, od
              znalezienia najemcy po bieżącą obsługę. Ty inwestujesz raz i co
              miesiąc odbierasz czynsz.
            </motion.p>

            <motion.div variants={item} className="mt-10">
              <a
                href="#mieszkania"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-accent-400 px-8 py-4 text-[15px] font-medium text-ink-950 transition-colors duration-300 hover:bg-white"
              >
                Zobacz dostępne mieszkania
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
      </div>
    </section>
  );
}
