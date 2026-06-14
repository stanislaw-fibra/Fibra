"use client";

import { useEffect, useState } from "react";
import { priceShort } from "@/lib/offers";
import type { OfferKind } from "@/lib/offers";
import { firstName as getFirstName, firstNameGenitive } from "@/lib/polish-names";
import { AgentAvatar } from "@/components/offers/AgentAvatar";

/**
 * Przyklejony dolny pasek oferty.
 *
 * Układ uzgodniony z klientem (Roman): DANE (cena · powierzchnia · pokoje) są
 * widoczne CAŁY CZAS - to najważniejsze liczby, mają być pod ręką bez scrolla.
 * KONTAKT z agentem (Zapytaj o ofertę + telefon) pojawia się dopiero, gdy user
 * zaczyna scrollować w dół - żeby na samej górze nie bił się o uwagę z
 * autoprezentacją agenta, która jest wysoko w treści.
 */
export function OfferStickyCta({
  priceFrom,
  priceLabel,
  area,
  rooms,
  kind,
  title,
  agentName,
  agentPhone,
  agentPhotoUrl,
}: {
  priceFrom?: number;
  priceLabel?: string;
  area?: number;
  rooms?: number;
  kind?: OfferKind;
  title: string;
  refNumber?: string;
  agentName?: string;
  agentPhone?: string;
  agentPhotoUrl?: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const phoneDisplay = agentPhone || "510 777 200";
  const telHref = `tel:+48${phoneDisplay.replace(/\D/g, "")}`;
  const firstName = getFirstName(agentName);
  const firstNameGen = firstNameGenitive(agentName);
  const areaLabel = kind === "grunt" ? "Działka" : "Pow.";

  return (
    <div
      data-offer-sticky=""
      className={[
        "fixed bottom-0 left-0 right-0 z-40 border-t border-ink-200/90 bg-[var(--color-paper)]/92 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_32px_-12px_rgba(11,15,20,0.12)]",
        // Mobile: pasek widoczny zawsze (cena pod ręką, bo nie ma premium bloku w hero).
        // Desktop (lg): cena jest w premium pasku przy tytule, więc dolny pasek chowamy
        // u góry i pokazujemy dopiero przy scrollu - żeby ta sama cena nie była na ekranie
        // dwa razy (uwaga Romana: "trzy razy te same dane").
        "transition-transform duration-300 ease-out",
        scrolled ? "lg:translate-y-0" : "lg:translate-y-full",
      ].join(" ")}
    >
      <div className="container-xl flex items-center justify-between gap-3 py-2 md:py-2.5">
        {/* Dane - zawsze widoczne */}
        <div className="flex min-w-0 items-baseline gap-2 md:gap-2.5">
          <span className="font-display text-[16px] md:text-[19px] leading-none text-ink-950 whitespace-nowrap">
            {priceFrom ? priceShort(priceFrom) : (priceLabel ?? "Cena na zapytanie")}
          </span>
          {(area != null || rooms != null) && (
            <span className="truncate text-[12px] md:text-[13px] text-ink-500">
              {area != null ? `· ${areaLabel} ${area} m²` : ""}
              {rooms != null ? ` · ${rooms} pok.` : ""}
            </span>
          )}
        </div>

        {/* Kontakt - dochodzi przy scrollu w dół */}
        <div
          aria-hidden={!scrolled}
          className={[
            "flex shrink-0 items-center gap-2 md:gap-3 transition-all duration-300 ease-out",
            scrolled
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0",
          ].join(" ")}
        >
          <a
            href="#kontakt"
            tabIndex={scrolled ? 0 : -1}
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-500 md:px-5"
            aria-label={`Zapytaj o ofertę: ${title}`}
          >
            Zapytaj o ofertę
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="hidden sm:block">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a
            href={telHref}
            tabIndex={scrolled ? 0 : -1}
            className="group hidden items-center gap-2.5 rounded-full border border-ink-200 bg-paper py-1.5 pl-1.5 pr-4 text-[13px] font-medium text-ink-900 transition-colors hover:border-brand-500 hover:text-brand-600 sm:inline-flex md:gap-3 md:pr-5"
            aria-label={firstNameGen ? `Zadzwoń do ${firstNameGen}, ${phoneDisplay}` : `Zadzwoń ${phoneDisplay}`}
          >
            <AgentAvatar
              photoUrl={agentPhotoUrl}
              name={agentName}
              size="sm"
              className="ring-ink-200/80 shadow-[0_2px_6px_-2px_rgba(11,15,20,0.18)]"
            />
            <span className="flex flex-col leading-tight text-left">
              {firstName && (
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 group-hover:text-brand-500/80">
                  {firstName}
                </span>
              )}
              <span className="tabular-nums">{phoneDisplay}</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
