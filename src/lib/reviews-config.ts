/**
 * Konfiguracja opinii Google (widget Elfsight „All-in-One Reviews").
 *
 * Trzy miejsca, jedna prawda. Po podmianie tych wartości całość zaczyna działać:
 *   1. `rating` / `count` - statyczny pasek na ofertach + fallback pełnej sekcji.
 *   2. `googleUrl`        - dokąd prowadzi „Zobacz opinie w Google" / klik w pasek.
 *   3. `elfsightAppId`    - ID widgetu z panelu Elfsight (sam ciąg PO `elfsight-app-`).
 *
 * Fallback: gdy `elfsightAppId` jest pusty LUB user nie wyraził zgody na cookies
 * funkcjonalne - pokazujemy statyczną ocenę + przycisk do Google. Nigdy pusto.
 *
 * Liczby aktualizujemy ręcznie raz na jakiś czas - przy wieloletnich opiniach
 * średnia i liczba nie skaczą z dnia na dzień.
 */
export const REVIEWS = {
  /** Ocena ogólna z widgetu (Google + Airbnb + Booking). */
  rating: 4.7,
  /** Łączna liczba opinii w widgecie. */
  count: 526,
  /**
   * Publiczna strona z pełnymi opiniami - cel przycisku w fallbacku (działa
   * bez zgody na cookies). Na razie strona apartamentów, gdzie żyje ten widget.
   */
  reviewsUrl: "https://apartamentyfibra.pl/opinie",
  /** Kotwica do sekcji opinii na tej stronie - cel paska na ofertach. */
  onSiteAnchor: "/o-fibrze#opinie",
  /** ID widgetu z panelu Elfsight - sam ciąg po `elfsight-app-`. */
  elfsightAppId: "bae5b0ef-4bad-4c0e-90b1-48dff44a53b1",
} as const;

/** Formatowanie liczb po polsku (przecinek dziesiętny): 4.9 -> „4,9". */
export const fmtNumber = (n: number) => n.toLocaleString("pl-PL");
