"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const TESTIMONIALS = [
  {
    quote:
      "Szukaliśmy penthouse'u prawie rok. Fibra pokazała nam trzy konkretne oferty - drugi, który zobaczyliśmy, okazał się domem, o którym marzyliśmy.",
    author: "Anna i Marek",
    role: "Warszawa · Powiśle",
  },
  {
    quote:
      "Forma filmu zrobiła różnicę. Zobaczyłam moje przyszłe mieszkanie pierwszy raz z innego kontynentu - i wiedziałam, że to to.",
    author: "Julia K.",
    role: "Sopot · Dolny",
  },
  {
    quote:
      "Najbardziej profesjonalny team nieruchomości, z jakim miałem do czynienia. Bez nachalności, bez marketingowego bełkotu. Konkret.",
    author: "Tomasz W.",
    role: "Kraków · Stare Miasto",
  },
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 md:py-32 bg-paper" ref={ref}>
      <div className="container-xl">
        <motion.div
          className="mb-14 md:mb-20 max-w-3xl"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease }}
        >
          <p className="eyebrow flex items-center gap-3 mb-6">
            <span className="inline-block w-8 h-px bg-brand-500" />
            Opinie klientów
          </p>
          <h2 className="font-display fluid-display text-ink-950">
            Mówią nam, że to się <em className="italic text-brand-500">czuje</em>.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.author}
              className="h-full flex flex-col justify-between p-7 md:p-8 bg-paper-warm rounded-[var(--radius-md)]"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease, delay: 0.15 + i * 0.1 }}
            >
              <div>
                <svg width="28" height="20" viewBox="0 0 32 24" className="text-brand-500/20 mb-5" aria-hidden>
                  <path
                    d="M6 0C2.7 0 0 2.7 0 6v6c0 3.3 2.7 6 6 6h3v6H3c-1.7 0-3-1.3-3-3V6C0 2.7 2.7 0 6 0zm20 0c-3.3 0-6 2.7-6 6v6c0 3.3 2.7 6 6 6h3v6h-6c-1.7 0-3-1.3-3-3V6c0-3.3 2.7-6 6-6z"
                    fill="currentColor"
                  />
                </svg>
                <blockquote className="font-display text-[20px] md:text-[22px] leading-[1.25] text-ink-950">
                  „{t.quote}"
                </blockquote>
              </div>
              <figcaption className="mt-8 pt-6 hairline-t">
                <p className="text-[14px] font-medium text-ink-900">{t.author}</p>
                <p className="text-[12px] text-ink-500 mt-1">{t.role}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
