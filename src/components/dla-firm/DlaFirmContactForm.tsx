"use client";

import Link from "next/link";
import { useState } from "react";
import { submitLead } from "@/lib/leads-client";

// GA4 / Meta Pixel — typujemy minimalnie, żeby nie wymagać deklaracji globalnych.
type Gtag = (cmd: "event", name: string, params?: Record<string, unknown>) => void;
type FbqFn = ((cmd: "track" | "trackCustom", name: string, params?: Record<string, unknown>) => void) & {
  callMethod?: unknown;
};

declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: FbqFn;
  }
}

export function DlaFirmContactForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      id="b2b-form"
      className="bg-white text-ink-900 p-7 md:p-10 rounded-[var(--radius-lg)] shadow-[var(--shadow-cinematic)] ring-1 ring-ink-100/80"
      onSubmit={async (e) => {
        e.preventDefault();
        if (sending) return;
        setError(null);
        setSending(true);
        try {
          const fd = new FormData(e.currentTarget);
          const full_name = String(fd.get("name") || "").trim();
          const company = String(fd.get("company") || "").trim();
          const email = String(fd.get("email") || "").trim();
          const phone = String(fd.get("phone") || "").trim();
          const details = String(fd.get("message") || "").trim();

          // Sklejamy nazwę firmy i treść zapytania w jeden message tag,
          // żeby zachować spójność z istniejącym endpointem /api/leads.
          const messageParts: string[] = [];
          if (company) messageParts.push(`Firma: ${company}`);
          if (details) messageParts.push(details);
          const message = messageParts.join("\n\n") || null;

          await submitLead({
            source: "b2b_page",
            full_name,
            email: email || null,
            phone: phone || null,
            message,
            newsletter_consent: false,
          });

          if (typeof window !== "undefined") {
            window.gtag?.("event", "b2b_form_submit", {
              source: "b2b_page",
              company: company || undefined,
            });
            window.fbq?.("track", "Lead", { source: "b2b_page" });
          }

          setSent(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Nie udało się wysłać. Spróbuj ponownie.");
        } finally {
          setSending(false);
        }
      }}
    >
      {sent ? (
        <div className="py-12 md:py-16 text-center">
          <div className="inline-flex w-14 h-14 md:w-16 md:h-16 items-center justify-center rounded-full bg-brand-500 text-white mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-display text-[28px] md:text-[34px] text-ink-950 leading-tight mb-3">
            Dziękujemy.
          </h3>
          <p className="text-[15px] text-ink-600 max-w-md mx-auto leading-relaxed">
            Zapytanie trafiło do naszego zespołu B2B. Odezwiemy się w ciągu 2 godzin
            roboczych — najczęściej dużo szybciej.
          </p>
          <p className="mt-6 text-[13px] text-ink-500">
            Pilna sprawa?{" "}
            <a href="tel:+48510777200" className="font-medium text-brand-600 hover:text-brand-500">
              510 777 200
            </a>
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Imię i nazwisko" name="name" required placeholder="np. Anna Kowalska" autoComplete="name" />
            <Field label="Firma" name="company" required placeholder="np. Przykładowa Sp. z o.o." autoComplete="organization" />
            <Field label="E-mail służbowy" name="email" type="email" required placeholder="anna@firma.pl" autoComplete="email" />
            <Field label="Telefon" name="phone" type="tel" required placeholder="+48 …" autoComplete="tel" />
          </div>

          <label className="block mt-4">
            <span className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink-500">
              Krótko: ile mieszkań, kiedy, w jakim mieście
            </span>
            <textarea
              name="message"
              rows={4}
              placeholder="np. 2 mieszkania w Rybniku dla inżynierów od 1 lipca, umowa na 12 miesięcy."
              className="mt-2 w-full bg-ink-50 focus:bg-white border border-ink-200 focus:border-brand-500 rounded-[var(--radius-sm)] px-4 py-3 text-[14px] outline-none transition-colors resize-none"
            />
          </label>

          {error ? <p className="mt-4 text-[13px] text-red-600">{error}</p> : null}

          <div className="mt-7 flex flex-wrap items-center gap-4 justify-between">
            <p className="text-[11.5px] text-ink-400 max-w-md leading-relaxed">
              Wysyłając wyrażasz zgodę na kontakt w sprawie zapytania zgodnie z{" "}
              <Link href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-ink-600">
                polityką prywatności
              </Link>
              .
            </p>
            <button
              type="submit"
              disabled={sending}
              className={[
                "inline-flex items-center gap-2 rounded-full text-white px-8 py-3.5 text-[14px] font-medium transition-colors duration-300",
                sending ? "bg-ink-900/70 cursor-wait" : "bg-accent-500 hover:bg-accent-400",
              ].join(" ")}
            >
              {sending ? "Wysyłanie…" : "Wyślij zapytanie"}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <p className="mt-6 text-[12.5px] text-ink-500 leading-relaxed">
            Odpowiadamy w ciągu <strong className="text-ink-700">2 godzin roboczych</strong>.
            W weekend — najpóźniej w poniedziałek rano.
          </p>
        </>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink-500">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="mt-2 w-full bg-ink-50 focus:bg-white border border-ink-200 focus:border-brand-500 rounded-[var(--radius-sm)] px-4 py-3 text-[14px] outline-none transition-colors"
      />
    </label>
  );
}
