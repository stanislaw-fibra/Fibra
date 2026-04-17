"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function Manifesto() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 md:py-40 bg-ink-950 text-ink-100 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 grad-radial-brand opacity-60" />
      <div className="absolute inset-0 grain grain-on-dark" />

      <div className="container-xl relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-stretch">
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease }}
          >
            <p className="eyebrow eyebrow-on-dark flex items-center gap-3 mb-8">
              <span className="inline-block w-8 h-px bg-accent-400" aria-hidden />
              Motto Fibry
            </p>
            <div className="relative rounded-[var(--radius-lg)] border border-white/12 bg-white/[0.04] p-8 md:p-12 lg:p-14 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.65)] backdrop-blur-sm">
              <div className="absolute left-0 top-10 bottom-10 w-1 rounded-full bg-gradient-to-b from-accent-400 via-brand-500 to-brand-600 opacity-90" aria-hidden />
              <blockquote className="pl-6 md:pl-8 font-display text-white leading-[1.05] text-[clamp(1.85rem,4.2vw,3.25rem)] tracking-tight">
                „Interesy robi się z ludźmi,
                <br />
                a nie na ludziach.”
              </blockquote>
              <p className="pl-6 md:pl-8 mt-8 text-[13px] uppercase tracking-[0.2em] text-white/40">Fibra Nieruchomości</p>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-5 flex flex-col justify-center lg:pl-4"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease, delay: 0.15 }}
          >
            <div className="rounded-[var(--radius-lg)] border border-white/10 bg-ink-950/80 p-10 md:p-12 flex flex-col justify-center min-h-[240px] md:min-h-[280px]">
              <p className="font-display text-white text-[clamp(4rem,12vw,7.5rem)] leading-none tracking-tight">20</p>
              <p className="mt-4 text-white/90 text-[15px] font-medium leading-snug max-w-[16ch]">lat doświadczenia</p>
              <p className="mt-4 text-ink-400 text-[13px] leading-relaxed max-w-[28ch]">
                Łączymy obieg nieruchomości, budownictwo, architekturę i finansowanie - od pierwszego kontaktu po
                podpisanie aktu.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
