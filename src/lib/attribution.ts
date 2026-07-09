// Przechwytywanie i przechowywanie atrybucji marketingowej (gclid + utm).
// Cel: przy wysłaniu leada wiedzieć, z jakiego kliknięcia/kanału przyszedł -
// żeby odesłać konwersję do Google Ads (offline conversion po gclid) i widzieć
// źródło leada w CRM. Działa tylko po stronie klienta (localStorage).

const STORAGE_KEY = "fibra_attribution";

// gclid jest użyteczny dla Google maks. ~90 dni (okno konwersji). Starszej
// atrybucji nie przypisujemy - fałszowałaby wynik.
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

const FIELDS = ["gclid", "utm_source", "utm_medium", "utm_campaign"] as const;
export type Attribution = Partial<Record<(typeof FIELDS)[number], string>>;

type Stored = Attribution & { _ts?: number };

function read(): Stored {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Stored;
    if (parsed?._ts && Date.now() - parsed._ts > MAX_AGE_MS) return {};
    return parsed ?? {};
  } catch {
    return {};
  }
}

/**
 * Odczytuje gclid/utm z bieżącego URL i utrwala (semantyka last-click: nowe
 * wartości nadpisują stare per pole, brak parametru zostawia poprzednią wartość).
 * Wywoływać na każdym wejściu na stronę (patrz AttributionCapture).
 */
export function captureAttributionFromUrl(): void {
  if (typeof window === "undefined") return;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return;
  }
  const fromUrl: Attribution = {};
  for (const key of FIELDS) {
    const v = params.get(key)?.trim();
    if (v) fromUrl[key] = v.slice(0, 512);
  }
  if (Object.keys(fromUrl).length === 0) return; // brak nowych parametrów - nie ruszamy zapisu
  try {
    const merged: Stored = { ...read(), ...fromUrl, _ts: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // brak dostępu do localStorage (np. tryb prywatny) - pomijamy, lead i tak przejdzie
  }
}

/** Zapisana atrybucja gotowa do payloadu leada (bez pól technicznych). */
export function getAttribution(): Attribution {
  const stored = read();
  const out: Attribution = {};
  for (const key of FIELDS) {
    if (stored[key]) out[key] = stored[key];
  }
  return out;
}
