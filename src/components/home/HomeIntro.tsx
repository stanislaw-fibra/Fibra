"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease } },
};

export function HomeIntro() {
  return (
    <section
      id="fibra-story"
      className="relative py-20 md:py-28 overflow-hidden bg-[var(--color-paper)]"
    >
      <div className="absolute inset-0 -z-10 grad-radial-brand opacity-40" />
      <div className="container-xl">
        <motion.div
          className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <div className="lg:col-span-7">
            <motion.p variants={fadeUp} className="eyebrow flex items-center gap-3 mb-6">
              <span className="inline-block w-8 h-px bg-brand-500" />
              O Fibrze
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-ink-950"
              style={{
                fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.03em",
              }}
            >
              Zespół, który <br />
              <em className="italic text-brand-500">zna ten rynek</em>.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-[48ch] text-[17px] md:text-[18px] leading-[1.6] text-ink-700"
            >
              Fibra to specjaliści od obrotu nieruchomościami, budownictwa, architektury i finansowania — zebrani w
              jednym miejscu. Działamy w powiecie rybnickim i wodzisławskim od ponad 15 lat.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[48ch] text-[17px] md:text-[18px] leading-[1.6] text-ink-700"
            >
              Obsługujemy zarówno kupujących własne mieszkanie, jak i inwestorów szukających lokali na wynajem. Znamy tu
              każdy blok i każdą ulicę.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/o-nas"
                className="group inline-flex items-center gap-3 rounded-full bg-ink-900 hover:bg-brand-500 text-white px-7 py-4 text-[14px] font-medium transition-colors"
              >
                Poznaj zespół
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/kontakt"
                className="group inline-flex items-center gap-3 text-[14px] font-medium text-ink-900 hover:text-brand-500 transition-colors"
              >
                <span className="inline-flex w-10 h-10 items-center justify-center rounded-full border border-ink-900 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                Umów rozmowę
              </Link>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="lg:col-span-5">
            <div className="rounded-[var(--radius-lg)] border border-ink-200/80 bg-paper-warm p-8 md:p-10 shadow-[var(--shadow-soft)] ring-1 ring-ink-200/50">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500 mb-4">Motto</p>
              <p className="font-display text-[22px] md:text-[26px] text-ink-950 leading-snug">
                „Interesy robi się z ludźmi, a nie na ludziach.”
              </p>
              <p className="mt-6 text-[14px] text-ink-600 leading-relaxed">
                Tak pracujemy z klientami i z rynkiem — bez presji, z pełną transparentnością i jednym opiekunem przy
                transakcji.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
