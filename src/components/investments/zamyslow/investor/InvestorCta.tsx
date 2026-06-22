"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { submitLead } from "@/lib/leads-client";
import { useFormGuards, GUARD_NOT_READY_MESSAGE } from "@/components/forms/FormGuards";

const ease = [0.22, 1, 0.36, 1] as const;

export function InvestorCta() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { guards, getGuardData, ready } = useFormGuards();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="kontakt"
      ref={ref}
      className="relative scroll-mt-[72px] overflow-hidden bg-ink-950 py-24 text-ink-100 md:py-32"
    >
      <div className="absolute inset-0 grad-radial-brand opacity-70" />
      <div className="container-xl relative">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-20">
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease }}
          >
            <p className="eyebrow eyebrow-on-dark flex items-center gap-3 mb-8">
              <span className="inline-block h-px w-8 bg-accent-400" />
              Porozmawiajmy
            </p>
            <h2 className="font-display fluid-display max-w-[15ch] text-white">
              Policzymy to{" "}
              <em className="italic text-accent-400">razem.</em>
            </h2>
            <p className="mt-8 max-w-[42ch] text-[16px] leading-relaxed text-white/60">
              Zostaw numer, a oddzwonimy i spokojnie przejdziemy przez liczby:
              ceny, szacowaną rentowność i to, które mieszkanie ma sens przy
              Twoim budżecie. Bez nacisku na podpis.
            </p>

            <div className="mt-14 flex flex-col gap-3">
              <a href="tel:+48510777200" className="group flex items-center gap-4 text-white">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/5 transition-colors duration-300 group-hover:bg-accent-400 group-hover:text-ink-950">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.07 2H7a2 2 0 0 1 2 1.72c.13.9.35 1.78.66 2.62a2 2 0 0 1-.45 2.11L7.9 9.77a16 16 0 0 0 6 6l1.32-1.32a2 2 0 0 1 2.11-.45c.84.3 1.72.53 2.62.66A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[13px] text-white/40">Zadzwoń</span>
                  <span className="text-[16px]">510 777 200</span>
                </span>
              </a>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease, delay: 0.15 }}
          >
            <form
              className="rounded-[var(--radius-lg)] bg-white p-8 text-ink-900 shadow-[var(--shadow-cinematic)] md:p-10"
              onSubmit={async (e) => {
                e.preventDefault();
                if (sending) return;
                if (!ready) {
                  setError(GUARD_NOT_READY_MESSAGE);
                  return;
                }
                setError(null);
                setSending(true);
                try {
                  const fd = new FormData(e.currentTarget);
                  const full_name = String(fd.get("name") || "").trim();
                  const phone = String(fd.get("phone") || "").trim();
                  const email = String(fd.get("email") || "").trim();
                  const message = String(fd.get("message") || "").trim();

                  await submitLead({
                    source: "investor_zamyslow",
                    full_name,
                    phone,
                    email: email.length ? email : null,
                    message: message.length ? message : null,
                    ...getGuardData(),
                  });

                  setSent(true);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Nie udało się wysłać. Spróbuj ponownie.",
                  );
                } finally {
                  setSending(false);
                }
              }}
            >
              {sent ? (
                <motion.div
                  className="py-16 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease }}
                >
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="mb-3 font-display text-[34px] text-ink-950">Dziękujemy.</h3>
                  <p className="mx-auto max-w-sm text-[15px] text-ink-600">
                    Oddzwonimy możliwie szybko - zwykle w ciągu kilku godzin w dni robocze.
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Imię" name="name" required placeholder="Anna" />
                    <Field label="Telefon" name="phone" type="tel" required placeholder="+48 ..." />
                  </div>

                  <div className="mt-4">
                    <Field
                      label="E-mail"
                      name="email"
                      type="email"
                      placeholder="anna@przyklad.pl"
                      optional
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block">
                      <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">
                        Wiadomość{" "}
                        <span className="normal-case tracking-normal text-ink-400">(opcjonalnie)</span>
                      </span>
                      <textarea
                        name="message"
                        rows={3}
                        placeholder="Np. budżet, którym dysponuję, albo pytanie o konkretne mieszkanie."
                        className="mt-2 w-full resize-none rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50 px-4 py-3 text-[14px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
                      />
                    </label>
                  </div>

                  {guards}

                  {error ? <p className="mt-4 text-[13px] text-red-600">{error}</p> : null}

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <p className="max-w-md text-[11.5px] text-ink-400">
                      Wysyłając zgadzasz się na przetwarzanie danych zgodnie z{" "}
                      <Link href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-ink-600">
                        polityką prywatności
                      </Link>
                      .
                    </p>
                    <button
                      type="submit"
                      disabled={sending}
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[13px] font-medium text-white transition-colors duration-300",
                        sending ? "cursor-wait bg-ink-900/70" : "bg-ink-900 hover:bg-brand-500",
                      ].join(" ")}
                    >
                      {sending ? "Wysyłanie…" : "Oddzwońcie do mnie →"}
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
  optional,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">
        {label}{" "}
        {optional ? (
          <span className="normal-case tracking-normal text-ink-400">(opcjonalnie)</span>
        ) : null}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50 px-4 py-3 text-[14px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
      />
    </label>
  );
}
