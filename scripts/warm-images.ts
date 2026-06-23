/**
 * Wygrzewanie cache zdjęć ("warm-up") - wariant A z planu prędkości galerii.
 *
 * PROBLEM: zdjęcia leżą w Supabase jako oryginały. Przy PIERWSZYM wyświetleniu
 * danego rozmiaru Vercel przerabia oryginał na lekki AVIF "na żywo" - to ten
 * spinner, który zgłaszał Roman. Każdy kolejny raz leci błyskawicznie z cache.
 *
 * TEN SKRYPT: z wyprzedzeniem "odwiedza" każde zdjęcie galerii we wszystkich
 * rozmiarach, których używa strona - tak, że Vercel generuje i zapisuje lekkie
 * wersje ZANIM zrobi to pierwszy klient. Efekt: pierwszy realny gość trafia na
 * gotowe = natychmiast, jak na Otodom.
 *
 * BEZPIECZEŃSTWO (ważne):
 *  - robi WYŁĄCZNIE zapytania GET do publicznego `/_next/image` (ta trasa nie jest
 *    chowana za bramką „wkrótce" - patrz matcher w src/middleware.ts),
 *  - NIE rusza oryginałów, NIE pisze do bazy ani do Storage,
 *  - NIE zmienia jakości - prosi dokładnie o te same warianty (q=90) co przeglądarka,
 *  - jest idempotentny: ponowne uruchomienie tylko sprawdza cache (trafienia = HIT,
 *    nie generują nic na nowo, więc nie kosztują transformacji),
 *  - liczy i pokazuje, ile wariantów faktycznie WYGENEROWano (MISS) - czyli realny
 *    koszt transformacji Vercela, żeby było wiadomo, ile to "zjadło".
 *
 * UŻYCIE:
 *   # produkcja (przed startem działa domena vercel.app, bo /_next/image jest poza bramką):
 *   WARM_SITE_URL=https://fibra-nieruchomosci.vercel.app npx tsx scripts/warm-images.ts
 *
 *   # test na kilku ofertach najpierw:
 *   WARM_SITE_URL=https://fibra-nieruchomosci.vercel.app WARM_LIMIT=3 npx tsx scripts/warm-images.ts
 *
 * OPCJE (env):
 *   WARM_SITE_URL   - adres wdrożonej strony do wygrzania (wymagany w praktyce;
 *                     fallback: NEXT_PUBLIC_SITE_URL z .env.local)
 *   WARM_WIDTHS     - lista szerokości po przecinku (domyślnie 640,828,1080,1200,1920)
 *   WARM_QUALITY    - jakość (domyślnie 90 - zgodnie z galerią; NIE zmieniać bez powodu)
 *   WARM_LIMIT      - ogranicz liczbę ofert (do testu)
 *   WARM_CONCURRENCY- ile równoległych zapytań (domyślnie 6)
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

// Szerokości, których realnie żąda galeria (lightbox pełny + siatka + mini-galeria)
// na typowych telefonach (DPR 2-3) i desktopach. Świadomie pomijamy 2048/3840
// (retina desktop pełnoekranowo) - rzadkie, a oszczędza transformacje.
const DEFAULT_WIDTHS = [640, 828, 1080, 1200, 1920];

function parseWidths(): number[] {
  const raw = process.env.WARM_WIDTHS?.trim();
  if (!raw) return DEFAULT_WIDTHS;
  const ws = raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return ws.length ? ws : DEFAULT_WIDTHS;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub klucza Supabase w .env.local");
    process.exit(1);
  }

  const site = (process.env.WARM_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (!site) {
    console.error(
      "Podaj WARM_SITE_URL (adres wdrożonej strony), np.\n" +
        "  WARM_SITE_URL=https://fibra-nieruchomosci.vercel.app npx tsx scripts/warm-images.ts",
    );
    process.exit(1);
  }
  if (site.includes("localhost") || site.includes("127.0.0.1")) {
    console.error(
      "WARM_SITE_URL wskazuje na localhost - wygrzewanie ma sens TYLKO na wdrożonej " +
        "stronie (Vercel), bo to jego cache wygrzewamy. Podaj domenę produkcyjną.",
    );
    process.exit(1);
  }

  const widths = parseWidths();
  const quality = Number.parseInt(process.env.WARM_QUALITY || "90", 10);
  const limit = process.env.WARM_LIMIT ? Number.parseInt(process.env.WARM_LIMIT, 10) : 0;
  const concurrency = Number.parseInt(process.env.WARM_CONCURRENCY || "6", 10);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Pobierz adresy zdjęć galerii (po ofertach, żeby dało się ograniczyć WARM_LIMIT).
  // PostgREST domyślnie zwraca max 1000 wierszy - paginujemy `.range()`, żeby
  // złapać WSZYSTKIE zdjęcia (inaczej ciche ucięcie ~ofert powyżej 1000 zdjęcia).
  type ImgRow = { offer_id: string; image_url: string | null; order_index: number | null };
  const rows: ImgRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("offer_images")
      .select("offer_id, image_url, order_index")
      .order("offer_id", { ascending: true })
      .order("order_index", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("Błąd pobierania offer_images:", error.message);
      process.exit(1);
    }
    rows.push(...((data as ImgRow[]) ?? []));
    if (!data || data.length < PAGE) break;
  }

  // Grupowanie po ofercie - pozwala ograniczyć liczbę ofert przy teście (WARM_LIMIT).
  const byOffer = new Map<string, string[]>();
  for (const r of rows ?? []) {
    const url = (r.image_url || "").trim();
    if (!url) continue;
    const list = byOffer.get(r.offer_id) || [];
    list.push(url);
    byOffer.set(r.offer_id, list);
  }

  let offerIds = [...byOffer.keys()];
  if (limit > 0) offerIds = offerIds.slice(0, limit);

  const imageUrls: string[] = [];
  for (const id of offerIds) imageUrls.push(...(byOffer.get(id) || []));
  // Deduplikacja na wszelki wypadek.
  const uniqueImages = [...new Set(imageUrls)];

  const tasks: { src: string; w: number }[] = [];
  for (const src of uniqueImages) {
    for (const w of widths) tasks.push({ src, w });
  }

  console.log("== Wygrzewanie cache zdjęć (wariant A) ==");
  console.log(`Strona:        ${site}`);
  console.log(`Oferty:        ${offerIds.length}${limit ? ` (limit ${limit})` : ""}`);
  console.log(`Zdjęcia:       ${uniqueImages.length}`);
  console.log(`Szerokości:    ${widths.join(", ")}`);
  console.log(`Jakość:        ${quality}`);
  console.log(`Zapytań razem: ${tasks.length} (równolegle: ${concurrency})`);
  console.log("");

  let done = 0;
  let generated = 0; // MISS - faktycznie wygenerowane (koszt transformacji)
  let cached = 0; // HIT - już było gotowe
  let errors = 0;
  const start = Date.now();

  async function warmOne(t: { src: string; w: number }) {
    const url = `${site}/_next/image?url=${encodeURIComponent(t.src)}&w=${t.w}&q=${quality}`;
    try {
      const res = await fetch(url, {
        headers: {
          // Udajemy nowoczesną przeglądarkę, żeby Vercel wygenerował wariant AVIF
          // (ten, który realnie dostają użytkownicy).
          Accept: "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
          "User-Agent": "FibraImageWarmer/1.0",
        },
      });
      if (!res.ok) {
        errors++;
        if (errors <= 10) console.warn(`  ! ${res.status} ${url}`);
      } else {
        const cacheState = (res.headers.get("x-vercel-cache") || "").toUpperCase();
        if (cacheState === "HIT") cached++;
        else generated++; // MISS/STALE/REVALIDATED/brak nagłówka => potraktuj jako świeże
      }
      // Zwolnij ciało, żeby nie trzymać połączeń.
      await res.arrayBuffer().catch(() => undefined);
    } catch (e) {
      errors++;
      if (errors <= 10) console.warn(`  ! błąd sieci: ${(e as Error).message}`);
    } finally {
      done++;
      if (done % 50 === 0 || done === tasks.length) {
        const pct = ((done / tasks.length) * 100).toFixed(0);
        process.stdout.write(
          `\r  postęp: ${done}/${tasks.length} (${pct}%) · wygenerowane: ${generated} · z cache: ${cached} · błędy: ${errors}   `,
        );
      }
    }
  }

  // Prosty pool współbieżności.
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const idx = cursor++;
      await warmOne(tasks[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));

  const secs = ((Date.now() - start) / 1000).toFixed(1);
  console.log("\n");
  console.log("== Gotowe ==");
  console.log(`Czas:              ${secs}s`);
  console.log(`Wygenerowane (MISS): ${generated}  <- realny koszt transformacji Vercela`);
  console.log(`Z cache (HIT):       ${cached}  <- już było gotowe, zero kosztu`);
  console.log(`Błędy:               ${errors}`);
  if (errors > 0) {
    console.log(
      "\nUWAGA: były błędy. Jeśli to 403/redirect - sprawdź, czy /_next/image nie jest " +
        "chowane za bramką (powinno być wykluczone w matcherze middleware).",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
