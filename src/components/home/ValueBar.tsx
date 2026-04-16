"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const VALUES = [
  {
    num: "01",
    title: "Video-first",
    body: "Każda nieruchomość prezentowana w dedykowanym, pionowym filmie — tak, jak oglądasz treści na co dzień.",
  },
  {
    num: "02",
    title: "Premium obsługa",
    body: "Dedykowany doradca, który zna ofertę, rynek i Twoje potrzeby. Bez konwejeru, bez pośpiechu.",
  },
  {
    num: "03",
    title: "Pełny kontekst",
    body: "Spacery 3D, rzuty, mapy, pełna dokumentacja prawna — wszystko w jednym panelu oferty.",
  },
];

export function ValueBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 md:py-28 bg-paper-warm relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent" />
      <div className="container-xl">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {VALUES.map((v, i) => (
            <motion.article
              key={v.num}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease, delay: i * 0.12 }}
            >
              <p className="font-display text-[54px] md:text-[64px] leading-none text-brand-500/20">
                {v.num}
              </p>
              <h3 className="mt-5 font-display text-[26px] md:text-[28px] leading-[1.1] text-ink-950">
                {v.title}
              </h3>
              <p className="mt-4 text-[15px] leading-[1.6] text-ink-600 max-w-[34ch]">
                {v.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
