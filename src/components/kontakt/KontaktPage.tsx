"use client";

import Link from "next/link";
import { useState } from "react";

const TOPICS = ["Sprzedaż", "Kupno", "Wynajem", "Inne"] as const;

/** Uzupełnij URL-e, gdy będą gotowe - puste href ukrywa ikonę. */
const SOCIAL: { label: string; href: string; icon: "ig" | "yt" | "in" }[] = [
  { label: "Instagram Fibry", href: "#", icon: "ig" },
  { label: "YouTube Fibry", href: "#", icon: "yt" },
  { label: "LinkedIn Fibry", href: "#", icon: "in" },
];

export function KontaktPage() {
  const [topic, setTopic] = useState<string | null>(null);
  const [topicError, setTopicError] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <>
      <section className="relative bg-paper-warm text-ink-900 pb-28 pt-10 md:pb-16 md:pt-14 lg:min-h-[calc(100dvh-72px)] lg:flex lg:flex-col lg:justify-center lg:py-12">
        <div className="container-xl relative w-full max-w-full">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-14 xl:gap-16">
            <div className="order-1 lg:col-start-2 lg:row-start-1">
              <div className="rounded-[var(--radius-lg)] border border-ink-200/80 bg-white p-7 shadow-[var(--shadow-soft)] ring-1 ring-ink-200/40 md:p-9">
                {sent ? (
                  <div className="py-12 text-center md:py-14">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h2 className="font-display text-2xl text-ink-950 md:text-3xl">Dziękujemy</h2>
                    <p className="mx-auto mt-3 max-w-sm text-[15px] text-ink-600 leading-relaxed">
                      Wiadomość doszła. Odezwiemy się możliwie szybko - zwykle w ciągu kilku godzin.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!topic) {
                        setTopicError(true);
                        return;
                      }
                      setTopicError(false);
                      setSent(true);
                    }}
                  >
                    <h2 className="font-display text-ink-950 tracking-tight" style={{ fontSize: "clamp(1.65rem, 3vw, 2.1rem)" }}>
                      Krótka wiadomość
                    </h2>
                    <p className="mt-2 text-[15px] text-ink-600 leading-relaxed">Odpowiadamy najczęściej w ciągu kilku godzin.</p>

                    <div className="mt-8 space-y-5">
                      <label className="block">
                        <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">Imię</span>
                        <input
                          name="name"
                          required
                          autoComplete="given-name"
                          placeholder="np. Anna"
                          className="mt-2 w-full rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/80 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">Telefon lub e-mail</span>
                        <input
                          name="contact"
                          required
                          autoComplete="tel"
                          placeholder="Telefon lub e-mail"
                          className="mt-2 w-full rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/80 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
                        />
                      </label>
                      <div>
                        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">Czego dotyczy zapytanie?</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {TOPICS.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setTopic(t);
                                setTopicError(false);
                              }}
                          aria-pressed={topic === t}
                              className={[
                                "rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                                topic === t ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200",
                              ].join(" ")}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        {topicError ? <p className="mt-2 text-[13px] text-red-600">Wybierz, czego dotyczy zapytanie.</p> : null}
                      </div>
                      <label className="block">
                        <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">Wiadomość (opcjonalnie)</span>
                        <textarea
                          name="message"
                          rows={4}
                          placeholder="O czym chcesz porozmawiać?"
                          className="mt-2 w-full resize-y rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/80 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
                        />
                      </label>
                    </div>

                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <p className="order-2 text-[11.5px] leading-relaxed text-ink-500 sm:order-1 sm:max-w-[20rem]">
                        Wysyłając, zgadzasz się na przetwarzanie danych zgodnie z{" "}
                        <Link
                          href="/polityka-prywatnosci"
                          className="text-brand-600 underline underline-offset-2 hover:text-brand-500"
                        >
                          polityką prywatności
                        </Link>
                        .
                      </p>
                      <button
                        type="submit"
                        className="order-1 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-8 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-brand-500 sm:order-2 sm:w-auto"
                      >
                        Wyślij wiadomość
                        <span aria-hidden>→</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <aside className="order-2 lg:col-start-1 lg:row-start-1">
              <h1 className="font-display text-ink-950 tracking-tight leading-[0.98]" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)" }}>
                Porozmawiajmy.
              </h1>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-600 md:text-lg">
                Chcesz sprzedać, kupić, wynająć - albo po prostu sprawdzić możliwości? Zacznijmy od krótkiej rozmowy.
              </p>

              <div className="mt-10 space-y-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Zadzwoń</p>
                  <a
                    href="tel:+48510777200"
                    className="mt-2 inline-block font-display text-[clamp(1.85rem,4vw,2.75rem)] text-ink-950 tracking-tight tabular-nums transition-colors hover:text-brand-600"
                  >
                    510 777 200
                  </a>
                  <p className="mt-2 text-[14px] text-ink-500">Pon.–Pt. 8:00–16:00</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Napisz</p>
                  <a
                    href="mailto:biuro@grupafibra.pl"
                    className="mt-2 inline-block text-lg font-medium text-ink-950 underline decoration-brand-500/40 underline-offset-4 transition-colors hover:text-brand-600 hover:decoration-brand-500"
                  >
                    biuro@grupafibra.pl
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Odwiedź</p>
                  <p className="mt-2 text-[15px] font-medium text-ink-900">Grupa Fibra Sp. z o.o.</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-600">
                    ul. Rymera 177
                    <br />
                    44-310 Radlin
                  </p>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-3">
                {SOCIAL.map((s) => (
                  <a
                    key={s.icon}
                    href={s.href}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-200/90 bg-white text-ink-600 shadow-sm transition-colors hover:border-brand-400 hover:text-brand-600"
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SocialIcon type={s.icon} />
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/90 bg-paper-warm/95 px-4 py-3 shadow-[0_-12px_32px_-12px_rgba(11,15,20,0.12)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden"
        role="region"
        aria-label="Szybki kontakt telefoniczny"
      >
        <a
          href="tel:+48510777200"
          className="flex min-h-[48px] w-full items-center justify-between gap-4 rounded-full bg-ink-900 px-5 py-3 text-white transition-colors active:bg-ink-800"
        >
          <span className="text-[13px] font-medium text-white/85">Zadzwoń</span>
          <span className="font-display text-lg tabular-nums tracking-tight">510 777 200</span>
        </a>
      </div>
    </>
  );
}

function SocialIcon({ type }: { type: "ig" | "yt" | "in" }) {
  if (type === "ig") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  if (type === "yt") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 4.127 0 2.062 2.062 0 0 1-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
