// Odmiana polskich imion agentów w przypadkach używanych w UI.
// Proste, przewidywalne — brak heurystyk, które mogłyby się pomylić.
// Jeżeli imię nie jest w mapie, zwracamy mianownik (bezpieczny fallback).
// Zawsze zmieniamy wyłącznie imię; nazwisko pozostaje w mianowniku.

type Case = "genitive" | "instrumental" | "vocative" | "accusative";

const DECLENSIONS: Record<string, Record<Case, string>> = {
  arkadiusz: { genitive: "Arkadiusza", instrumental: "Arkadiuszem", vocative: "Arkadiuszu", accusative: "Arkadiusza" },
  barbara: { genitive: "Barbary", instrumental: "Barbarą", vocative: "Barbaro", accusative: "Barbarę" },
  bartosz: { genitive: "Bartosza", instrumental: "Bartoszem", vocative: "Bartoszu", accusative: "Bartosza" },
  beata: { genitive: "Beaty", instrumental: "Beatą", vocative: "Beato", accusative: "Beatę" },
  dariusz: { genitive: "Dariusza", instrumental: "Dariuszem", vocative: "Dariuszu", accusative: "Dariusza" },
  justyna: { genitive: "Justyny", instrumental: "Justyną", vocative: "Justyno", accusative: "Justynę" },
  karina: { genitive: "Kariny", instrumental: "Kariną", vocative: "Karino", accusative: "Karinę" },
  marta: { genitive: "Marty", instrumental: "Martą", vocative: "Marto", accusative: "Martę" },
  piotr: { genitive: "Piotra", instrumental: "Piotrem", vocative: "Piotrze", accusative: "Piotra" },
};

function firstOf(fullName: string | null | undefined): string | undefined {
  const trimmed = fullName?.trim();
  if (!trimmed) return undefined;
  const first = trimmed.split(/\s+/)[0];
  return first || undefined;
}

function decline(fullName: string | null | undefined, form: Case): string | undefined {
  const first = firstOf(fullName);
  if (!first) return undefined;
  const key = first.toLowerCase();
  return DECLENSIONS[key]?.[form] ?? first;
}

/** "Justyna Polok" → "Justyna" */
export function firstName(fullName: string | null | undefined): string | undefined {
  return firstOf(fullName);
}

/** Dopełniacz ("do Justyny", "do Dariusza"). */
export function firstNameGenitive(fullName: string | null | undefined): string | undefined {
  return decline(fullName, "genitive");
}

/** Narzędnik ("z Justyną", "z Dariuszem"). */
export function firstNameInstrumental(fullName: string | null | undefined): string | undefined {
  return decline(fullName, "instrumental");
}

/** Wołacz ("Justyno!", "Dariuszu!"). */
export function firstNameVocative(fullName: string | null | undefined): string | undefined {
  return decline(fullName, "vocative");
}

/** Biernik ("poznaj Justynę", "przez Arkadiusza"). */
export function firstNameAccusative(fullName: string | null | undefined): string | undefined {
  return decline(fullName, "accusative");
}
