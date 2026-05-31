/**
 * Domyślne treści dla 3 osób z zespołu Fibry (Bartosz / Justyna / Arek).
 *
 * Powód istnienia:
 *  - klient prosi, żeby panel `/panel/zespol` od razu pokazywał edytowalny tekst
 *    (rola + opis), a nie puste pola - nawet jeśli admin nie odpalił jeszcze
 *    migracji seed (`20260506000200_agents_seed_team.sql`).
 *  - dopóki agent w bazie nie ma jeszcze swojego `bio_long` / `team_role`,
 *    formularz pre-fillujemy tymi wartościami - pierwszy klik „Zapisz" utrwala
 *    je w Supabase i od tego momentu pełna prawda jest w DB.
 *
 * Klucz mapy = `name` z tabeli `agents` znormalizowane do lowercase. Gdy nazwa
 * agenta nie pasuje do żadnego klucza - wracamy do tego, co jest w DB (puste lub nie).
 */

export type TeamDefaults = {
  role: string;
  bio: string;
  /** Czy domyślnie pokazujemy w sekcji „Zespół" na /o-fibrze. */
  isVisible: boolean;
  /** Mniejsze = wyżej. */
  order: number;
};

const FOUNDER_BIO = `Wierzę, że w nieruchomościach – bardziej niż w jakiejkolwiek innej branży – liczy się człowiek i przejrzyste zasady. Tworząc Fibrę przyjąłem prostą dewizę: interesy robi się z ludźmi, a nie na ludziach.

Dziś, po 20 latach na rynku, z dumą patrzę na osiedla, które wybudowaliśmy i setki rodzin, którym pomogliśmy znaleźć ich miejsce na ziemi. Jako praktyk i autor książki „Zarabianie uczciwych pieniędzy", dbam o to, by każdy etap naszej współpracy – od budowy, przez finansowanie, aż po zarządzanie najmem – opierał się na fundamencie zaufania.

Fibra to nie tylko deweloper czy biuro nieruchomości. To zespół specjalistów, którzy biorą pełną odpowiedzialność za Twój komfort i bezpieczeństwo finansowe. Zapraszam Cię do poznania nas bliżej - chociażby przez pryzmat naszych wideo-prezentacji.`;

const JUSTYNA_BIO = `Z branżą nieruchomości i finansów jestem związana od 15 lat. Jako licencjonowany pośrednik i ekspert od kredytów hipotecznych, przeprowadzam moich klientów przez cały proces zakupu i finansowania – bez stresu i „drobnego druczku". Na Osiedlu Zamysłów dbam o bezpieczeństwo wynajmu i spokój właścicieli, zarządzając mieszkaniami od strony formalnej i technicznej. Stawiam na konkret, uczciwość i relacje, bo wierzę, że profesjonalna współpraca nie musi być wyłącznie formalna.

Zapraszam do kontaktu.`;

const AREK_BIO = `Od 9 lat skutecznie łączę świat sprzedaży, najmu i inwestycji. Jako agent 360° nie tylko znajduję nieruchomości, ale pomagam zamieniać metry kwadratowe w realny, stabilny dochód dla moich klientów.

Na Osiedlu Zamysłów odpowiadam za cały cykl życia nieruchomości: od doradztwa przy zakupie mieszkania, po jego późniejszy wynajem i pełną obsługę najemców. Wspieram inwestorów w budowaniu zyskownych portfeli, stawiając na relacje i umiejętność słuchania potrzeb. Moim celem jest Twój zysk i bezpieczeństwo – od kawalerek po hale i magazyny.

Zapraszam do współpracy.`;

/** Klucz mapy = `name` z tabeli `agents` znormalizowane (lowercase, trim). */
const DEFAULTS: Record<string, TeamDefaults> = {
  "bartosz nosiadek": {
    role: "Założyciel, Prezes Zarządu",
    bio: FOUNDER_BIO,
    isVisible: true,
    order: 0,
  },
  "justyna polok": {
    role: "Licencjonowany Pośrednik i Ekspert Kredytowy",
    bio: JUSTYNA_BIO,
    isVisible: true,
    order: 10,
  },
  "arkadiusz jezusek": {
    role: "Agent Nieruchomości | Specjalista ds. Inwestycji",
    bio: AREK_BIO,
    isVisible: true,
    order: 20,
  },
};

/** Kanoniczne pełne imię i nazwisko (zachowane wielkie litery) - używane przy INSERT. */
const CANONICAL_NAMES: Record<string, string> = {
  "bartosz nosiadek": "Bartosz Nosiadek",
  "justyna polok": "Justyna Polok",
  "arkadiusz jezusek": "Arkadiusz Jezusek",
};

export function teamDefaultsFor(name: string | null | undefined): TeamDefaults | undefined {
  if (!name) return undefined;
  return DEFAULTS[name.trim().toLowerCase()];
}

/** Lista wszystkich znanych członków zespołu (do wykrycia, których brakuje w bazie). */
export function listKnownTeamMembers(): { key: string; name: string; defaults: TeamDefaults }[] {
  return Object.keys(DEFAULTS).map((key) => ({
    key,
    name: CANONICAL_NAMES[key] ?? key,
    defaults: DEFAULTS[key],
  }));
}

/** Kanoniczne imię i nazwisko po kluczu (lowercase). */
export function canonicalName(key: string): string | undefined {
  return CANONICAL_NAMES[key.trim().toLowerCase()];
}
