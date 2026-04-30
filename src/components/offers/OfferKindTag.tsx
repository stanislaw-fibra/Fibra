import type { ReactElement } from "react";
import type { OfferKind } from "@/lib/offers";

type Variant = "media-dark" | "media-light" | "page" | "icon-only";

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
 * Ikony kategorii — outline w stylu Lucide / Phosphor: 24px viewBox, stroke 1.6, round joints.
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

/** Dom — klasyczny, szczyt + drzwi. */
const HouseIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 9.6V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.6" />
    <path d="M10 21v-6h4v6" />
  </svg>
);

/** Mieszkanie / blok — wieżowiec z miarowo rozłożonymi oknami. */
const ApartmentIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <rect x="5" y="3" width="14" height="18" rx="1.2" />
    <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" />
    <path d="M11 21v-3h2v3" />
  </svg>
);

/** Penthouse — apartament na szczycie z tarasem. */
const PenthouseIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 21h18" />
    <path d="M5 21V10l7-4 7 4v11" />
    <path d="M9 21v-5h6v5" />
    <path d="M9 13h6" />
  </svg>
);

/** Działka — fragment terenu (mapa / kontur z drzewem). */
const LotIcon = () => (
  <svg {...ICON_PROPS} aria-hidden>
    <path d="M3 19l4-3 5 2 4-4 5 3v3H3z" />
    <path d="M9 11V6m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
  </svg>
);

/** Lokal użytkowy — markiza + witryna sklepowa. */
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
    dot: "bg-emerald-400",
    dark: "border-emerald-300/30 bg-emerald-400/12 text-emerald-100",
    light: "border-emerald-500/35 bg-emerald-50 text-emerald-700",
    page: "border-emerald-400/45 text-emerald-700",
    Icon: HouseIcon,
  },
  apartament: {
    dot: "bg-sky-400",
    dark: "border-sky-300/30 bg-sky-400/12 text-sky-100",
    light: "border-sky-500/35 bg-sky-50 text-sky-700",
    page: "border-sky-400/45 text-sky-700",
    Icon: ApartmentIcon,
  },
  penthouse: {
    dot: "bg-violet-400",
    dark: "border-violet-300/30 bg-violet-400/12 text-violet-100",
    light: "border-violet-500/35 bg-violet-50 text-violet-700",
    page: "border-violet-400/45 text-violet-700",
    Icon: PenthouseIcon,
  },
  grunt: {
    dot: "bg-amber-400",
    dark: "border-amber-300/30 bg-amber-400/12 text-amber-100",
    light: "border-amber-500/35 bg-amber-50 text-amber-700",
    page: "border-amber-500/45 text-amber-700",
    Icon: LotIcon,
  },
  lokal: {
    dot: "bg-stone-400",
    dark: "border-stone-300/30 bg-stone-400/12 text-stone-100",
    light: "border-stone-500/35 bg-stone-50 text-stone-700",
    page: "border-stone-500/45 text-stone-700",
    Icon: ShopIcon,
  },
};

const FALLBACK: KindTone = KIND_TONES.apartament;

/**
 * Mały „chip" typu oferty — jednym spojrzeniem rozróżnia dom / mieszkanie / działkę.
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
          "inline-flex shrink-0 items-center gap-2 rounded-full border bg-paper px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.2em]",
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

  if (variant === "icon-only") {
    // Mała ikonka obok napisu pod filmem — bez chipa, bez tła. Jeden subtelny akcent kategorii.
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

  // media-dark — nad ciemnym kadrem wideo
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
