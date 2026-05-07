"use client";

import { useEffect, useRef } from "react";

/**
 * Integracja modali z historią przeglądarki — kluczowe dla UX mobile.
 *
 * Klient zgłosił: po otwarciu galerii / wirtualnego spaceru / filmu YouTube swipe-back
 * (lub przycisk Wstecz) zamiast ZAMYKAĆ modal cofa do poprzedniej strony. Tutaj rozwiązanie:
 *
 *  1. Gdy modal się OTWIERA (isOpen: false → true) — pushujemy nowy entry w history.
 *  2. Gdy user wykona „back" (gest, przycisk, klawiatura) — popstate event firi,
 *     a my wywołujemy `onClose()` zamiast pozwolić nawigacji wyjść z oferty.
 *  3. Gdy modal jest zamykany inaczej (klik X, klik tło, ESC) — robimy `history.back()`,
 *     żeby usunąć nasz pushed entry. Bez tego stack history rośnie nieprawidłowo.
 *
 * Implementacja używa refów do śledzenia, czy MY pushnęliśmy entry (zamiast nakładać się
 * z innymi modalami). Strict Mode-safe: cleanup-and-resetup reusuje pushedRef.
 */
export function useModalHistoryClose(isOpen: boolean, onClose: () => void) {
  // Czy ten konkretny modal pushnął własny entry historii.
  const pushedRef = useRef(false);
  // Najświeższy onClose — żeby popstate listener zawsze miał aktualny callback,
  // bez konieczności re-attach przy każdej zmianie referencji.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isOpen && !pushedRef.current) {
      // Modal otworzony — wstawiamy „znaczek" w historii. Hash jest neutralny, ale
      // gwarantuje nową pozycję w stacku (niektóre przeglądarki łączą sąsiadujące
      // pushState bez zmiany URL).
      pushedRef.current = true;
      try {
        window.history.pushState({ __modalOpen: true }, "");
      } catch {
        // Strict mode SSR / sandbox — ignorujemy, fallback to zachowanie domyślne (X / ESC).
        pushedRef.current = false;
      }
    } else if (!isOpen && pushedRef.current) {
      // Modal zamknięty inaczej niż przez gest „back" — cofamy nasz pushed entry.
      // Najpierw resetujemy flag, żeby popstate listener (który ZARAZ wystrzeli wskutek
      // history.back()) wiedział, że to nasze własne wycofanie i nie wywołał onClose.
      pushedRef.current = false;
      try {
        window.history.back();
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOpen) return;

    const onPopState = () => {
      if (pushedRef.current) {
        // To nasz pushed entry — user nacisnął Wstecz / wykonał gest. Zamiast
        // pozwolić nawigacji wyjść z oferty, zamykamy modal.
        pushedRef.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isOpen]);
}
