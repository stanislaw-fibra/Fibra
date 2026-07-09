"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAttributionFromUrl } from "@/lib/attribution";

/**
 * Przechwytuje gclid/utm z URL przy każdym wejściu i zmianie ścieżki, utrwalając
 * je w localStorage - żeby dotrwały do wysłania formularza (patrz submitLead).
 * Nic nie renderuje. Montowany raz, w root layoucie.
 */
export function AttributionCapture() {
  const pathname = usePathname();
  useEffect(() => {
    captureAttributionFromUrl();
  }, [pathname]);
  return null;
}
