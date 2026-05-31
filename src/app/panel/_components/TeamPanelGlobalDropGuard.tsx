"use client";

import { useEffect } from "react";

/**
 * Globalny strażnik drag-and-drop dla strony /panel/zespol.
 *
 * Domyślnie przeglądarka, gdy upuścisz plik POZA dropzone, otwiera go w nowej karcie
 * (browser navigation). Klient zgłosił dokładnie ten objaw: „strona się tylko odświeża".
 * Tutaj na poziomie window nasłuchujemy `dragover` i `drop` i wywołujemy `preventDefault`,
 * jeśli drop NIE odbywa się na elemencie z atrybutem `data-team-dropzone`.
 *
 * Każdy faktyczny dropzone (TeamMemberEditor) przechwytuje swoje własne `drop` i nie pozwala
 * eventowi „uciec" do window - więc upload tam działa normalnie. Window-handler łapie tylko
 * spudłowane drop-y i milczy zamiast pozwolić przeglądarce nawigować.
 */
export function TeamPanelGlobalDropGuard() {
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      // Brak preventDefault by domyślnie powodowało, że drop nie zostanie zaakceptowany
      // nigdzie poza explicit dropzonem - chcemy jednak żeby drop był łapany w naszych zonach,
      // więc dragover preventDefault zawsze, żeby drop był „dozwolony", a w drop decydujemy
      // czy ignorujemy (poza zoną) czy nie (target zona zatrzyma propagację sama).
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      // Jeżeli ten event dotarł do window, znaczy że żaden dropzone go nie zatrzymał -
      // czyli user upuścił plik POZA dropzonem. Blokujemy domyślne otwieranie pliku.
      e.preventDefault();
    };

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return null;
}
