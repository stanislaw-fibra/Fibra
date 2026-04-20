// Odmiana polskich imion agentów w przypadkach używanych w UI.
// Proste, przewidywalne — brak heurystyk, które mogłyby się pomylić.
// Jeżeli imię nie jest w mapie, zwracamy mianownik (bezpieczny fallback).
// Zawsze zmieniamy wyłącznie imię; nazwisko pozostaje w mianowniku.

type Case = "genitive" | "instrumental" | "vocative";

const DECLENSIONS: Record<string, Record<Case, string>> = {
  arkadiusz: { genitive: "Arkadiusza", instrumental: "Arkadiuszem", vocative: "Arkadiuszu" },
  barbara: { genitive: "Barbary", instrumental: "Barbarą", vocative: "Barbaro" },
  beata: { genitive: "Beaty", instrumental: "Beatą", vocative: "Beato" },
  dariusz: { genitive: "Dariusza", instrumental: "Dariuszem", vocative: "Dariuszu" },
  justyna: { genitive: "Justyny", instrumental: "Justyną", vocative: "Justyno" },
  karina: { genitive: "Kariny", instrumental: "Kariną", vocative: "Karino" },
  marta: { genitive: "Marty", instrumental: "Martą", vocative: "Marto" },
  piotr: { genitive: "Piotra", instrumental: "Piotrem", vocative: "Piotrze" },
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
