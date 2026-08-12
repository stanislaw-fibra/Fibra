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

// Liczby potwierdzone przez klienta (odpowiedź na maila, 31.07.2026).
// Świadomie nie ma tu kafelka o wcześniejszych etapach: klient prosił, żeby nie
// podawać, ile ich było - historia dotrzymywania terminów została jako zdanie
// w Przewodniku Inwestora, bez liczby.
export const proofFacts: ProofFact[] = [
  { value: "17", label: "lat doświadczenia w zarządzaniu najmem" },
  { value: "120+", label: "mieszkań w zarządzaniu" },
  { value: "100+", label: "inwestorów, którzy nam zaufali" },
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
/**
 * @param areaFromToLabel widełki metrażu z arkusza w formie zdania („od 27 do 55,5 m²")
 *   - nigdy nie wpisujemy ich na sztywno, bo arkusz jest jedynym źródłem prawdy.
 *   `null` (arkusz nie odpowiada) = zdanie o metrażach po prostu wypada,
 *   zamiast pokazywać nieaktualną liczbę.
 */
export const buildZamyslowAdvantages = (areaFromToLabel: string | null) => [
  {
    title: "Dobra lokalizacja",
    body: "Spokojna, zielona część Rybnika z szybkim dojazdem do centrum, autostrady A1 i największych zakładów pracy. Bliskość szkoły, przedszkola i sklepu zwiększa komfort mieszkańców, ułatwia wynajem i wspiera wartość mieszkania.",
  },
  {
    title: "Sprawdzony najem",
    body: "To nie prognozy. Na Osiedlu Zamysłów od lat wynajmujemy mieszkania i wiemy, jak wygląda popyt, czas wynajmu oraz stawki dla poszczególnych metraży.",
  },
  {
    title: "Standard, który skraca szukanie najemcy",
    // Kuchnia i AGD to opcja do domówienia, nie element ceny mieszkania -
    // piszemy o nich jako o możliwości, nigdy jako o czymś „w cenie".
    body: "Mieszkania oddajemy wykończone, z gotową łazienką. W standardzie klimatyzacja, rolety elektryczne, trzyszybowe okna oraz izolacja do 30 cm, więc najemca płaci niższe rachunki. Kuchnię i AGD możesz zamówić dodatkowo.",
  },
  {
    // Bez wzmianki o miejscach postojowych: klient potwierdził, że nie są
    // przypisane do mieszkań i do czasu uruchomienia ich sprzedaży nie piszemy
    // o nich na stronie.
    title: "Metraże, które wynajmują się najłatwiej",
    body: areaFromToLabel
      ? `Największym zainteresowaniem cieszą się mieszkania 2- i 3-pokojowe. Na Osiedlu Zamysłów oferujemy lokale o powierzchni ${areaFromToLabel}. Każdy lokal prezentujemy wraz z czytelnym rzutem, dzięki czemu od razu zobaczysz układ pomieszczeń.`
      : "Największym zainteresowaniem cieszą się mieszkania 2- i 3-pokojowe. Każdy lokal prezentujemy wraz z czytelnym rzutem, dzięki czemu od razu zobaczysz układ pomieszczeń.",
  },
];

/**
 * Autoprezentacja założyciela w sekcji „Czy mogę zaufać?".
 *
 * Domyślnie bierzemy film z profilu założyciela w Supabase (ten sam, co na
 * /o-fibrze). Gdy powstanie osobne nagranie pod inwestora, wystarczy wpisać tu
 * jego Cloudflare Stream ID - override wygrywa z bazą. `null` = korzystamy z bazy,
 * a gdy tam też nie ma filmu, blok po prostu się nie pokazuje.
 */
export const FOUNDER_VIDEO_OVERRIDE: string | null = null;

// Miniatura filmu założyciela nie jest już ustawiana tutaj: TeamMemberMedia bierze
// oficjalny portret z bazy (ten na niebieskim tle, ten sam co na /o-fibrze i stronach
// agentów), więc podmiana zdjęcia w panelu przenosi się na miniaturę sama.
