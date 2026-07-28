/**
 * Twarde dowody dla inwestora (/zamyslow).
 *
 * Powstało z uwag Romana (mail „Strona Zamysłowa”, 21-22.07.2026):
 * inwestor wydający kilkaset tysięcy złotych szuka dowodów, nie zapewnień -
 * „zarządzamy najmem” działa dużo słabiej niż „zarządzamy X mieszkaniami od Y lat”.
 *
 * WAŻNE: wpisujemy tu wyłącznie liczby, które da się obronić przed klientem.
 * `value: null` = fakt czeka na potwierdzenie i NIE renderuje się na stronie.
 * Wpisanie wartości to jedyna potrzebna zmiana - komponent sam go pokaże.
 */
export type ProofFact = {
  /** Liczba/wartość. `null` = brak potwierdzonych danych, kafelek się nie pokazuje. */
  value: string | null;
  label: string;
};

export const proofFacts: ProofFact[] = [
  // TODO(Roman/Arkadiusz): od ilu lat Fibra prowadzi zarządzanie najmem?
  { value: null, label: "lat doświadczenia w zarządzaniu najmem" },
  // TODO(Roman/Arkadiusz): iloma mieszkaniami zarządzamy dziś?
  { value: null, label: "mieszkań w zarządzaniu" },
  // TODO(Roman/Arkadiusz): ilu inwestorów kupiło u nas mieszkanie?
  { value: null, label: "inwestorów, którzy nam zaufali" },
  { value: "3", label: "wcześniejsze etapy oddane zgodnie z harmonogramem" },
];

/**
 * Pasek pokazuje się dopiero, gdy mamy potwierdzone co najmniej tyle faktów -
 * pojedyncza liczba wygląda jak niedokończona sekcja, a nie jak dowód.
 * Własny dział zarządzania najmem świadomie nie jest tu powtórzony: to jeden
 * z czterech kafelków w sekcji „Inwestujesz dużo pieniędzy”.
 */
export const PROOF_STRIP_MIN_FACTS = 2;

/**
 * Odpowiedź na pytanie „dlaczego spośród wszystkich nowych inwestycji w Rybniku
 * warto wybrać właśnie Osiedle Zamysłów?”. Każdy punkt opiera się na danych,
 * które są już na stronie (rzuty mieszkań, przewodnik inwestora, /wynajem-zamyslow).
 */
export const zamyslowAdvantages = [
  {
    title: "Lokalizacja, którą łatwo sprawdzić",
    body: "3,5 km do rynku w Rybniku, 1,8 km do Drogi Głównej Południowej i szybkiego dojazdu do A1, 800 m do szkoły i 1,2 km do przedszkola. Sklep w bezpośrednim sąsiedztwie, a wokół zielona część miasta.",
  },
  {
    title: "Popyt znamy z tego samego osiedla",
    body: "W sąsiednim budynku na Zamysłowie wynajmujemy mieszkania na bieżąco. Wiemy, ile realnie trwa znalezienie najemcy pod tym adresem i za ile wynajmują się konkretne metraże. Opieramy się na tym, co widzimy u siebie na miejscu.",
  },
  {
    title: "Standard, który skraca szukanie najemcy",
    body: "Mieszkania oddajemy wykończone pod klucz, z łazienką, kuchnią i AGD w cenie. W standardzie klimatyzacja i rolety elektryczne, trzyszybowe okna oraz izolacja do 30 cm, więc najemca płaci niższe rachunki, a lokal jest gotowy do wynajmu od pierwszego dnia.",
  },
  {
    title: "Metraże, które wynajmują się najłatwiej",
    body: "Mieszkania 2- i 3-pokojowe od 27 do 55,5 m², z miejscem postojowym w garażu podziemnym. To właśnie te układy najemcy pracujący wybierają najczęściej.",
  },
];
