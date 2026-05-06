import type { ReactElement } from "react";
import type { Offer, OfferKind } from "@/lib/offers";

type Variant = "media-dark" | "media-light" | "page";

type Props = {
  kind?: OfferKind;
  kindLabel?: string;
  listingType?: Offer["listingType"];
  variant?: Variant;
  className?: string;
};

const ICON_PROPS = {
  width: 12,
  height: 12,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const HouseIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 9.6V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.6" />
    <path d="M10 21v-6h4v6" />
  </svg>
);
const ApartmentIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <rect x="5" y="3" width="14" height="18" rx="1.2" />
    <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" />
    <path d="M11 21v-3h2v3" />
  </svg>
);
const PenthouseIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 21h18" />
    <path d="M5 21V10l7-4 7 4v11" />
    <path d="M9 21v-5h6v5" />
    <path d="M9 13h6" />
  </svg>
);
const LotIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 19l4-3 5 2 4-4 5 3v3H3z" />
    <path d="M9 11V6m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
  </svg>
);
const ShopIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 9l1.5-4h15L21 9" />
    <path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
    <path d="M9 21v-6h6v6" />
    <path d="M3 9h18" />
  </svg>
);

const KIND_ICON: Record<OfferKind, () => ReactElement> = {
  dom: HouseIcon,
  apartament: ApartmentIcon,
  penthouse: PenthouseIcon,
  grunt: LotIcon,
  lokal: ShopIcon,
};

/** Krótka, zgrabna nazwa kategorii — żeby zawsze zmieściło się w jednej linii nad filmem. */
function shortKindLabel(kind?: OfferKind, kindLabel?: string): string {
  // Skracamy „Mieszkanie" do „Mieszk." i „Penthouse" do „Pent.", żeby na mobilnym kaflu (2x2)
  // chip nie łamał się w drugą linię nawet z „Wynajem" obok.
  if (kind === "apartament") return "Mieszk.";
  if (kind === "penthouse") return "Pent.";
  return (kindLabel || "").trim();
}

function listingShort(listingType: Offer["listingType"] | undefined): string {
  return listingType === "wynajem" ? "Wynajem" : "Zakup";
}

/**
 * Pojedyncza, zwarta pigułka łącząca typ nieruchomości i typ transakcji.
 *
 * Klient zwracał uwagę, że dwa osobne chipy („MIESZKANIE" + „WYNAJEM") razem zasłaniały zbyt dużą
 * część filmu i potrafiły się łamać w dwie linie nawet na desktopie. Tu mamy jeden pasek
 * `[ikona] Mieszk. · Wynajem` — gwarantowana jedna linijka, ~50% mniejszy ślad nad kadrem,
 * a info o typie i transakcji od pierwszej sekundy widoczne.
 *
 * Wariant `media-dark` jest używany na karcie wideo (ciemny kadr — biały tekst, półprzezroczyste tło).
 */
export function OfferTypeListingChip({
  kind,
  kindLabel,
  listingType,
  variant = "media-dark",
  className = "",
}: Props) {
  const shortLabel = shortKindLabel(kind, kindLabel);
  if (!shortLabel) return null;
  const Icon = (kind && KIND_ICON[kind]) || ApartmentIcon;
  const listing = listingShort(listingType);
  const isRent = listingType === "wynajem";
  const ariaLabel = `${kindLabel || shortLabel}, ${isRent ? "wynajem" : "zakup"}`;

  if (variant === "media-light") {
    return (
      <span
        title={ariaLabel}
        aria-label={ariaLabel}
        className={[
          "inline-flex shrink-0 items-center gap-1 rounded-full border border-ink-200/80 bg-paper/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-900 shadow-sm",
          "sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[10.5px] sm:tracking-[0.14em]",
          className,
        ].join(" ")}
      >
        <Icon />
        <span>
          {shortLabel}
          <span aria-hidden className="mx-1 text-ink-500">·</span>
          <span className={isRent ? "text-accent-600" : "text-brand-700"}>{listing}</span>
        </span>
      </span>
    );
  }

  if (variant === "page") {
    return (
      <span
        title={ariaLabel}
        aria-label={ariaLabel}
        className={[
          "inline-flex shrink-0 items-center gap-2 rounded-full border border-ink-300/70 bg-paper px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-900",
          className,
        ].join(" ")}
      >
        <Icon />
        <span>
          {shortLabel}
          <span aria-hidden className="mx-1.5 text-ink-400">·</span>
          <span className={isRent ? "text-accent-600" : "text-brand-700"}>{listing}</span>
        </span>
      </span>
    );
  }

  // media-dark — domyślny wariant nad kadrem wideo. Tłumione tło, biały tekst, kolorowy akcent
  // przy „Zakup"/„Wynajem", żeby od pierwszej sekundy było wiadomo o jaką transakcję chodzi.
  // Na bardzo wąskich kaflach 2x2 (mobile) chip jest celowo zwarty: drobniejszy padding,
  // mniejszy font i kropka jako separator zamiast `·` ze spacjami — zmieści się obok mute buttona.
  return (
    <span
      title={ariaLabel}
      aria-label={ariaLabel}
      className={[
        "inline-flex max-w-full shrink-0 items-center gap-1 rounded-full border border-white/40 bg-black/55 px-1.5 py-[2px] text-[8.5px] font-semibold uppercase tracking-[0.05em] text-white shadow-[0_1px_4px_rgba(0,0,0,0.35)] backdrop-blur-[8px]",
        "sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[10.5px] sm:tracking-[0.12em]",
        className,
      ].join(" ")}
    >
      <Icon />
      <span className="whitespace-nowrap overflow-hidden text-ellipsis">
        {shortLabel}
        <span aria-hidden className="mx-0.5 text-white/55 sm:mx-1">·</span>
        <span className={isRent ? "text-accent-300" : "text-sky-200"}>{listing}</span>
      </span>
    </span>
  );
}
