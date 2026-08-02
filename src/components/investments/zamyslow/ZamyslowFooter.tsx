"use client";

import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { GORODO_LINKS } from "@/components/site/Footer";
import {
  useZamyslowExperience,
  ZAMYSLOW_EXPERIENCES,
  type ZamyslowExperience,
} from "@/lib/investments/zamyslow-experience";

/**
 * Dedykowana stopka stron Zamysłowa - domyka użytkownika w tym doświadczeniu,
 * tak samo jak `ZamyslowNav` u góry. Zamiast nawigacji całej Fibry (Oferty /
 * Sprzedaj z Fibrą / O Fibrze) i newslettera: duże CTA „Porozmawiajmy",
 * skróty tylko po podstronach osiedla i kontakt. Część prawna (RODO, cookies,
 * copyright) zostaje wspólna z resztą serwisu.
 *
 * Logo i linki „Mieszkania"/„Umów rozmowę" wracają do właściwego rodzica
 * (/zamyslow lub /osiedle-zamyslow) - strony-rodzice podają `experience`,
 * wspólne podstrony czytają go z sessionStorage.
 */
export function ZamyslowFooter({
  experience,
}: {
  experience?: ZamyslowExperience;
}) {
  const exp = useZamyslowExperience(experience);
  const cfg = ZAMYSLOW_EXPERIENCES[exp];

  const shortcuts: { href: string; label: string }[] = [
    { href: cfg.mieszkania, label: "Mieszkania" },
    { href: "/przewodnik-inwestora", label: "Przewodnik inwestora" },
    { href: "/zarzadzanie-najmem", label: "Zarządzanie najmem" },
    { href: "/galeria-inwestycji", label: "Galeria inwestycji" },
    { href: "/prospekt-informacyjny", label: "Prospekt informacyjny" },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden bg-ink-950 text-ink-200">
      <div className="pointer-events-none absolute inset-0 grad-radial-brand opacity-40" />
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

      <div className="container-xl relative">
        {/* ── Duże CTA - najmocniejszy element stopki ─────────────────── */}
        <div className="grid gap-10 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow eyebrow-on-dark flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-accent-400" />
              Osiedle Zamysłów · Rybnik
            </p>
            <p className="mt-7 max-w-[16ch] font-display fluid-display text-white">
              Porozmawiajmy o Twoim{" "}
              <em className="italic text-accent-400">mieszkaniu.</em>
            </p>
          </div>
          <div className="flex flex-col items-start gap-5 lg:items-end lg:pb-2">
            <Link
              href={cfg.kontakt}
              className="group inline-flex items-center gap-3 rounded-full bg-accent-400 px-9 py-4.5 text-[16px] font-semibold text-ink-950 shadow-[0_18px_44px_-10px_rgba(242,101,34,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              Umów rozmowę
              <svg
                width="16"
                height="16"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <p className="text-[14px] text-white/45">
              albo zadzwoń:{" "}
              <a href="tel:+48510777200" className="font-medium text-white/80 transition-colors hover:text-accent-400">
                510 777 200
              </a>
            </p>
          </div>
        </div>

        <div className="hairline-dark-t" />

        {/* ── Kolumny: kim jesteśmy / skróty osiedla / kontakt ─────────── */}
        <div className="grid gap-10 py-14 md:grid-cols-12 md:gap-16 md:py-16">
          <div className="md:col-span-5">
            <Logo variant="paper" href={cfg.home} />
            <p className="mt-7 max-w-[38ch] text-[14.5px] leading-relaxed text-ink-400">
              Osiedle Zamysłów to inwestycja Grupy Fibra - dewelopera
              z 20-letnim doświadczeniem, z własnym działem zarządzania najmem.
              Budujemy w Rybniku i jesteśmy tu na co dzień.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="eyebrow eyebrow-on-dark mb-5">Osiedle</p>
            <ul className="flex flex-col gap-3 text-[15px]">
              {shortcuts.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-ink-300 transition-colors hover:text-accent-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="eyebrow eyebrow-on-dark mb-5">Kontakt</p>
            <div className="flex flex-col gap-1.5 text-[15px]">
              <a href="tel:+48510777200" className="text-white transition-colors hover:text-accent-400">
                510 777 200
              </a>
              <a href="mailto:biuro@grupafibra.pl" className="text-white transition-colors hover:text-accent-400">
                biuro@grupafibra.pl
              </a>
              <span className="mt-2 text-[13px] text-ink-500">
                Grupa Fibra Sp. z o.o. · ul. Rymera 177, 44-310 Radlin · Pon.–Pt. 8:00–16:00
              </span>
            </div>
            <div className="mt-7 flex items-center gap-3">
              <a
                href="https://www.facebook.com/fibra.radlin"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fibra na Facebooku"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ink-300 transition-colors hover:border-accent-400/60 hover:bg-white/10 hover:text-accent-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.25-1.47 1.54-1.47H16.5V4.4c-.29-.04-1.3-.12-2.47-.12-2.45 0-4.13 1.5-4.13 4.24V10.5H7.5v3h2.4V21h3.6z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/grupa_fibra/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fibra na Instagramie"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ink-300 transition-colors hover:border-accent-400/60 hover:bg-white/10 hover:text-accent-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* ── Pasek prawny - wspólny z resztą serwisu ─────────────────── */}
        <div className="hairline-dark-t flex flex-col gap-6 py-8 text-[12px] text-ink-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <a
              href="https://www.gorodo.pl/certyfikat.php?nip=6423147630"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Certyfikat wdrożenia RODO - GoRODO.pl"
              title="Certyfikat wdrożenia RODO - GoRODO.pl"
              className="shrink-0 transition-transform duration-300 hover:scale-[1.06]"
            >
              <Image
                src="/gorodo_badge.webp"
                alt="Certyfikat wdrożenia RODO - GoRODO.pl"
                width={48}
                height={62}
                className="h-12 w-auto drop-shadow-[0_4px_10px_rgba(0,90,148,0.4)]"
              />
            </a>
            <p>&copy; {new Date().getFullYear()} Fibra Nieruchomości. Wszelkie prawa zastrzeżone.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {GORODO_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link href="/cookies" className="transition-colors hover:text-white">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
