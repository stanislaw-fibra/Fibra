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
