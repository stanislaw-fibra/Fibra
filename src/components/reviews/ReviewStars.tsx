/**
 * Pięć gwiazdek z częściowym wypełnieniem proporcjonalnym do oceny (np. 4,7/5).
 * Czysto prezentacyjny, bez hooków - bezpieczny w komponentach serwerowych i klienckich.
 *
 * Oba rzędy (szary spód + złota nakładka) są `absolute inset-0` z identycznym
 * layoutem flex - dzięki temu idealnie się nakładają i szare gwiazdki nie
 * „rozjeżdżają się" względem złotych (uwaga Romana). Nakładkę przycina
 * `overflow-hidden` na szerokość = procent oceny.
 *
 * `aria-hidden`: ocena słowna powinna być podana w tekście obok (np. w aria-label linku).
 */
export function ReviewStars({ rating, size = 18 }: { rating: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span
      className="relative inline-block align-middle"
      style={{ width: size * 5, height: size }}
      aria-hidden
    >
      <span className="absolute inset-0 flex text-ink-300">
        <Stars size={size} />
      </span>
      <span
        className="absolute inset-0 flex overflow-hidden text-[#FBBC04]"
        style={{ width: `${pct}%` }}
      >
        <Stars size={size} />
      </span>
    </span>
  );
}

function Stars({ size }: { size: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill="currentColor"
          className="block shrink-0"
        >
          <path d="M10 1.6l2.47 5.18 5.7.6-4.25 3.86 1.15 5.62L10 14.95l-5.07 2.27 1.15-5.62L2.83 7.38l5.7-.6z" />
        </svg>
      ))}
    </>
  );
}
