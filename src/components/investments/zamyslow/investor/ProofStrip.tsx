"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { proofFacts, PROOF_STRIP_MIN_FACTS } from "@/lib/investments/zamyslow-proof";

const ease = [0.22, 1, 0.36, 1] as const;

// Tyle kolumn, ile potwierdzonych faktów (maks. 4) - żeby pasek nigdy nie miał
// pustych pól po prawej, niezależnie od tego, ile liczb jest już zatwierdzonych.
const columns: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * Pasek twardych faktów tuż pod hero - pierwsza rzecz po nagłówku, bo inwestor
 * szuka dowodów zanim zacznie czytać opisy. Fakty bez potwierdzonej wartości
 * (`value: null`) wypadają, żeby nigdy nie pokazać pustej liczby.
 */
export function ProofStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const facts = proofFacts.filter((f) => f.value !== null);
  if (facts.length < PROOF_STRIP_MIN_FACTS) return null;

  return (
    <section ref={ref} className="border-t border-white/10 bg-ink-950 text-white">
      <div className="container-xl">
        <div className={`grid gap-px bg-white/10 ${columns[Math.min(facts.length, 4)]}`}>
          {facts.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, ease, delay: i * 0.07 }}
              className="bg-ink-950 px-2 py-9 sm:px-4 md:py-11"
            >
              <p className="font-display text-[34px] leading-none text-accent-400 md:text-[40px]">
                {f.value}
              </p>
              <p className="mt-3 max-w-[26ch] text-[13.5px] leading-relaxed text-white/55">
                {f.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
