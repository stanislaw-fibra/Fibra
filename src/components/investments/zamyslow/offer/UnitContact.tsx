"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { submitLead } from "@/lib/leads-client";
import { useFormGuards, GUARD_NOT_READY_MESSAGE } from "@/components/forms/FormGuards";
import { ZAMYSLOW_PHONE } from "@/lib/investments/zamyslow-data";
import {
  KITCHEN_CONTACT_HASH,
  KITCHEN_MESSAGE_PREFILL,
} from "@/lib/investments/zamyslow-kitchen";
import {
  ZamyslowAgentChip,
  type ZamyslowAgentInfo,
} from "@/components/investments/zamyslow/ZamyslowAgentChip";
import {
  isAvailable,
  type UnitAvailability,
} from "@/lib/investments/zamyslow-status";

/**
 * Sekcja kontaktowa strony oferty. Ten sam pipeline leadów co reszta
 * Zamysłowa (source: investor_zamyslow) - w wiadomości zapisujemy, którego
 * mieszkania dotyczy zapytanie, więc biuro widzi kontekst od razu.
 */
export function UnitContact({
  unitId,
  areaLabel,
  floorLabel,
  availability,
  agent,
}: {
  unitId: string;
  areaLabel: string;
  floorLabel: string;
  availability: UnitAvailability;
  agent?: ZamyslowAgentInfo | null;
}) {
  const forSale = isAvailable(availability);
  const reserved = availability === "reserved";
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { guards, getGuardData, ready } = useFormGuards();

  // „Zapytaj o kuchnię" (panel z opcją dodatkową) prowadzi tu hashem, więc
  // wiadomość jest już napisana - wystarczy zostawić imię i numer. Tego, co
  // użytkownik zdążył wpisać sam, nie nadpisujemy.
  useEffect(() => {
    const applyFromHash = () => {
      const h = window.location.hash.replace(/^#/, "").toLowerCase();
      if (h !== KITCHEN_CONTACT_HASH) return;
      setMessage((m) => (m.trim().length ? m : KITCHEN_MESSAGE_PREFILL));
    };
    applyFromHash();
    window.addEventListener("hashchange", applyFromHash);
    return () => window.removeEventListener("hashchange", applyFromHash);
  }, []);

  return (
    <section
      id="kontakt"
      className="relative scroll-mt-[72px] overflow-hidden bg-ink-950 py-20 text-ink-100 md:py-28"
    >
      {/* Kotwica dla linku „Zapytaj o kuchnię" - sekcja ma już własne id,
          a ten hash dodatkowo wypełnia wiadomość w formularzu. */}
      <span id={KITCHEN_CONTACT_HASH} className="absolute left-0 top-0 scroll-mt-[72px]" aria-hidden />
      <div className="absolute inset-0 grad-radial-brand opacity-70" />
      <div className="container-xl relative">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <p className="eyebrow eyebrow-on-dark mb-8 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-accent-400" />
              {forSale ? `Mieszkanie ${unitId}` : "Porozmawiajmy"}
            </p>
            <h2 className="font-display fluid-display max-w-[16ch] text-white">
              {forSale ? (
                <>
                  Zapytaj o to{" "}
                  <em className="italic text-accent-400">mieszkanie.</em>
                </>
              ) : reserved ? (
                <>
                  To mieszkanie jest{" "}
                  <em className="italic text-accent-400">zarezerwowane.</em>
                </>
              ) : (
                <>
                  To mieszkanie znalazło już{" "}
                  <em className="italic text-accent-400">właściciela.</em>
                </>
              )}
            </h2>
            <p className="mt-6 max-w-[44ch] text-[16px] leading-relaxed text-white/60">
              {forSale
                ? `${unitId} · ${floorLabel} · ${areaLabel.replace(".", ",")}. Zostaw numer - oddzwonimy i odpowiemy na pytania o to mieszkanie.`
                : reserved
                  ? `${unitId} · ${floorLabel} · ${areaLabel.replace(".", ",")}. Zostaw numer - pokażemy dostępne mieszkania o zbliżonym układzie i metrażu.`
                  : "Zostaw kontakt, a pokażemy dostępne mieszkania o zbliżonym układzie i metrażu."}
            </p>

            {/* Co się stanie po wysłaniu - zdjęcie obaw przed pierwszym krokiem.
                Wyłącznie obietnice, które strona składa już gdzie indziej
                (czas oddzwonienia z potwierdzenia, rezerwacja 48 h z Przewodnika). */}
            <ul className="mt-9 flex flex-col gap-3.5 text-[14.5px] text-white/70">
              {[
                "Oddzwaniamy zwykle w kilka godzin w dni robocze",
                "Rozmowa bez zobowiązań - pytasz, sprawdzasz, decydujesz",
                forSale
                  ? "Wybrane mieszkanie możemy zarezerwować dla Ciebie na 48 godzin"
                  : "Podpowiemy, które z dostępnych mieszkań ma najbardziej zbliżony układ",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-400/15 text-accent-400">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2.5 6.5l2.5 2.5 4.5-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {t}
                </li>
              ))}
            </ul>

            {/* Twarz przy formularzu: kto odbierze telefon i oddzwoni. */}
            {agent ? (
              <ZamyslowAgentChip
                agent={agent}
                tone="dark"
                label="Odbierze i oddzwoni"
                className="mt-10 border-t border-white/10 pt-8"
              />
            ) : null}

            <a href={`tel:${ZAMYSLOW_PHONE.tel}`} className={`group ${agent ? "mt-7" : "mt-10"} flex items-center gap-4 text-white`}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/5 transition-colors duration-300 group-hover:bg-accent-400 group-hover:text-ink-950">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.07 2H7a2 2 0 0 1 2 1.72c.13.9.35 1.78.66 2.62a2 2 0 0 1-.45 2.11L7.9 9.77a16 16 0 0 0 6 6l1.32-1.32a2 2 0 0 1 2.11-.45c.84.3 1.72.53 2.62.66A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <span className="block text-[13px] text-white/40">Wolisz zadzwonić?</span>
                <span className="text-[16px]">{ZAMYSLOW_PHONE.display}</span>
              </span>
            </a>
          </div>

          <div className="lg:col-span-7">
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
                    // Kontekst mieszkania zawsze na początku wiadomości.
                    message: `[Mieszkanie ${unitId}, ${floorLabel}, ${areaLabel}${
                      forSale ? "" : reserved ? ", ZAREZERWOWANE" : ", SPRZEDANE"
                    }]${message.length ? ` ${message}` : ""}`,
                    ...getGuardData(),
                  });
                  setSent(true);
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Nie udało się wysłać. Spróbuj ponownie.",
                  );
                } finally {
                  setSending(false);
                }
              }}
            >
              {sent ? (
                <div className="py-16 text-center">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="mb-3 font-display text-[34px] text-ink-950">Dziękujemy.</h3>
                  <p className="mx-auto max-w-sm text-[15px] text-ink-600">
                    Oddzwonimy możliwie szybko - zwykle w ciągu kilku godzin w dni robocze.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Imię" name="name" required placeholder="Anna" />
                    <Field label="Telefon" name="phone" type="tel" required placeholder="+48 ..." />
                  </div>
                  <div className="mt-4">
                    <Field label="E-mail" name="email" type="email" placeholder="anna@przyklad.pl" optional />
                  </div>
                  <div className="mt-4">
                    <label className="block">
                      <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-500">
                        Wiadomość <span className="normal-case tracking-normal text-ink-400">(opcjonalnie)</span>
                      </span>
                      <textarea
                        name="message"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          forSale
                            ? `Np. pytanie o termin odbioru albo rezerwację ${unitId}.`
                            : `Np. szukam czegoś o układzie zbliżonym do ${unitId}.`
                        }
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
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  optional,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
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
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50 px-4 py-3 text-[14px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
      />
    </label>
  );
}
