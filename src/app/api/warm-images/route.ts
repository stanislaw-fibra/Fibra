import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isCronOrAdminAuthorized } from "@/lib/importer/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Hobby = 60s, Pro = 300s.
export const maxDuration = 300;

/**
 * Automatyczne „wygrzewanie" cache zdjęć - wariant A z planu prędkości galerii.
 *
 * PO CO: `next/image` (Vercel) przerabia oryginał z Supabase na lekki AVIF dopiero
 * przy PIERWSZYM żądaniu danego rozmiaru (zimny transform = spinner, który zgłaszał
 * Roman). Ten endpoint z wyprzedzeniem prosi o gotowe warianty, żeby pierwszy realny
 * gość trafiał już na cache - jak na Otodom.
 *
 * KOSZT / „żeby nie płacić" (ważne):
 *  - DOMYŚLNIE wygrzewa TYLKO zdjęcia dodane w ostatnich `windowHours` godzinach
 *    (czyli świeżo zaimportowane). Stare, już wygrzane zdjęcia NIE są w ogóle
 *    odpytywane - zero żądań, zero kosztu.
 *  - Transformacja powstaje wyłącznie dla NOWEGO zdjęcia - a takie i tak musiałoby
 *    się przetworzyć przy pierwszej wizycie klienta. Wygrzewanie tylko przesuwa to
 *    w czasie, nie dokłada kosztu w skali miesiąca.
 *  - Ponowne wejście na to samo zdjęcie = trafienie w cache (HIT) = darmowe. Dlatego
 *    nakładające się okna (cron co kilka godzin) nie generują podwójnego kosztu.
 *  - Twardy limit `maxImages` na jedno uruchomienie chroni przed niespodzianką przy
 *    dużym backfillu.
 *
 * PARAMETRY (query):
 *  - windowHours (domyślnie 26) - jak świeże zdjęcia wygrzewać; cron dzienny + zapas.
 *  - all=1        - wygrzej WSZYSTKIE zdjęcia (ręczny pełny przebieg; ignoruje window).
 *  - widths       - lista szerokości po przecinku (domyślnie 640,828,1200 - mobile).
 *  - quality      - jakość (domyślnie 90, zgodnie z galerią).
 *  - maxImages    - limit zdjęć na uruchomienie (domyślnie 1500).
 *  - concurrency  - równoległość (domyślnie 8).
 *
 * AUTORYZACJA: ta sama co import (CRON_SECRET dla crona Vercela / IMPORT_SECRET /
 * zalogowany admin panelu).
 */

const DEFAULT_WIDTHS = [640, 828, 1200];

async function handle(req: Request) {
  if (!(await isCronOrAdminAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const origin = url.origin; // wygrzewamy cache TEGO wdrożenia (cron strzela w swoją domenę)

  const all = url.searchParams.get("all") === "1";
  const windowHours = clampInt(url.searchParams.get("windowHours"), 26, 1, 24 * 30);
  const quality = clampInt(url.searchParams.get("quality"), 90, 1, 100);
  const maxImages = clampInt(url.searchParams.get("maxImages"), 1500, 1, 100000);
  const concurrency = clampInt(url.searchParams.get("concurrency"), 8, 1, 20);
  const widths = parseWidths(url.searchParams.get("widths"));

  try {
    const supabase = createSupabaseAdmin();

    // Pobierz adresy zdjęć (paginacja - PostgREST domyślnie tnie do 1000).
    const images: string[] = [];
    const PAGE = 1000;
    const sinceIso = new Date(Date.now() - windowHours * 3600_000).toISOString();
    for (let from = 0; ; from += PAGE) {
      let q = supabase
        .from("offer_images")
        .select("image_url")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (!all) q = q.gte("created_at", sinceIso);
      const { data, error } = await q;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      for (const r of data ?? []) {
        const u = (r.image_url || "").trim();
        if (u) images.push(u);
      }
      if (!data || data.length < PAGE) break;
      if (images.length >= maxImages) break;
    }

    const uniqueImages = [...new Set(images)].slice(0, maxImages);

    const tasks: { src: string; w: number }[] = [];
    for (const src of uniqueImages) for (const w of widths) tasks.push({ src, w });

    let generated = 0;
    let cached = 0;
    let errors = 0;
    const start = Date.now();

    async function warmOne(t: { src: string; w: number }) {
      const target = `${origin}/_next/image?url=${encodeURIComponent(t.src)}&w=${t.w}&q=${quality}`;
      try {
        const res = await fetch(target, {
          headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
        });
        if (!res.ok) {
          errors++;
        } else {
          const state = (res.headers.get("x-vercel-cache") || "").toUpperCase();
          if (state === "HIT") cached++;
          else generated++;
        }
        await res.arrayBuffer().catch(() => undefined);
      } catch {
        errors++;
      }
    }

    let cursor = 0;
    async function worker() {
      while (cursor < tasks.length) {
        const idx = cursor++;
        await warmOne(tasks[idx]);
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));

    return NextResponse.json({
      ok: true,
      scope: all ? "all" : `last ${windowHours}h`,
      images: uniqueImages.length,
      widths,
      quality,
      requests: tasks.length,
      generated, // MISS - realny koszt transformacji
      cached, // HIT - darmowe
      errors,
      seconds: Math.round((Date.now() - start) / 100) / 10,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function clampInt(raw: string | null, def: number, min: number, max: number): number {
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function parseWidths(raw: string | null): number[] {
  if (!raw) return DEFAULT_WIDTHS;
  const ws = raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0 && n <= 4096);
  return ws.length ? ws : DEFAULT_WIDTHS;
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
