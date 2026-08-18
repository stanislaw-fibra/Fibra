// ─────────────────────────────────────────────────────────────────────────────
// Kuchnia na wymiar - opcja dodatkowa do mieszkań w budynku 128G.
//
// Bartosz (17.08.2026): „Dodatkowo możesz zamówić kuchnię i AGD. Tak, kuchnia
// jest dodatkowo płatna" - ma się pokazywać przy KAŻDEJ ofercie mieszkania
// jako opcja, nigdy jako element ceny lokalu. Ceny przygotował Arek
// (arkusz „ceny kuchni 128g"), po jednej dla każdego mieszkania: zabudowa jest
// liczona pod konkretny aneks, więc M2 i M6 mają różne kwoty mimo podobnego
// metrażu.
//
// Docelowo cena ma lecieć z tego samego arkusza Google co reszta danych o
// lokalach (wystarczy kolumna „Cena kuchni" - zamyslow-units.ts już jej szuka).
// Ta tabela jest źródłem na czas, zanim kolumna w arkuszu powstanie: dopóki jej
// nie ma, strona pokazuje kwoty stąd, a gdy Arek doda kolumnę, arkusz wygrywa.
// ─────────────────────────────────────────────────────────────────────────────

/** Cena kuchni dla klienta wg arkusza Arka, w złotych. Klucz = ID mieszkania. */
export const ZAMYSLOW_KITCHEN_PRICES: Record<string, number> = {
  M1: 28821,
  M2: 31378,
  M3: 28821,
  M4: 28821,
  M5: 31023,
  M6: 28771,
  M7: 29803,
  M8: 30397,
  M9: 28821,
  M10: 28821,
  M11: 31023,
  M12: 28771,
  M13: 28821,
  M14: 31378,
  M15: 28821,
  M16: 28821,
  M17: 31023,
  M18: 28771,
  M19: 28821,
  M20: 31378,
  M21: 28821,
  M22: 28821,
  M23: 31023,
  M24: 28771,
  M25: 28821,
  M26: 31378,
  M27: 28821,
  M28: 28821,
  M29: 31023,
  M30: 28771,
  M31: 28821,
  M32: 31378,
  M33: 28821,
  M34: 28821,
  M35: 31023,
  M36: 28771,
};

/** Cena kuchni dla mieszkania („m12" i „M12" działają tak samo). */
export function zamyslowKitchenPrice(unitId: string): number | null {
  return ZAMYSLOW_KITCHEN_PRICES[unitId.trim().toUpperCase()] ?? null;
}

/**
 * 28821 → „28 821" (bez jednostki - „zł" jest osobnym, mniejszym elementem).
 * Separator to spacja NIEROZDZIELAJĄCA (U+00A0), tak jak daje `Intl` dla pl-PL:
 * kwota nigdy nie łamie się w połowie. Świadomie bez `Intl`: ten sam wynik na
 * serwerze i w przeglądarce, więc hydracja nie ma szans się rozjechać.
 */
export function kitchenPriceDigits(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Zdjęcia referencyjne: kuchnie z ukończonego etapu przy Niedobczyckiej 128F.
 * To ten sam materiał, co w galerii lokalu, więc podpisujemy je tak samo -
 * jako zdjęcia poglądowe, nie jako wizualizację konkretnej zabudowy.
 */
export const ZAMYSLOW_KITCHEN_PHOTOS = [
  {
    src: "/wynajem-zamyslow/wnetrza/07.jpg",
    alt: "Kuchnia w mieszkaniu z ukończonego etapu inwestycji przy Niedobczyckiej 128F",
  },
  {
    src: "/wynajem-zamyslow/wnetrza/04.jpg",
    alt: "Aneks kuchenny w salonie - ukończony etap inwestycji przy Niedobczyckiej 128F",
  },
] as const;

/**
 * Hash, który otwiera formularz kontaktowy z wpisanym pytaniem o kuchnię
 * (UnitContact nasłuchuje `hashchange`, tak jak formularz na stronach ofert).
 * Dzięki temu link „Zapytaj o kuchnię" można też wysłać komuś bezpośrednio.
 */
export const KITCHEN_CONTACT_HASH = "kontakt-kuchnia";

/** Wiadomość wstawiana do formularza po kliknięciu „Zapytaj o kuchnię". */
export const KITCHEN_MESSAGE_PREFILL =
  "Proszę o szczegóły kompletnej kuchni z zabudową i AGD do tego mieszkania.";

/**
 * Co wchodzi w cenę kuchni - zakres potwierdzony przez Bartosza (18.08.2026):
 * zabudowa meblowa na wymiar PLUS komplet AGD, wszystko zamontowane
 * i podłączone. Kolejność jak w jego mailu.
 *
 * `icon` wskazuje ikonę w `UnitKitchenOffer` - dodanie pozycji wymaga
 * dorysowania ikony o tym samym kluczu.
 */
export const ZAMYSLOW_KITCHEN_EQUIPMENT = [
  { icon: "fridge", name: "Lodówka z zamrażalnikiem" },
  { icon: "hob", name: "Płyta indukcyjna" },
  { icon: "oven", name: "Piekarnik" },
  { icon: "dishwasher", name: "Zmywarka" },
  { icon: "hood", name: "Okap" },
  { icon: "sink", name: "Zlew z baterią" },
] as const;

/** Marka AGD, z której korzysta inwestor. */
export const ZAMYSLOW_KITCHEN_BRAND = "Kernau";
