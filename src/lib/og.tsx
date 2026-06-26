/**
 * Wspólne narzędzia do generowania obrazów Open Graph (`opengraph-image` /
 * `twitter-image`) przez `ImageResponse` z `next/og`.
 *
 * Cel: spójny, markowy podgląd 1200x630 na socjalach (Facebook, WhatsApp,
 * LinkedIn, Slack, X) - zamiast pustego/brzydkiego kadru.
 *
 * Fonty są wbudowane lokalnie (`assets/fonts/*.woff`, subset latin-ext z
 * polskimi znakami), więc render jest deterministyczny i nie zależy od sieci.
 */
import type { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Kanoniczny rozmiar karty OG (proporcja ~1.91:1 oczekiwana przez socjale). */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

/** Kolory marki Fibra (z `globals.css`) - jedno źródło prawdy dla kart OG. */
export const ogColors = {
  navy900: "#001623",
  navy800: "#00273f",
  navy700: "#00365a",
  brand500: "#005a94",
  brand200: "#9cc0e0",
  brand100: "#cde0ef",
  accent: "#f26522",
  accent300: "#f48d54",
  paper: "#fafaf8",
  ink900: "#0b0f14",
  white: "#ffffff",
} as const;

type OgOptions = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>;
type OgFonts = NonNullable<OgOptions["fonts"]>;

let fontsPromise: Promise<OgFonts> | null = null;

/** Wczytuje (raz, z cache) fonty marki do `ImageResponse`. */
export function loadOgFonts(): Promise<OgFonts> {
  if (!fontsPromise) {
    const dir = join(process.cwd(), "assets", "fonts");
    fontsPromise = Promise.all([
      readFile(join(dir, "Inter-Regular.woff")),
      readFile(join(dir, "Inter-SemiBold.woff")),
      readFile(join(dir, "Inter-Bold.woff")),
      readFile(join(dir, "InstrumentSerif-Regular.woff")),
    ]).then(([regular, semibold, bold, serif]): OgFonts => [
      { name: "Inter", data: regular, weight: 400, style: "normal" },
      { name: "Inter", data: semibold, weight: 600, style: "normal" },
      { name: "Inter", data: bold, weight: 700, style: "normal" },
      { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
    ]);
  }
  return fontsPromise;
}

/**
 * Pobiera zdjęcie i zwraca data-URI (base64) do `<img src>` w satori.
 * Przekazanie gotowych bajtów jest pewniejsze niż zdalny URL w renderze OG.
 * Zwraca `null` przy błędzie / braku obrazka - wywołujący robi fallback.
 */
export async function fetchImageDataUri(
  url: string | undefined | null,
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // Zabezpieczenie przed gigantycznym plikiem (limit OG to ~8 MB).
    if (buf.byteLength > 7_500_000) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Skraca tekst do `max` znaków, ucinając na granicy słowa, z wielokropkiem. */
export function clampText(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trim()}…`;
}
