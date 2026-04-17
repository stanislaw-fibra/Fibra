"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const BUDGETS = [
  { id: "lt1", label: "< 1 mln", hint: "zł" },
  { id: "1-2", label: "1–2 mln", hint: "zł" },
  { id: "2-5", label: "2–5 mln", hint: "zł" },
  { id: "5-10", label: "5–10 mln", hint: "zł" },
  { id: "gt10", label: "> 10 mln", hint: "zł" },
] as const;

const INTENTS = ["Kupić", "Sprzedać", "Wynająć", "Zainwestować", "Inne"] as const;

export function LeadCapture() {
  const [budget, setBudget] = useState<string | null>(null);
  const [intent, setIntent] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 md:py-32 bg-ink-950 text-ink-100 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 grad-radial-brand opacity-70" />
      <div className="container-xl relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease }}
          >
            <p className="eyebrow eyebrow-on-dark flex items-center gap-3 mb-8">
              <span className="inline-block w-8 h-px bg-accent-400" />
              Kontakt
            </p>
            <h2 className="font-display text-white fluid-display max-w-[14ch]">
              Porozmawiajmy <em className="italic text-accent-400">o nieruchomości</em>.
            </h2>
            <p className="mt-8 text-[16px] text-white/60 max-w-[42ch] leading-relaxed">
              Jeśli chcesz sprzedać, wynająć albo po prostu sprawdzić możliwości - zacznijmy od krótkiej rozmowy.
            </p>
            <div className="mt-8 text-[13px] text-white/45 leading-relaxed">
              <p className="text-white/70 font-medium">Grupa Fibra Sp. z o.o.</p>
              <p>ul. Rymera 177, 44-310 Radlin</p>
              <p>Pon.–Pt. 8:00–16:00</p>
            </div>
            <div className="mt-14 flex flex-col gap-3">
              <a href="tel:+48510777200" className="group flex items-center gap-4 text-white">
                <span className="inline-flex w-11 h-11 items-center justify-center rounded-full bg-white/5 group-hover:bg-accent-400 group-hover:text-ink-950 transition-colors duration-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.07 2H7a2 2 0 0 1 2 1.72c.13.9.35 1.78.66 2.62a2 2 0 0 1-.45 2.11L7.9 9.77a16 16 0 0 0 6 6l1.32-1.32a2 2 0 0 1 2.11-.45c.84.3 1.72.53 2.62.66A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[13px] text-white/40">Zadzwoń</span>
                  <span className="text-[16px]">510 777 200</span>
                </span>
              </a>
              <a href="mailto:biuro@grupafibra.pl" className="group flex items-center gap-4 text-white">
                <span className="inline-flex w-11 h-11 items-center justify-center rounded-full bg-white/5 group-hover:bg-accent-400 group-hover:text-ink-950 transition-colors duration-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 7l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[13px] text-white/40">Napisz</span>
                  <span className="text-[16px]">biuro@grupafibra.pl</span>
                </span>
              </a>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease, delay: 0.15 }}
          >
            <form
              className="bg-white text-ink-900 p-8 md:p-10 rounded-[var(--radius-lg)] shadow-[var(--shadow-cinematic)]"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              {sent ? (
                <motion.div
                  className="py-16 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease }}
                >
                  <div className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-brand-500 text-white mb-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="font-display text-[34px] text-ink-950 mb-3">Dziękujemy.</h3>
                  <p className="text-[15px] text-ink-600 max-w-sm mx-auto">
                    Odezwiemy się w ciągu 24h z pierwszą, przemyślaną rekomendacją.
                  </p>
                </motion.div>
              ) : (
                <>
                  <p className="eyebrow text-ink-500 mb-6">Krótka wiadomość - 60 sekund</p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Imię" name="name" required placeholder="Anna" />
                    <Field label="E-mail" name="email" type="email" required placeholder="anna@example.com" />
                    <Field label="Telefon" name="phone" type="tel" placeholder="+48 …" />
                    <Field label="Miasto / lokalizacja" name="city" placeholder="Radlin, Rybnik, Wodzisław…" />
                  </div>

                  <div className="mt-8">
                    <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500 mb-3">Chcę</p>
                    <div className="flex flex-wrap gap-2">
                      {INTENTS.map((k) => (
                        <Chip key={k} active={intent === k} onClick={() => setIntent(k)}>
                          {k}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500 mb-3">Budżet</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {BUDGETS.map((b) => (
                        <BudgetTile
                          key={b.id}
                          active={budget === b.id}
                          onClick={() => setBudget(b.id)}
                          label={b.label}
                          hint={b.hint}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block">
                      <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">
                        Notatka (opcjonalnie)
                      </span>
                      <textarea
                        rows={3}
                        placeholder="Czego szukasz? Co jest ważne?"
                        className="mt-2 w-full bg-ink-50 focus:bg-white border border-ink-200 focus:border-brand-500 rounded-[var(--radius-sm)] px-4 py-3 text-[14px] outline-none transition-colors resize-none"
                      />
                    </label>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-4 justify-between">
                    <p className="text-[11.5px] text-ink-400 max-w-md">
                      Wysyłając zgadzasz się na przetwarzanie danych zgodnie z{" "}
                      <Link href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-ink-600">
                        polityką prywatności
                      </Link>
                      .
                    </p>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-ink-900 hover:bg-brand-500 text-white px-7 py-3.5 text-[13px] font-medium transition-colors duration-300"
                    >
                      Wyślij
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full bg-ink-50 focus:bg-white border border-ink-200 focus:border-brand-500 rounded-[var(--radius-sm)] px-4 py-3 text-[14px] outline-none transition-colors"
      />
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-[13px] transition-all duration-200",
        active
          ? "bg-ink-900 text-white"
          : "bg-ink-50 text-ink-700 hover:bg-ink-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function BudgetTile({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex flex-col items-start rounded-[var(--radius-sm)] border px-3 py-3 text-left transition-all duration-200 min-h-[72px]",
        active
          ? "border-brand-500 bg-brand-500/10 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
          : "border-ink-200 bg-ink-50/80 hover:border-ink-300 hover:bg-white",
      ].join(" ")}
    >
      <span className="font-display text-[17px] text-ink-950 leading-none tabular-nums">{label}</span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500">{hint}</span>
      {active && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-brand-500" aria-hidden />
      )}
    </button>
  );
}
