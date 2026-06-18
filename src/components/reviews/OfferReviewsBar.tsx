import { REVIEWS, fmtNumber } from "@/lib/reviews-config";
import { ReviewStars } from "./ReviewStars";

/**
 * Kompaktowy, w 100% statyczny pasek „★ 4,7 · 526 opinii klientów" na strony ofert.
 * Bez Elfsight i bez zależności od cookies - zero zewnętrznego skryptu na każdej
 * podstronie oferty i zero ryzyka pustego miejsca. Linkuje do pełnej sekcji opinii
 * na stronie (REVIEWS.onSiteAnchor), żeby zatrzymać usera na serwisie.
 */
export function OfferReviewsBar() {
  return (
    <section className="py-8 md:py-10">
      <div className="container-xl">
        <a
          href={REVIEWS.onSiteAnchor}
          aria-label={`Ocena ${fmtNumber(REVIEWS.rating)} na 5 na podstawie ${fmtNumber(
            REVIEWS.count,
          )} opinii klientów. Zobacz opinie.`}
          className="group mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-ink-200/80 bg-paper-warm px-6 py-3.5 transition-colors hover:border-brand-400"
        >
          <ReviewStars rating={REVIEWS.rating} size={18} />
          <span className="font-display text-[20px] leading-none text-ink-950">
            {fmtNumber(REVIEWS.rating)}
          </span>
          <span aria-hidden className="hidden h-5 w-px bg-ink-200 sm:block" />
          <span className="text-[14px] text-ink-600">
            {fmtNumber(REVIEWS.count)} opinii{" "}
            <span className="font-medium text-ink-900">klientów</span>
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
            className="text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500"
          >
            <path
              d="M3 7h8M7 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
