"use client";

import Image from "next/image";
import { useState } from "react";
import { AgentAvatar } from "@/components/offers/AgentAvatar";
import { ZAMYSLOW_PHONE } from "@/lib/investments/zamyslow-data";
import type { ZamyslowAgentInfo } from "@/components/investments/zamyslow/ZamyslowAgentChip";
import {
  KITCHEN_CONTACT_HASH,
  ZAMYSLOW_KITCHEN_BRAND,
  ZAMYSLOW_KITCHEN_EQUIPMENT,
  ZAMYSLOW_KITCHEN_PHOTOS,
  kitchenPriceDigits,
} from "@/lib/investments/zamyslow-kitchen";

/**
 * Kuchnia gotowa od pierwszego dnia - opcja dodatkowa przy każdej ofercie.
 *
 * Teksty są wprost od Bartosza (mail 18.08.2026) i nie parafrazujemy ich:
 * cena obejmuje zabudowę na wymiar RAZEM z kompletem AGD marki Kernau,
 * wszystko zamontowane i podłączone. Argument jest inwestorski - krótsza
 * droga od odbioru kluczy do pierwszego najemcy.
 *
 * Forma: ciemny panel, który odcina się od reszty strony (tu kończy się
 * „to masz w mieszkaniu", zaczyna „to możesz domówić"), duża kwota z plusem
 * i etykietą „poza ceną mieszkania", a rozpiska chowa się pod jednym
 * przyciskiem, żeby nie przykryła samego mieszkania.
 */
export function UnitKitchenOffer({
  unitId,
  price,
  agent,
}: {
  unitId: string;
  price: number;
  agent?: ZamyslowAgentInfo | null;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `kuchnia-szczegoly-${unitId.toLowerCase()}`;
  const [hero, second] = ZAMYSLOW_KITCHEN_PHOTOS;

  return (
    <section id="kuchnia" className="scroll-mt-[88px] bg-paper-warm pb-16 md:pb-24">
      <div className="container-xl">
        <div className="overflow-hidden rounded-[var(--radius-xl)] bg-ink-950 text-white shadow-[var(--shadow-cinematic)]">
          <div className="grid lg:grid-cols-12">
            {/* Zdjęcie: na mobile nad treścią, na desktopie z prawej strony. */}
            <div className="relative order-first min-h-[240px] lg:order-last lg:col-span-5 lg:min-h-[460px]">
              <Image
                src={hero.src}
                alt={hero.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
              {/* Zejście w granat od strony tekstu - zdjęcie wtapia się w panel,
                  zamiast być wklejonym prostokątem. Na desktopie przyciemniamy
                  tylko wąski pas przy krawędzi, żeby sama kuchnia była widoczna. */}
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent lg:bg-gradient-to-r lg:from-ink-950 lg:via-ink-950/0 lg:via-28% lg:to-transparent"
              />
            </div>

            <div className="lg:col-span-7">
              <div className="p-8 md:p-10 lg:p-12">
                <p className="eyebrow eyebrow-on-dark flex items-center gap-3">
                  <span className="inline-block h-px w-8 bg-accent-400" />
                  Opcja dodatkowa
                </p>

                {/* Akcent na końcu zdania - tak jak w pozostałych nagłówkach
                    Zamysłowa; kursywa w środku zderzałaby się z następnym słowem. */}
                <h2 className="mt-7 font-display fluid-h2 max-w-[15ch] text-white">
                  Kuchnia gotowa{" "}
                  <em className="italic text-accent-400">od pierwszego dnia.</em>
                </h2>

                <p className="mt-6 max-w-[54ch] text-[16px] leading-relaxed text-white/65">
                  Mieszkanie odbierasz wykończone, z gotową łazienką. Możesz
                  również zamówić przygotowaną specjalnie do tego mieszkania
                  kompletną kuchnię z zabudową meblową i AGD.
                </p>
                <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-white/45">
                  W dniu odbioru wszystko jest już na swoim miejscu, podłączone
                  i działające. Nie musisz szukać stolarza, zamawiać sprzętu ani
                  koordynować kilku wykonawców. Możesz od razu przygotować
                  mieszkanie do wynajmu.
                </p>

                {/* Kwota z plusem: od pierwszego spojrzenia widać, że to dopłata
                    do ceny mieszkania, a nie jej część. */}
                <div className="mt-9 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-white/10 pt-8">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
                      Kuchnia do mieszkania {unitId}
                    </p>
                    <p className="mt-2 font-display text-[clamp(38px,5vw,52px)] leading-none tabular-nums text-accent-400">
                      <span className="mr-1.5 align-middle font-sans text-[0.55em] font-medium text-white/40">
                        +
                      </span>
                      {kitchenPriceDigits(price)}
                      <span className="ml-2 font-sans text-[15px] font-medium tracking-normal text-white/45">
                        zł
                      </span>
                    </p>
                  </div>
                  <p className="mb-1.5 text-[13px] leading-snug text-white/45">
                    poza ceną mieszkania
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Szczegóły (rozwijane) ──────────────────────────────────── */}
          <div
            id={panelId}
            className={[
              "grid transition-[grid-template-rows] duration-500 ease-out",
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            ].join(" ")}
          >
            <div className="overflow-hidden" inert={!open}>
              <div className="border-t border-white/10 px-8 py-10 md:px-10 md:py-12 lg:px-12">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
                  <div className="lg:col-span-7">
                    <h3 className="font-display text-[clamp(21px,2.2vw,27px)] leading-snug text-white">
                      Kompletna kuchnia w jednej cenie
                    </h3>
                    <p className="mt-4 max-w-[54ch] text-[15.5px] leading-relaxed text-white/55">
                      Cena została przygotowana indywidualnie dla tego mieszkania
                      i obejmuje zarówno wykonaną na wymiar zabudowę meblową, jak
                      i komplet wyposażenia:
                    </p>

                    {/* Lista AGD jako kafelki - w akapicie przecinkowym ginęła,
                        a to jest najmocniejszy argument tej oferty. */}
                    <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                      {ZAMYSLOW_KITCHEN_EQUIPMENT.map((item) => (
                        <li
                          key={item.name}
                          className="flex items-center gap-3.5 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] px-4 py-3.5"
                        >
                          <span className="shrink-0 text-accent-400">
                            {EQUIPMENT_ICONS[item.icon]}
                          </span>
                          <span className="text-[14px] leading-snug text-white/85">
                            {item.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-6 max-w-[54ch] text-[14.5px] leading-relaxed text-white/55">
                      Korzystamy ze sprzętu sprawdzonej marki{" "}
                      <span className="text-white/85">{ZAMYSLOW_KITCHEN_BRAND}</span>.
                      Wszystkie urządzenia są zamontowane, podłączone i gotowe do
                      użytkowania.
                    </p>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)]">
                      <Image
                        src={second.src}
                        alt={second.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 34vw"
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-4 text-[12.5px] leading-relaxed text-white/40">
                      Zdjęcia poglądowe kuchni z ukończonego etapu inwestycji
                      przy Niedobczyckiej 128F. Zabudowa w {unitId} powstaje pod
                      wymiary tego mieszkania.
                    </p>
                  </div>
                </div>

                {/* Argument inwestorski - dlatego dostaje własny, szeroki blok. */}
                <div className="mt-12 grid gap-6 border-t border-white/10 pt-10 lg:grid-cols-12 lg:gap-14">
                  <h3 className="max-w-[20ch] font-display text-[clamp(21px,2.2vw,27px)] leading-snug text-white lg:col-span-5">
                    Oszczędzasz czas i szybciej możesz rozpocząć najem
                  </h3>
                  <div className="lg:col-span-7">
                    <p className="max-w-[58ch] text-[15.5px] leading-relaxed text-white/55">
                      Po odbiorze mieszkania nie czeka Cię szukanie stolarza,
                      porównywanie sprzętu AGD, organizowanie dostaw ani umawianie
                      kolejnych ekip.
                    </p>
                    <p className="mt-4 max-w-[58ch] text-[15.5px] leading-relaxed text-white/55">
                      Odbierasz mieszkanie z gotową kuchnią, dzięki czemu droga od
                      odbioru kluczy do pierwszego najemcy jest znacznie krótsza.
                    </p>
                  </div>
                </div>

                {/* Kontakt: ten sam duet co przy formularzu - przycisk do
                    formularza z gotowym pytaniem + numer z twarzą Arka. */}
                <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-5 border-t border-white/10 pt-9">
                  <a
                    href={`#${KITCHEN_CONTACT_HASH}`}
                    onClick={(e) => {
                      // Gdy ten hash już jest w adresie (użytkownik wrócił na
                      // górę i klika drugi raz), przeglądarka nie robi nic -
                      // wtedy przewijamy sami. Pierwsze kliknięcie zostawiamy
                      // przeglądarce, żeby poleciał `hashchange` i formularz
                      // uzupełnił wiadomość.
                      if (window.location.hash !== `#${KITCHEN_CONTACT_HASH}`) return;
                      e.preventDefault();
                      document.getElementById(KITCHEN_CONTACT_HASH)?.scrollIntoView();
                    }}
                    className="inline-flex items-center gap-2.5 rounded-full bg-accent-400 px-7 py-3.5 text-[14px] font-medium text-ink-950 transition-colors duration-300 hover:bg-white"
                  >
                    Zapytaj o kuchnię do {unitId}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <a
                    href={`tel:${ZAMYSLOW_PHONE.tel}`}
                    title={
                      agent
                        ? `${agent.name}, ${agent.role} · ${ZAMYSLOW_PHONE.display}`
                        : ZAMYSLOW_PHONE.display
                    }
                    className="inline-flex items-center gap-2.5 rounded-full border border-white/20 py-3.5 pl-2.5 pr-6 text-[14px] font-medium text-white transition-colors hover:border-white/50"
                  >
                    {agent ? (
                      <AgentAvatar
                        photoUrl={agent.photoUrl}
                        name={agent.name}
                        size="sm"
                        className="!h-7 !w-7 ring-1 ring-white/20"
                      />
                    ) : null}
                    {ZAMYSLOW_PHONE.display}
                  </a>
                  {agent ? (
                    <p className="text-[13px] leading-snug text-white/45">
                      Ceny kuchni prowadzi {agent.name.split(" ")[0]}
                      <span className="block text-white/35">{agent.role}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Belka rozwijająca: pełna szerokość panelu, żeby otwieranie było
              jednym oczywistym ruchem, a nie małym linkiem w rogu. */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            className="group flex w-full items-center justify-between gap-4 border-t border-white/10 px-8 py-5 text-left transition-colors duration-300 hover:bg-white/[0.04] md:px-10 lg:px-12"
          >
            <span className="text-[14.5px] font-medium text-white">
              {open ? "Zwiń ofertę kuchni" : "Zobacz, co obejmuje cena"}
            </span>
            <span
              aria-hidden
              className={[
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-all duration-300",
                open ? "rotate-180 border-accent-400 bg-accent-400 text-ink-950" : "group-hover:border-white/50",
              ].join(" ")}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3.5 5.5L7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Ikony wyposażenia ─────────────────────────────────────────────────────
   Klucze muszą się zgadzać z `icon` w ZAMYSLOW_KITCHEN_EQUIPMENT.          */

const EQUIPMENT_ICONS: Record<string, React.ReactNode> = {
  fridge: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="1.6" width="8" height="12.8" rx="1.4" />
      <path d="M4 6.4h8M6.2 3.6v1.3M6.2 8.2v1.6" />
    </svg>
  ),
  hob: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="3" width="12" height="10" rx="1.4" />
      <circle cx="5.6" cy="6.5" r="1.3" />
      <circle cx="10.4" cy="6.5" r="1.3" />
      <circle cx="5.6" cy="9.9" r="1.3" />
      <circle cx="10.4" cy="9.9" r="1.3" />
    </svg>
  ),
  oven: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="1.4" />
      <path d="M2.4 5.9h11.2M4.8 4.1h1.8" />
      <circle cx="8" cy="9.8" r="2.2" />
    </svg>
  ),
  dishwasher: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="1.4" />
      <path d="M2.4 5.6h11.2M4.6 4h1.6" />
      <path d="M5 8.6c1-.9 2-.9 3 0s2 .9 3 0" />
      <path d="M5 11.1c1-.9 2-.9 3 0s2 .9 3 0" />
    </svg>
  ),
  hood: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6.9 1.6h2.2v3.1H6.9z" />
      <path d="M1.8 8.6 4.5 4.7h7l2.7 3.9H1.8Z" />
      <path d="M3.6 8.6v2.2h8.8V8.6" />
      <path d="M5.4 12.6v1.2M10.6 12.6v1.2" />
    </svg>
  ),
  sink: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1.8 7.6h12.4v1.3a3.6 3.6 0 0 1-3.6 3.6H5.4a3.6 3.6 0 0 1-3.6-3.6V7.6Z" />
      <path d="M8 7.6V5.2a2 2 0 0 1 2-2h1.4" />
      <path d="M11.4 3.2v1.6" />
    </svg>
  ),
};
