"use client";

import { useState } from "react";

export function OfferAgentMini({ offerTitle }: { offerTitle: string }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="text-[15px] text-ink-600">
        Dziękujemy - oddzwonimy lub odezwiemy się mailowo wkrótce.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col sm:flex-row sm:flex-wrap gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <input type="hidden" name="oferta" value={offerTitle} />
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
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-brand-500"
      >
        Wyślij
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
