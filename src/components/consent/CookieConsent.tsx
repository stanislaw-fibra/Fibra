"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { notifyFibraConsentUpdated, readFibraConsent, writeFibraConsent } from "@/lib/fibra-consent";

type Choice = "all" | "essential";

/** Na tych trasach nie pokazujemy banera - użytkownik czyta dokument bez nakładki i bez „szarego” tła. */
const LEGAL_ROUTES = new Set(["/cookies", "/polityka-prywatnosci", "/regulamin"]);

export function CookieConsent() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<Choice>("all");

  useEffect(() => {
    setMounted(true);
    setOpen(readFibraConsent() === null);
  }, []);

  if (!mounted || !open) return null;
  if (LEGAL_ROUTES.has(pathname)) return null;

  function confirm() {
    writeFibraConsent(choice);
    notifyFibraConsentUpdated();
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-4 sm:pt-4"
      role="region"
      aria-label="Ustawienia plików cookies"
      aria-live="polite"
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-ink-200/90 bg-white p-6 shadow-[0_-8px_40px_-8px_rgba(11,15,20,0.12),0_24px_48px_-20px_rgba(11,15,20,0.18)] sm:p-8">
        <p className="text-center font-display text-xl text-ink-950 sm:text-2xl" id="cookie-consent-title">
          Pliki cookies
        </p>
        <p
          className="mt-4 text-center text-[14px] leading-relaxed text-ink-600 sm:text-[15px]"
          id="cookie-consent-desc"
        >
          Używamy plików cookies, żeby strona działała prawidłowo i żebyśmy mogli analizować ruch. Szczegóły znajdziesz w
          naszej{" "}
          <Link
            href="/cookies"
            className="font-medium text-brand-600 underline decoration-brand-500/35 underline-offset-2 hover:text-brand-500"
          >
            polityce cookies
          </Link>
          .
        </p>

        <fieldset className="mt-6">
          <legend className="sr-only">Zakres plików cookies</legend>
          <div className="flex rounded-full bg-ink-100/90 p-1 ring-1 ring-ink-200/60">
            <button
              type="button"
              role="radio"
              aria-checked={choice === "all"}
              onClick={() => setChoice("all")}
              className={[
                "min-h-[44px] flex-1 rounded-full px-3 text-[13px] font-medium transition-all sm:text-[14px]",
                choice === "all"
                  ? "bg-white text-ink-950 shadow-sm ring-1 ring-ink-200/80"
                  : "text-ink-600 hover:text-ink-900",
              ].join(" ")}
            >
              Wszystkie
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={choice === "essential"}
              onClick={() => setChoice("essential")}
              className={[
                "min-h-[44px] flex-1 rounded-full px-3 text-[13px] font-medium transition-all sm:text-[14px]",
                choice === "essential"
                  ? "bg-white text-ink-950 shadow-sm ring-1 ring-ink-200/80"
                  : "text-ink-600 hover:text-ink-900",
              ].join(" ")}
            >
              Tylko niezbędne
            </button>
          </div>
        </fieldset>

        <button
          type="button"
          onClick={confirm}
          className="mt-5 w-full min-h-[48px] rounded-full bg-ink-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-brand-500"
        >
          Potwierdzam
        </button>
      </div>
    </div>
  );
}
