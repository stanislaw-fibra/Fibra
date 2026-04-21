"use client";

import { useState } from "react";
import { firstName as getFirstName, firstNameGenitive } from "@/lib/polish-names";
import { submitLead } from "@/lib/leads-client";

export function OfferAgentMini({
  offerId,
  galacticaOfferId,
  offerTitle,
  agentName,
  agentEmail,
}: {
  offerId?: string;
  galacticaOfferId?: string;
  offerTitle: string;
  agentName?: string;
  agentEmail?: string;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstName = getFirstName(agentName);
  const firstNameGen = firstNameGenitive(agentName);

  if (sent) {
    return (
      <p className="text-[15px] text-ink-600">
        Dziękujemy - {firstName ? `${firstName} oddzwoni` : "oddzwonimy"} lub odezwie się mailowo wkrótce.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col sm:flex-row sm:flex-wrap gap-3"
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
            source: "offer_page_mini",
            offer_id: offerId ?? null,
            galactica_offer_id: galacticaOfferId ?? null,
            full_name,
            phone,
            message: "Prośba o kontakt (formularz szybki).",
            newsletter_consent: false,
          });
          setSent(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Nie udało się wysłać. Spróbuj ponownie.");
        } finally {
          setSending(false);
        }
      }}
    >
      <input type="hidden" name="oferta" value={offerTitle} />
      {agentEmail && <input type="hidden" name="agent_email" value={agentEmail} />}
      {agentName && <input type="hidden" name="agent_name" value={agentName} />}
      <input
        name="name"
        required
        placeholder="Imię"
        className="min-w-[140px] flex-1 rounded-[var(--radius-sm)] border border-ink-200 bg-paper px-4 py-3 text-[14px] outline-none focus:border-brand-500"
      />
      <input
        name="phone"
        type="tel"
        required
        placeholder="Telefon"
        className="min-w-[160px] flex-1 rounded-[var(--radius-sm)] border border-ink-200 bg-paper px-4 py-3 text-[14px] outline-none focus:border-brand-500"
      />
      {error ? (
        <p className="text-[13px] text-red-600 sm:basis-full">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={sending}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[13px] font-medium text-white transition-colors",
          sending ? "bg-ink-900/70 cursor-wait" : "bg-ink-900 hover:bg-brand-500",
        ].join(" ")}
      >
        {sending ? "Wysyłanie…" : firstNameGen ? `Wyślij do ${firstNameGen}` : "Wyślij"}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
