import Link from "next/link";
import { priceFormat } from "@/lib/offers";

export function OfferStickyCta({ priceFrom, title }: { priceFrom?: number; title: string }) {
  const href = `/kontakt?temat=oferta&n=${encodeURIComponent(title)}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-200/90 bg-[var(--color-paper)]/92 backdrop-blur-xl shadow-[0_-8px_32px_-12px_rgba(11,15,20,0.12)]">
      <div className="container-xl flex flex-wrap items-center justify-between gap-3 py-3 md:py-3.5">
        <p className="font-display text-[20px] md:text-[24px] text-ink-950 tabular-nums shrink-0">
          {priceFormat(priceFrom)}
        </p>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-500"
          >
            Zapytaj o ofertę
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="tel:+48510777200"
            className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-paper px-5 py-2.5 text-[13px] font-medium text-ink-900 transition-colors hover:border-brand-500 hover:text-brand-600"
          >
            510 777 200
          </a>
        </div>
      </div>
    </div>
  );
}
