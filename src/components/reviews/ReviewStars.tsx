/**
 * Pięć gwiazdek z częściowym wypełnieniem proporcjonalnym do oceny (np. 4,9/5).
 * Czysto prezentacyjny, bez hooków - bezpieczny w komponentach serwerowych i klienckich.
 * `aria-hidden`: ocena słowna powinna być podana w tekście obok (np. w aria-label linku).
 */
export function ReviewStars({ rating, size = 18 }: { rating: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size * 5, height: size }}
      aria-hidden
    >
      <Row size={size} className="text-ink-300" />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <Row size={size} className="text-[#FBBC04]" />
      </span>
    </span>
  );
}

function Row({ size, className }: { size: number; className: string }) {
  return (
    <span className={`flex ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1.6l2.47 5.18 5.7.6-4.25 3.86 1.15 5.62L10 14.95l-5.07 2.27 1.15-5.62L2.83 7.38l5.7-.6z" />
        </svg>
      ))}
    </span>
  );
}
