// ─────────────────────────────────────────────────────────────────────────────
// Wspólny słownik statusów lokali Zamysłowa.
//
// Moduł jest CELOWO bez `server-only`: te same etykiety i kolory muszą być
// dostępne po stronie serwera (arkusz, strony ofert) i klienta (interaktywny
// rzut piętra, lista mieszkań). Źródłem prawdy jest arkusz Arka - tutaj żyje
// tylko tłumaczenie jego zapisów na jeden, spójny język strony.
//
// Zasada (feedback klienta 08.2026): jeśli lokal nie jest dostępny, nigdzie nie
// pokazujemy jego ceny - w jej miejsce wchodzi „Zarezerwowane" / „Sprzedane".
// ─────────────────────────────────────────────────────────────────────────────

export type UnitAvailability = "available" | "reserved" | "sold";

/**
 * Status pojedynczego lokalu podany do komponentów klienckich.
 * `priceLabel` jest już sformatowany na serwerze („351 000 zł"), a przy
 * rezerwacji/sprzedaży jest `null` - cena nie opuszcza serwera.
 */
export type UnitStatusInfo = {
  availability: UnitAvailability;
  priceLabel: string | null;
};

/** Mapa „M4" → status. Pusta = arkusz nie odpowiedział (nie zgadujemy statusu). */
export type UnitStatusMap = Record<string, UnitStatusInfo>;

/** Jedno brzmienie statusu na całej stronie - niezależnie od zapisu w arkuszu. */
export const AVAILABILITY_LABEL: Record<UnitAvailability, string> = {
  available: "Dostępne",
  reserved: "Zarezerwowane",
  sold: "Sprzedane",
};

/**
 * Arkusz bywa opisowy („Rezerwacja", „Umowa rezerwacyjna", „Sprzedane 09.2026").
 * Tłumaczymy to na trzy stany; wszystko, czego nie rozpoznamy, zostaje dostępne
 * (arkusz zaczyna od pustej komórki, a lokal domyślnie jest w sprzedaży).
 */
export function availabilityFromLabel(label: string): UnitAvailability {
  if (/sprzeda/i.test(label)) return "sold";
  if (/rezerw|umowa/i.test(label)) return "reserved";
  return "available";
}

export const isAvailable = (a: UnitAvailability): boolean => a === "available";

/**
 * Styl plakietki statusu na jasnym tle (lista, karta lokalu, oferta).
 * `chip` niesie też `ring-1` - sam kolor ringu w Tailwindzie ustawia wyłącznie
 * zmienną i nic nie rysuje, więc bez tego obwódka pojawiała się tylko tam,
 * gdzie ktoś dopisał szerokość ręcznie.
 */
export const AVAILABILITY_STYLE: Record<
  UnitAvailability,
  { chip: string; dot: string; text: string }
> = {
  available: {
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  reserved: {
    chip: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/25",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  sold: {
    chip: "bg-ink-100 text-ink-600 ring-1 ring-ink-950/10",
    dot: "bg-ink-400",
    text: "text-ink-600",
  },
};
