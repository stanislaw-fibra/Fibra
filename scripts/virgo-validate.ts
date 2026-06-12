/**
 * Walidacja Fazy 2: pobiera świeże dane z VIRGO, przepuszcza przez parser + mapper
 * i drukuje podsumowanie. NIC nie zapisuje do Supabase.
 *
 * Uruchom:  npx tsx scripts/virgo-validate.ts
 */
import Module from "node:module";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// server-only to runtime-guard Next.js (rzuca przy imporcie poza RSC) - shim dla CLI.
{
  const m = Module as unknown as {
    _resolveFilename: (r: string, ...rest: unknown[]) => string;
    _cache: Record<string, { exports: unknown; id: string; loaded: boolean }>;
  };
  const orig = m._resolveFilename;
  m._resolveFilename = function (request: string, ...rest: unknown[]): string {
    if (request === "server-only") return "fibra-server-only-shim";
    return orig.call(this, request, ...(rest as [])) as string;
  };
  m._cache["fibra-server-only-shim"] = {
    exports: {},
    id: "fibra-server-only-shim",
    loaded: true,
  };
}

async function main() {
  const { getVirgoConfig, loginEx, getOffersXml } = await import("@/lib/importer/virgo-client");
  const { parseVirgoXml } = await import("@/lib/importer/virgo-parser");
  const { mapVirgoOffer } = await import("@/lib/importer/virgo-mapper");

  // Tryb offline: VIRGO_XML_FILE=/ścieżka/xml.xml omija API (przydatne przy rate-limicie).
  let xml: string;
  const fileArg = process.env.VIRGO_XML_FILE;
  if (fileArg) {
    const { readFileSync } = await import("node:fs");
    xml = readFileSync(fileArg, "utf-8");
    console.log(`(offline) źródło: ${fileArg}`);
  } else {
    const cfg = getVirgoConfig();
    const sid = await loginEx(cfg);
    xml = await getOffersXml(sid, cfg);
  }
  const parsed = parseVirgoXml(xml);

  console.log(`appAddress: ${parsed.appAddress}`);
  console.log(`agenci: ${parsed.agents.size}, oddziały: ${parsed.branches.size}`);
  console.log(`oferty: ${parsed.offers.length}, usunięte: ${parsed.deletes.length}`);

  const mapped = parsed.offers.map((o) => mapVirgoOffer(o, parsed.agents));

  const byCat = new Map<string, number>();
  const byType = new Map<string, number>();
  let noPrice = 0,
    noTitle = 0,
    noCity = 0,
    noAgent = 0,
    withYoutube = 0,
    totalImages = 0,
    noImages = 0;
  const rawKeys = new Set<string>();

  for (const m of mapped) {
    byCat.set(m.category, (byCat.get(m.category) ?? 0) + 1);
    byType.set(m.listing_type, (byType.get(m.listing_type) ?? 0) + 1);
    if (m.price === null) noPrice++;
    if (!m.title) noTitle++;
    if (!m.city) noCity++;
    if (!m.agent_name) noAgent++;
    if (m.youtube_url) withYoutube++;
    totalImages += m.image_filenames.length;
    if (m.image_filenames.length === 0) noImages++;
    for (const k of Object.keys(m.raw_params)) rawKeys.add(k);
  }

  console.log("\nkategorie:", Object.fromEntries(byCat));
  console.log("typ:", Object.fromEntries(byType));
  console.log(
    `\nbraki: cena=${noPrice}, tytuł=${noTitle}, miasto=${noCity}, agent=${noAgent}, bez zdjęć=${noImages}`,
  );
  console.log(`youtube: ${withYoutube}, zdjęć łącznie: ${totalImages}`);
  console.log(`\nraw_params - unikalnych kluczy: ${rawKeys.size}`);

  console.log("\n=== PRÓBKA 2 ofert (kluczowe pola) ===");
  for (const m of mapped.slice(0, 2)) {
    console.log({
      id: m.galactica_offer_id,
      category: m.category,
      listing_type: m.listing_type,
      title: m.title,
      price: m.price,
      currency: m.currency,
      area_total: m.area_total,
      area_plot: m.area_plot,
      rooms: m.rooms,
      city: m.city,
      province: m.province,
      lat: m.lat,
      lng: m.lng,
      agent_name: m.agent_name,
      agent_email: m.agent_email,
      youtube_url: m.youtube_url,
      images: m.image_filenames.length,
      firstImage: m.image_filenames[0],
      descPreview: m.description?.slice(0, 90),
    });
  }
}

main().catch((e) => {
  console.error("BŁĄD:", e instanceof Error ? e.stack : e);
  process.exit(1);
});
