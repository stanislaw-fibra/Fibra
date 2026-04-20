"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const FOUNDER_PHOTO =
  "https://yrkvochsziertbvzbnol.supabase.co/storage/v1/object/public/agent-photos/Bartosz%20Nosiadek.jpg";

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
              Fibra to specjaliści od obrotu nieruchomościami, budownictwa, architektury i finansowania - zebrani w
              jednym miejscu. Działamy w powiecie rybnickim i wodzisławskim od ponad 15 lat.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[48ch] text-[17px] md:text-[18px] leading-[1.6] text-ink-700"
            >
              Obsługujemy zarówno kupujących własne mieszkanie, jak i inwestorów szukających lokali na wynajem. Znamy tu
              każdy blok i każdą ulicę.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/o-fibrze"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-ink-900 hover:bg-brand-500 text-white px-7 py-4 text-[14px] md:text-[15px] font-medium transition-colors active:scale-[0.98]"
              >
                Poznaj zespół
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/kontakt"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-ink-300 bg-paper hover:border-ink-900 hover:bg-ink-950 hover:text-white text-ink-900 px-7 py-4 text-[14px] md:text-[15px] font-medium transition-all duration-200 active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
                  <rect
                    x="2.5"
                    y="3.75"
                    width="11"
                    height="9.75"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.25"
                  />
                  <path
                    d="M2.5 6.75h11M5.5 2.25v2.5M10.5 2.25v2.5"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                </svg>
                Umów spotkanie
              </Link>
            </motion.div>
          </div>

          <motion.figure
            variants={fadeUp}
            className="lg:col-span-5 relative overflow-hidden rounded-[var(--radius-lg)] ring-1 ring-ink-200/60 shadow-[var(--shadow-soft)] bg-ink-100"
          >
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={FOUNDER_PHOTO}
                alt="Bartosz Nosiadek - Założyciel, Prezes Zarządu Fibra"
                fill
                sizes="(min-width: 1024px) 40vw, (min-width: 768px) 70vw, 90vw"
                className="object-cover"
                style={{ objectPosition: "center 22%" }}
                quality={82}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-950/75 via-ink-950/25 to-transparent"
                aria-hidden
              />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 p-6 md:p-7 text-white">
              <p className="font-display text-[22px] md:text-[26px] leading-tight text-balance">
                Bartosz Nosiadek
              </p>
              <p className="mt-1.5 text-[11px] md:text-[12px] uppercase tracking-[0.18em] text-white/85 font-medium">
                Założyciel, Prezes Zarządu
              </p>
            </figcaption>
          </motion.figure>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.9, ease }}
          className="relative mt-20 w-screen max-w-none left-1/2 -translate-x-1/2 md:mt-28 lg:mt-32"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-200/80 to-transparent" aria-hidden />
          <div className="bg-gradient-to-b from-paper-cream/50 via-paper-warm/30 to-transparent px-5 pb-16 pt-14 sm:px-8 md:pb-20 md:pt-16">
            <div className="mx-auto max-w-[40rem] text-center">
              <div className="mb-8 flex items-center justify-center gap-3 sm:gap-4">
                <span className="h-px w-8 bg-ink-200/90 sm:w-12" aria-hidden />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">Po ludzku</p>
                <span className="h-px w-8 bg-ink-200/90 sm:w-12" aria-hidden />
              </div>
              <p className="font-display text-[clamp(1.4rem,3.4vw,1.95rem)] leading-[1.42] tracking-[-0.02em] text-ink-900 text-balance">
                W Fibrze każdą nieruchomość pokazuje Ci konkretna osoba - na filmie, na spacerze 3D, na żywo przy kawie.
                Ktoś, kto tam był, widział okolicę rano i wieczorem, rozmawiał z sąsiadami i wie, gdzie jest najbliższy
                plac zabaw.
              </p>
              <p className="mx-auto mt-9 max-w-[36rem] text-[15px] leading-[1.72] text-ink-600 md:text-[16px] text-pretty">
                Kupno albo sprzedaż mieszkania to jedna z największych decyzji w życiu. Uważamy, że zasługujesz na
                człowieka po drugiej stronie, nie na kolejny ekran z checkboxami.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
