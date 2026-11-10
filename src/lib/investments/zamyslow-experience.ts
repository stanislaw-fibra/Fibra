"use client";

import { useEffect, useState } from "react";

/**
 * Dwa równoległe „experience" projektu Zamysłów - dwóch rodziców:
 *  - `investor` → /zamyslow (strona inwestorska),
 *  - `osiedle`  → /osiedle-zamyslow (interaktywny eksplorator dla kupującego).
 *
 * Wspólne podstrony (galeria, prospekt, przewodnik, zarządzanie najmem,
 * „czy inwestycja…") należą do OBU. Żeby użytkownik nie „gubił się" - klik w
 * logo „Fibra" ma wracać do tego rodzica, z którego przyszedł. Kontekst
 * pamiętamy w sessionStorage (per karta), więc URL-e zostają czyste.
 */
export type ZamyslowExperience = "investor" | "osiedle";

type ExperienceConfig = {
  /** Cel logo „Fibra" (nagłówek + stopka). */
  home: string;
  /** Link „Mieszkania" w menu. */
  mieszkania: string;
  /** CTA „Umów rozmowę". */
  kontakt: string;
};

export const ZAMYSLOW_EXPERIENCES: Record<ZamyslowExperience, ExperienceConfig> = {
  investor: {
    home: "/zamyslow",
    mieszkania: "/zamyslow#mieszkania",
    kontakt: "/zamyslow#kontakt",
  },
  osiedle: {
    home: "/osiedle-zamyslow",
    mieszkania: "/osiedle-zamyslow",
    kontakt: "/kontakt",
  },
};

const STORAGE_KEY = "zamyslow_experience";

function isExperience(v: unknown): v is ZamyslowExperience {
  return v === "investor" || v === "osiedle";
}

/** Zapamiętuje aktualnego rodzica (wywoływane przez strony-rodziców). */
export function rememberZamyslowExperience(exp: ZamyslowExperience): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, exp);
  } catch {
    /* prywatny tryb / brak dostępu - trudno, wracamy do domyślnego */
  }
}

/** Odczyt zapamiętanego rodzica; domyślnie `investor` (dotychczasowe zachowanie). */
export function readZamyslowExperience(): ZamyslowExperience {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (isExperience(v)) return v;
  } catch {
    /* jw. */
  }
  return "investor";
}

/**
 * Zwraca aktualny experience dla wspólnej nawigacji/stopki.
 *
 * - Strony-rodzice podają `explicit` (ustawiają i zapamiętują kontekst).
 * - Podstrony nie podają nic → czytamy z sessionStorage (co zapisał rodzic).
 *
 * Startujemy od `investor`, a właściwą wartość ustawiamy w efekcie - dzięki
 * temu render serwerowy i pierwszy render kliencki są zgodne (bez ostrzeżeń
 * hydracji), a menu i tak jest identyczne dla obu wersji.
 */
export function useZamyslowExperience(explicit?: ZamyslowExperience): ZamyslowExperience {
  const [experience, setExperience] = useState<ZamyslowExperience>(
    explicit ?? "investor",
  );

  useEffect(() => {
    if (explicit) {
      rememberZamyslowExperience(explicit);
      setExperience(explicit);
    } else {
      setExperience(readZamyslowExperience());
    }
  }, [explicit]);

  return experience;
}

/**
 * Wejście na Zamysłów z baneru na głównej fibra.pl (prośba Romana z 9.11.2026).
 *
 * Tylko taki gość dostaje w nagłówku Zamysłowa link powrotny na fibra.pl. Ruch z
 * reklam ląduje prosto na /zamyslow, znacznika nie ma i nie widzi wyjścia do
 * katalogu ofert. Logo zostaje przy rodzicu Zamysłowa dla wszystkich.
 */
const FROM_HOME_KEY = "zamyslow_from_home";

/** Wywoływane przy kliknięciu baneru Zamysłowa na stronie głównej. */
export function rememberCameFromHome(): void {
  try {
    sessionStorage.setItem(FROM_HOME_KEY, "1");
  } catch {
    /* jw. - bez sessionStorage link powrotny się po prostu nie pokaże */
  }
}

/** `true`, gdy w tej karcie ktoś wszedł na Zamysłów z baneru. Po hydracji, jak wyżej. */
export function useCameFromHome(): boolean {
  const [fromHome, setFromHome] = useState(false);

  useEffect(() => {
    try {
      setFromHome(sessionStorage.getItem(FROM_HOME_KEY) === "1");
    } catch {
      /* jw. */
    }
  }, []);

  return fromHome;
}
