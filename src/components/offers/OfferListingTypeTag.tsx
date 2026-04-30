import type { Offer } from "@/lib/offers";

type Variant = "page" | "media-dark" | "media-light";

type Props = {
  listingType?: Offer["listingType"];
  variant?: Variant;
  className?: string;
};

function label(listingType: Offer["listingType"] | undefined): "Wynajem" | "Zakup" {
  return listingType === "wynajem" ? "Wynajem" : "Zakup";
}

/**
 * Jednolity tag transakcji (wynajem / zakup) — strona oferty, katalog wideo, karta galerii.
 */
export function OfferListingTypeTag({ listingType, variant = "page", className = "" }: Props) {
  const text = label(listingType);
  const rent = listingType === "wynajem";

  const base =
    "inline-flex shrink-0 items-center justify-center rounded-full font-medium uppercase tabular-nums";

  if (variant === "page") {
    // Strona oferty — etykieta (label), nie przycisk: subtelne tło, kolorowa kropka
    // i delikatny outline w kolorze marki, aby pozostała czytelna i elegancka.
    return (
      <span
        role="status"
        aria-label={rent ? "Oferta wynajmu" : "Oferta zakupu"}
        className={[
          "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 font-medium uppercase tabular-nums",
          "text-[10.5px] tracking-[0.2em]",
          "border bg-paper",
          rent
            ? "border-accent-400/50 text-accent-600"
            : "border-brand-400/50 text-brand-700",
          className,
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "inline-block h-1.5 w-1.5 rounded-full",
            rent ? "bg-accent-500" : "bg-brand-500",
          ].join(" ")}
        />
        {text}
      </span>
    );
  }

  if (variant === "media-light") {
    return (
      <span
        title={rent ? "Oferta wynajmu" : "Oferta zakupu"}
        className={[
          base,
          "border border-ink-200/70 bg-paper/92 px-2 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[10px] tracking-[0.14em] sm:tracking-[0.16em] text-ink-800 shadow-sm backdrop-blur-sm",
          className,
        ].join(" ")}
      >
        {text}
      </span>
    );
  }

  // media-dark — nad filmem / ciemnym kadrem; lekko, bez „przyciskowego” cienia
  return (
    <span
      title={rent ? "Oferta wynajmu" : "Oferta zakupu"}
      className={[
        base,
        "border border-white/28 bg-black/25 px-2 py-0.5 text-[9px] sm:px-2.5 sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em] text-white/92 backdrop-blur-[6px]",
        className,
      ].join(" ")}
    >
      {text}
    </span>
  );
}
