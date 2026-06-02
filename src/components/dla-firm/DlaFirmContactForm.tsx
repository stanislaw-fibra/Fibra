"use client";

import Link from "next/link";
import { useState } from "react";
import { submitLead } from "@/lib/leads-client";

// GA4 / Meta Pixel - typujemy minimalnie, żeby nie wymagać deklaracji globalnych.
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

type Variant = "compact" | "full";

/**
 * Jeden komponent w dwóch wariantach:
 *  - "compact" - wersja w hero (imię + telefon, jedna linia na desktop)
 *  - "full"    - pełniejsza wersja w sekcji kontaktowej (imię, telefon, e-mail, wiadomość)
 *
 * Oba wysyłają lead na `/api/leads` z tagiem `source: b2b_page`.
 */
export function DlaFirmContactForm({
  variant = "full",
  formId = "b2b-form",
  className = "",
}: {
  variant?: Variant;
  formId?: string;
  className?: string;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (variant === "compact") {
    return (
      <form
        id={formId}
        className={`flex flex-col gap-3 ${className}`}
        onSubmit={async (e) => {
          e.preventDefault();
          if (sending) return;
          setError(null);
          setSending(true);
          try {
            const fd = new FormData(e.currentTarget);
            const full_name = String(fd.get("name") || "").trim();
            const phone = String(fd.get("phone") || "").trim();

            await submitLead({
              source: "b2b_page",
              full_name,
              phone: phone || null,
              message: null,
              newsletter_consent: false,
            });

            if (typeof window !== "undefined") {
              window.gtag?.("event", "b2b_form_submit", { source: "b2b_page", variant: "compact" });
              window.fbq?.("track", "Lead", { source: "b2b_page" });
            }
            setSent(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Nie udało się wysłać.");
          } finally {
            setSending(false);
          }
        }}
      >
        {sent ? (
          <div className="rounded-xl bg-white/[0.06] border border-white/15 px-5 py-5 text-white">
            <p className="text-[15px]">Dziękujemy. Oddzwonimy w ciągu dwóch godzin roboczych.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2.5">
              <input
                type="text"
                name="name"
                required
                placeholder="Imię"
                autoComplete="name"
                className="min-h-[52px] rounded-full bg-white text-ink-900 placeholder:text-ink-400 px-5 text-[15px] outline-none focus:ring-2 focus:ring-accent-400"
              />
              <input
                type="tel"
                name="phone"
                required
                placeholder="Telefon"
                autoComplete="tel"
                className="min-h-[52px] rounded-full bg-white text-ink-900 placeholder:text-ink-400 px-5 text-[15px] outline-none focus:ring-2 focus:ring-accent-400"
              />
              <button
                type="submit"
                disabled={sending}
                className={[
                  "min-h-[52px] inline-flex items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-white transition-colors whitespace-nowrap",
                  sending ? "bg-accent-500/70 cursor-wait" : "bg-accent-500 hover:bg-accent-400",
                ].join(" ")}
              >
                {sending ? "Wysyłanie…" : "Oddzwońcie do mnie"}
              </button>
            </div>
            {error ? <p className="text-[13px] text-red-300">{error}</p> : null}
            <p className="text-[12.5px] text-white/55 leading-relaxed">
              Albo zadzwoń teraz:{" "}
              <a href="tel:+48510777200" className="text-white font-medium hover:text-accent-400 transition-colors">
                510 777 200
              </a>
              . Odpowiadamy w ciągu dwóch godzin roboczych.
            </p>
          </>
        )}
      </form>
    );
  }

  return (
    <form
      id={formId}
      className={`bg-white text-ink-900 p-7 md:p-9 rounded-[var(--radius-lg)] shadow-[var(--shadow-cinematic)] ring-1 ring-ink-100/80 ${className}`}
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
            window.gtag?.("event", "b2b_form_submit", { source: "b2b_page", variant: "full" });
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
        <div className="py-12 md:py-14 text-center">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-brand-500 text-white mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-display text-[26px] md:text-[30px] text-ink-950 leading-tight">
            Dziękujemy.
          </h3>
          <p className="mt-3 text-[15px] text-ink-600 max-w-sm mx-auto leading-relaxed">
            Oddzwonimy w ciągu dwóch godzin roboczych.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Imię" name="name" required placeholder="np. Anna" autoComplete="name" />
            <Field label="Telefon" name="phone" type="tel" required placeholder="+48 …" autoComplete="tel" />
            <Field label="E-mail (opcjonalnie)" name="email" type="email" placeholder="anna@firma.pl" autoComplete="email" />
            <Field label="Firma (opcjonalnie)" name="company" placeholder="Nazwa firmy" autoComplete="organization" />
          </div>

          <label className="block mt-4">
            <span className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink-500">
              Wiadomość (opcjonalnie)
            </span>
            <textarea
              name="message"
              rows={3}
              placeholder="Czego potrzebujesz? Ile osób, jakie miasto, kiedy."
              className="mt-2 w-full bg-ink-50 focus:bg-white border border-ink-200 focus:border-brand-500 rounded-[var(--radius-sm)] px-4 py-3 text-[14px] outline-none transition-colors resize-none"
            />
          </label>

          {error ? <p className="mt-4 text-[13px] text-red-600">{error}</p> : null}

          <div className="mt-6 flex flex-wrap items-center gap-4 justify-between">
            <p className="text-[11.5px] text-ink-400 max-w-md leading-relaxed">
              Wysyłając wyrażasz zgodę na kontakt zgodnie z{" "}
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
