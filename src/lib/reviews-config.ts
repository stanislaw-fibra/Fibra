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
  /** Ocena Google profilu „Grupa Fibra sp. z o.o." (place ChIJ1V-cD3FPEUcRZR3CFhiPUp8). */
  rating: 4.8,
  /** Liczba opinii Google Grupy Fibra. */
  count: 186,
  /**
   * Pełne opinie Google Grupy Fibra - cel przycisku w fallbacku (działa bez zgody
   * na cookies). Standardowy link „wszystkie opinie" dla Place ID wizytówki.
   */
  reviewsUrl: "https://search.google.com/local/reviews?placeid=ChIJ1V-cD3FPEUcRZR3CFhiPUp8",
  /** Kotwica do sekcji opinii na tej stronie - cel paska na ofertach. */
  onSiteAnchor: "/o-fibrze#opinie",
  /** ID widgetu z panelu Elfsight - sam ciąg po `elfsight-app-` (widget Grupy Fibra). */
  elfsightAppId: "2404317a-7b80-470f-a52b-ddb6726f38a8",
} as const;

/** Formatowanie liczb po polsku (przecinek dziesiętny): 4.9 -> „4,9". */
export const fmtNumber = (n: number) => n.toLocaleString("pl-PL");
