"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { zamyslowAdvantages } from "@/lib/investments/zamyslow-proof";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Odpowiedź na pytanie, którego brakowało na stronie: skoro w Rybniku powstają
 * też inne inwestycje, dlaczego akurat ta? Sekcja siada między „dlaczego Rybnik”
 * a liczbami, więc czytelnik przechodzi: miasto -> osiedle -> rentowność -> lokal.
 */
export function WhyZamyslow() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="border-b border-ink-200/60 bg-paper-warm py-24 md:py-32"
    >
      <div className="container-xl">
        <div className="max-w-[52ch]">
          <p className="eyebrow flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-brand-500" />
            Dlaczego to osiedle
          </p>
          <h2 className="mt-6 font-display fluid-h2 text-ink-950">
            Dlaczego inwestorzy wybierają{" "}
            <em className="italic text-brand-600">Osiedle Zamysłów?</em>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {zamyslowAdvantages.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease, delay: i * 0.08 }}
              className="rounded-[var(--radius-lg)] border border-ink-200/70 bg-white p-8 md:p-10"
            >
              <span className="font-display text-[20px] leading-none text-brand-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-display text-[20px] leading-snug text-ink-950">
                {a.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                {a.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
