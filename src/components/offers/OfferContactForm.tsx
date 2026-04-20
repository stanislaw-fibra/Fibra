"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  firstNameGenitive,
  firstNameInstrumental,
} from "@/lib/polish-names";

type Topic = "prezentacja" | "materialy" | "inne";

const TOPIC_LABELS: Record<Topic, string> = {
  prezentacja: "Umów prezentację",
  materialy: "Poproś o materiały",
  inne: "Mam inne pytanie",
};

const TOPIC_HINTS: Record<Topic, string> = {
  prezentacja:
    "Np. preferowane dni i godziny, czy online czy stacjonarnie, kto dołącza do oglądania.",
  materialy:
    "Np. rzuty, pełna karta oferty, księga wieczysta, dodatkowe zdjęcia - napisz, co chciał(a)byś otrzymać.",
  inne: "Zapytaj o cokolwiek związanego z tą nieruchomością.",
};

function topicFromHash(hash: string): Topic | null {
  const h = hash.replace(/^#/, "").toLowerCase();
  if (h === "kontakt-prezentacja") return "prezentacja";
  if (h === "kontakt-materialy" || h === "kontakt-materiały") return "materialy";
  if (h === "kontakt" || h === "kontakt-inne") return "inne";
  return null;
}

export function OfferContactForm({
  offerTitle,
  refNumber,
  agentName,
  agentEmail,
  agentPhone,
}: {
  offerTitle: string;
  refNumber?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
}) {
  const [topic, setTopic] = useState<Topic>("inne");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const applyFromHash = () => {
      const t = topicFromHash(window.location.hash);
      if (t) setTopic(t);
    };
    applyFromHash();
    window.addEventListener("hashchange", applyFromHash);
    return () => window.removeEventListener("hashchange", applyFromHash);
  }, []);

  const firstNameInstr = firstNameInstrumental(agentName);
  const firstNameGen = firstNameGenitive(agentName);
  const heading = firstNameInstr
    ? `Porozmawiaj z ${firstNameInstr} o tej ofercie`
    : "Porozmawiajmy o tej ofercie";

  return (
    <div className="rounded-[var(--radius-lg)] border border-ink-200/80 bg-white p-7 shadow-[var(--shadow-soft)] ring-1 ring-ink-200/40 md:p-10">
      {sent ? (
        <div className="py-10 text-center md:py-14">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12l5 5L20 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="font-display text-2xl text-ink-950 md:text-3xl">
            Wiadomość wysłana
          </h3>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-600">
            Trafia bezpośrednio do{" "}
            {firstNameGen ? <strong className="text-ink-900">{firstNameGen}</strong> : "biura"}
            . Odezwiemy się zwykle w ciągu kilku godzin w dni robocze.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h3
                className="font-display text-ink-950 tracking-tight leading-tight"
                style={{ fontSize: "clamp(1.45rem, 2.4vw, 1.95rem)" }}
              >
                {heading}
              </h3>
              <p className="mt-2 text-[14.5px] text-ink-600 leading-relaxed">
                <span className="text-ink-500">{offerTitle}</span>
              </p>
            </div>
            {agentPhone && (
              <a
                href={`tel:+48${agentPhone.replace(/\D/g, "")}`}
                className="hidden md:inline-flex items-center gap-2 rounded-full border border-ink-200 bg-paper px-4 py-2 text-[13px] font-medium text-ink-900 transition-colors hover:border-brand-500 hover:text-brand-600"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="text-brand-500">
                  <path
                    d="M11.5 9.8v1.4a1.2 1.2 0 0 1-1.3 1.2 11.8 11.8 0 0 1-5.1-1.8 11.6 11.6 0 0 1-3.6-3.6 11.8 11.8 0 0 1-1.8-5.2 1.2 1.2 0 0 1 1.2-1.3h1.4a1.2 1.2 0 0 1 1.2 1 7.8 7.8 0 0 0 .4 1.8 1.2 1.2 0 0 1-.3 1.2l-.6.6a9.6 9.6 0 0 0 3.6 3.6l.6-.6a1.2 1.2 0 0 1 1.2-.3 7.8 7.8 0 0 0 1.8.4 1.2 1.2 0 0 1 1 1.2Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="tabular-nums">{agentPhone}</span>
              </a>
            )}
          </div>

          <div className="mt-8">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">
              Z czym mamy pomóc?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(TOPIC_LABELS) as Topic[]).map((t) => {
                const active = topic === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    aria-pressed={active}
                    className={[
                      "rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-ink-900 text-white"
                        : "bg-ink-100 text-ink-700 hover:bg-ink-200",
                    ].join(" ")}
                  >
                    {TOPIC_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">
                Imię
              </span>
              <input
                name="name"
                required
                autoComplete="given-name"
                placeholder="np. Anna"
                className="mt-2 w-full rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/80 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">
                Telefon
              </span>
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+48 ..."
                className="mt-2 w-full rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/80 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">
                E-mail <span className="text-ink-400 normal-case tracking-normal">(opcjonalnie)</span>
              </span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="imie@gmail.com"
                className="mt-2 w-full rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/80 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">
                Wiadomość
              </span>
              <textarea
                name="message"
                rows={4}
                placeholder={TOPIC_HINTS[topic]}
                className="mt-2 w-full resize-y rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/80 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
              />
            </label>
          </div>

          <input type="hidden" name="topic" value={topic} />
          <input type="hidden" name="oferta" value={offerTitle} />
          {refNumber && <input type="hidden" name="ref" value={refNumber} />}
          {agentEmail && <input type="hidden" name="agent_email" value={agentEmail} />}
          {agentName && <input type="hidden" name="agent_name" value={agentName} />}

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="order-2 text-[11.5px] leading-relaxed text-ink-500 sm:order-1 sm:max-w-[22rem]">
              Wiadomość trafi
              {firstNameGen ? (
                <>
                  {" "}
                  bezpośrednio do{" "}
                  <strong className="text-ink-700">{firstNameGen}</strong>
                </>
              ) : (
                " do biura"
              )}
              . Wysyłając, zgadzasz się na przetwarzanie danych zgodnie z{" "}
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
              className="order-1 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-ink-900 px-7 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-brand-500 sm:order-2"
            >
              {firstNameGen ? `Wyślij do ${firstNameGen}` : "Wyślij wiadomość"}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M3 7h8M7 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
