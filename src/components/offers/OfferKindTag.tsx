import type { ReactElement } from "react";
import type { OfferKind } from "@/lib/offers";

type Variant = "media-dark" | "media-light" | "page" | "page-hero" | "icon-only" | "chip-strong";

type Props = {
  kind?: OfferKind;
  /** Etykieta z bazy / fallback (np. „Mieszkanie", „Dom", „Działka", „Kawalerka", „Penthouse"). */
  kindLabel?: string;
  variant?: Variant;
  className?: string;
};

type KindTone = {
  /** Kolor wypełnienia ikony / kropki */
  dot: string;
  /** Tło + obramowanie chipa na ciemnym kadrze */
  dark: string;
  /** Tło + obramowanie chipa na jasnym tle */
  light: string;
  /** Lekka wersja na stronę oferty (jasne tło) */
  page: string;
  Icon: () => ReactElement;
};

/**
 * Ikony kategorii - outline w stylu Lucide / Phosphor: 24px viewBox, stroke 1.6, round joints.
 * Czytelne nawet w mikro-rozmiarze (12–14 px), spójne wagą linii z resztą interfejsu.
 */
const ICON_PROPS = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Dom - klasyczny, szczyt + drzwi. */
const HouseIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 9.6V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.6" />
    <path d="M10 21v-6h4v6" />
  </svg>
);

/** Mieszkanie / blok - wieżowiec z miarowo rozłożonymi oknami. */
const ApartmentIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <rect x="5" y="3" width="14" height="18" rx="1.2" />
    <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" />
    <path d="M11 21v-3h2v3" />
  </svg>
);

/** Penthouse - apartament na szczycie z tarasem. */
const PenthouseIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 21h18" />
    <path d="M5 21V10l7-4 7 4v11" />
    <path d="M9 21v-5h6v5" />
    <path d="M9 13h6" />
  </svg>
);

/** Działka - fragment terenu (mapa / kontur z drzewem). */
const LotIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 19l4-3 5 2 4-4 5 3v3H3z" />
    <path d="M9 11V6m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
  </svg>
);

/** Lokal użytkowy - markiza + witryna sklepowa. */
const ShopIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 9l1.5-4h15L21 9" />
    <path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
    <path d="M9 21v-6h6v6" />
    <path d="M3 9h18" />
  </svg>
);

const KIND_TONES: Record<OfferKind, KindTone> = {
  dom: {
    dot: "bg-emerald-500",
    dark: "border-emerald-300/40 bg-emerald-400/18 text-emerald-50",
    light: "border-emerald-600/45 bg-emerald-50 text-emerald-800",
    page: "border-emerald-500/60 text-emerald-800 bg-emerald-50/80",
    Icon: HouseIcon,
  },
  apartament: {
    dot: "bg-sky-500",
    dark: "border-sky-300/40 bg-sky-400/18 text-sky-50",
    light: "border-sky-600/45 bg-sky-50 text-sky-800",
    page: "border-sky-500/60 text-sky-800 bg-sky-50/80",
    Icon: ApartmentIcon,
  },
  penthouse: {
    dot: "bg-violet-500",
    dark: "border-violet-300/40 bg-violet-400/18 text-violet-50",
    light: "border-violet-600/45 bg-violet-50 text-violet-800",
    page: "border-violet-500/60 text-violet-800 bg-violet-50/80",
    Icon: PenthouseIcon,
  },
  grunt: {
    dot: "bg-amber-500",
    dark: "border-amber-300/40 bg-amber-400/18 text-amber-50",
    light: "border-amber-600/45 bg-amber-50 text-amber-800",
    page: "border-amber-600/55 text-amber-800 bg-amber-50/80",
    Icon: LotIcon,
  },
  lokal: {
    dot: "bg-stone-500",
    dark: "border-stone-300/40 bg-stone-400/18 text-stone-50",
    light: "border-stone-600/45 bg-stone-50 text-stone-800",
    page: "border-stone-600/55 text-stone-800 bg-stone-50/80",
    Icon: ShopIcon,
  },
};

const FALLBACK: KindTone = KIND_TONES.apartament;

/**
 * Mały „chip" typu oferty - jednym spojrzeniem rozróżnia dom / mieszkanie / działkę.
 * Kolor + ikona zapewniają kontrast nad tytułami i nad listing-tagiem (Zakup / Wynajem).
 */
export function OfferKindTag({ kind, kindLabel, variant = "media-dark", className = "" }: Props) {
  const tone = (kind && KIND_TONES[kind]) || FALLBACK;
  const text = kindLabel?.trim() || "";
  if (!text) return null;
  const Icon = tone.Icon;

  const base =
    "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium uppercase tabular-nums backdrop-blur-[6px]";

  if (variant === "media-light") {
    return (
      <span
        className={[
          base,
          "border px-2 py-0.5 text-[9px] sm:px-2.5 sm:text-[10px] tracking-[0.16em]",
          tone.light,
          className,
        ].join(" ")}
        title={text}
      >
        <Icon />
        {text}
      </span>
    );
  }

  if (variant === "page") {
    return (
      <span
        className={[
          "inline-flex shrink-0 items-center gap-2 rounded-full border bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
          tone.page,
          className,
        ].join(" ")}
        title={text}
      >
        <span aria-hidden className={["inline-block h-1.5 w-1.5 rounded-full", tone.dot].join(" ")} />
        {text}
      </span>
    );
  }

  if (variant === "page-hero") {
    // Mocno widoczny chip nad tytułem strony oferty - większy, semibold, z ikoną i kropką.
    // Używany u góry artykułu, żeby od pierwszej sekundy było wiadomo: dom / mieszkanie / działka.
    return (
      <span
        className={[
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-[var(--shadow-soft)]",
          tone.page,
          className,
        ].join(" ")}
        title={text}
      >
        <Icon />
        {text}
      </span>
    );
  }

  if (variant === "chip-strong") {
    // Wyrazisty chip z ikoną nad ciemnym kadrem wideo - wysoki kontrast i czytelna typografia,
    // żeby na karcie 2x2 mobile od razu było widać kategorię (mieszkanie / dom / działka).
    return (
      <span
        className={[
          "inline-flex shrink-0 items-center gap-1 rounded-full border border-white/55 bg-black/65 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-[8px] sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[10.5px] sm:tracking-[0.16em]",
          className,
        ].join(" ")}
        title={text}
      >
        <Icon />
        {text}
      </span>
    );
  }

  if (variant === "icon-only") {
    // Mała ikonka obok napisu pod filmem - bez chipa, bez tła. Jeden subtelny akcent kategorii.
    return (
      <span
        className={["inline-flex shrink-0 items-center justify-center", className].join(" ")}
        title={text}
        aria-label={text}
      >
        <Icon />
      </span>
    );
  }

  // media-dark - nad ciemnym kadrem wideo
  return (
    <span
      className={[
        base,
        "border px-2 py-0.5 text-[9px] sm:px-2.5 sm:text-[10px] tracking-[0.16em] sm:tracking-[0.18em]",
        tone.dark,
        className,
      ].join(" ")}
      title={text}
    >
      <Icon />
      {text}
    </span>
  );
}
