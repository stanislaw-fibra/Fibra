import "server-only";
import { promises as fs } from "node:fs";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getImage2,
  getOfferListXml,
  getOffersXml,
  getVirgoConfig,
  loginEx,
  parseOfferListSymbols,
  type VirgoConfig,
} from "./virgo-client";
import { parseVirgoXml } from "./virgo-parser";
import { mapVirgoOffer } from "./virgo-mapper";
import { upsertAgent } from "./agent-sync";
import { deactivateMissingFromFullExport, deactivateOffer, upsertOffer } from "./offer-sync";
import {
  syncOfferImagesLazy,
  syncOfferFloorplansFromGallery,
  type LazyImageInput,
} from "./image-uploader";
import type { ImportSummary, SourceBranch } from "./run-import";

// Orkiestrator importu z VIRGO API. Świadomie ODDZIELNY od runImport (FTP): tam źródłem jest
// jeden ZIP z XML-em i wszystkimi zdjęciami, tu zdjęcia ciągniemy pojedynczo (GetImage2) i
// API ostro limituje zapytania. Downstream (upsertAgent / upsertOffer / sync zdjęć / reconcile)
// jest TEN SAM, dzięki czemu strona i panel pracują na identycznych danych co przy FTP.
//
// Trzy tryby pracy:
//  - SEED (importType "full", localXmlPath = zapisany xml.xml): zasiew bazy z pełnego eksportu.
//  - DIFF (importType "diff", API): GetOffers zwraca tylko zmiany (feed przyrostowy).
//  - RECONCILE (reconcile=true): GetOfferList daje pełną listę Symbol-i -> wygaszamy te, których
//    już nie ma w VIRGO (raz dziennie; GetOffers nie nadaje się, bo jest przyrostowy).

export interface VirgoRunOptions {
  // Wpływa na import_runs.import_type oraz na to, którego endpointu używamy przy źródle live.
  importType?: "full" | "diff";
  // Offline: czytaj zapisany xml.xml zamiast wołać GetOffers (seed z zapisanego kompletu).
  // GetOffers jest przyrostowy i stanowy - ponowne wołanie "zużywa" watermark, więc do seedu
  // używamy zapisanego pliku, a nie kolejnego strzału do API.
  localXmlPath?: string;
  // Pomiń zdjęcia (sam upsert ofert - szybkie testy).
  skipImages?: boolean;
  // Bezpiecznik rate-limitu GetImage2: max NOWYCH zdjęć pobranych w jednym runie. Reszta
  // dociągnie się w kolejnych runach (brak bufora = pominięcie, nie błąd). 0/undefined = bez limitu.
  maxImagesPerRun?: number;
  // Odstęp (ms) między kolejnymi GetImage2 - chroni przed "TOO MANY REQUESTS".
  imageDelayMs?: number;
  // Dry-run: parsuj + raportuj, nic nie zapisuj do Supabase ani nie pobieraj zdjęć.
  dryRun?: boolean;
  sourceBranch?: SourceBranch;
  // Po imporcie zrób reconcile z GetOfferList (wygaś Symbol-e, których już nie ma w VIRGO).
  reconcile?: boolean;
}

const DEFAULT_IMAGE_DELAY_MS = 250;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runVirgoImport(opts: VirgoRunOptions = {}): Promise<ImportSummary> {
  const started = Date.now();
  const supabase = createSupabaseAdmin();
  const sourceBranch = (opts.sourceBranch ?? "unknown").trim() || "unknown";
  const importType: "full" | "diff" = opts.importType ?? (opts.localXmlPath ? "full" : "diff");

  const summary: ImportSummary = {
    runId: null,
    status: "success",
    source_filename: null,
    import_type: importType,
    offers_created: 0,
    offers_updated: 0,
    offers_deleted: 0,
    offers_skipped: 0,
    agents_created: 0,
    images_imported: 0,
    images_deleted: 0,
    floorplans_imported: 0,
    errors: [],
    duration_ms: 0,
  };

  // 1. Zdobądź XML (+ sesję do zdjęć/reconcile, jeśli będą potrzebne).
  let cfg: VirgoConfig | null = null;
  let sid: string | null = null;
  let xml: string;

  const needImages = !opts.skipImages && !opts.dryRun;
  const needLiveXml = !opts.localXmlPath;
  const needLogin = needLiveXml || needImages || (opts.reconcile === true && !opts.dryRun);

  try {
    if (needLogin) {
      cfg = getVirgoConfig();
      sid = await loginEx(cfg);
    }
    if (opts.localXmlPath) {
      xml = await fs.readFile(opts.localXmlPath, "utf-8");
      summary.source_filename = opts.localXmlPath.split("/").pop() ?? opts.localXmlPath;
    } else {
      xml =
        importType === "full"
          ? await getOfferListXml(sid!, cfg!)
          : await getOffersXml(sid!, cfg!);
      summary.source_filename = importType === "full" ? "VIRGO GetOfferList" : "VIRGO GetOffers";
    }
  } catch (e) {
    summary.status = "failed";
    summary.message = `Błąd źródła VIRGO: ${errMsg(e)}`;
    summary.duration_ms = Date.now() - started;
    return summary;
  }

  // 2. Parse
  let parsed;
  try {
    parsed = parseVirgoXml(xml);
  } catch (e) {
    summary.status = "failed";
    summary.message = `Błąd parsowania VIRGO XML: ${errMsg(e)}`;
    summary.duration_ms = Date.now() - started;
    return summary;
  }

  // 3. Log startu w import_runs (źródło = "virgo" w source_branch? nie - zostawiamy branch).
  if (!opts.dryRun) {
    summary.runId = await logRunStart(supabase, summary, sourceBranch);
  }

  // 4. Oferty (+ agent + zdjęcia)
  let imagesFetchedThisRun = 0;
  const imageCap = opts.maxImagesPerRun ?? 0; // 0 = bez limitu
  const imageDelay = opts.imageDelayMs ?? DEFAULT_IMAGE_DELAY_MS;

  for (const node of parsed.offers) {
    let mapped;
    try {
      mapped = mapVirgoOffer(node, parsed.agents);
    } catch (e) {
      summary.errors.push({ step: "virgo_map", message: errMsg(e) });
      continue;
    }
    if (!mapped.galactica_offer_id) {
      summary.offers_skipped++;
      continue;
    }
    if (opts.dryRun) {
      summary.offers_updated++; // w dry-run nie rozróżniamy create/update - liczymy ogólnie
      summary.images_imported += mapped.image_filenames.length;
      summary.floorplans_imported =
        (summary.floorplans_imported ?? 0) + mapped.floorplan_filenames.length;
      continue;
    }

    try {
      // 4a. Agent
      let agentId: string | null = null;
      if (mapped.agent_email || mapped.agent_name) {
        try {
          const { id, created } = await upsertAgent(supabase, {
            name: mapped.agent_name,
            email: mapped.agent_email,
            phone_office: mapped.agent_phone_office,
            phone_mobile: mapped.agent_phone_mobile,
          });
          agentId = id;
          if (created) summary.agents_created++;
        } catch (e) {
          summary.errors.push({
            offer_id: mapped.galactica_offer_id,
            step: "agent_sync",
            message: errMsg(e),
          });
        }
      }

      // 4b. Oferta
      const offerResult = await upsertOffer(supabase, mapped, agentId, sourceBranch);
      if (offerResult.action === "created") summary.offers_created++;
      else if (offerResult.action === "updated") summary.offers_updated++;
      else if (offerResult.action === "skipped") summary.offers_skipped++;

      // 4c. Zdjęcia - leniwie, tylko brakujące, z limitem i throttlingiem GetImage2.
      if (needImages && offerResult.offerId && mapped.image_filenames.length > 0) {
        try {
          const incoming: LazyImageInput[] = mapped.image_filenames.map((img) => ({
            order: img.order,
            filename: img.filename,
            fetchBuffer: async () => {
              if (img.fotoId === undefined) return null;
              if (imageCap > 0 && imagesFetchedThisRun >= imageCap) return null; // limit - dociągnie się później
              if (imagesFetchedThisRun > 0 && imageDelay > 0) await sleep(imageDelay);
              const buf = await getImage2(sid!, img.fotoId, cfg!);
              imagesFetchedThisRun++;
              return buf;
            },
          }));
          const res = await syncOfferImagesLazy(
            supabase,
            offerResult.offerId,
            mapped.galactica_offer_id,
            incoming,
          );
          summary.images_imported += res.uploaded;
          summary.images_deleted += res.deleted;
        } catch (e) {
          summary.errors.push({
            offer_id: mapped.galactica_offer_id,
            step: "images",
            message: errMsg(e),
          });
        }
      }

      // 4d. Rzuty - dopina zdjęcia oznaczone w Galactice jako "Rzut" (już w galerii)
      //     do offer_floorplans. Bezpieczne dla rzutów dodanych ręcznie w panelu.
      if (needImages && offerResult.offerId && mapped.floorplan_filenames.length > 0) {
        try {
          const fp = await syncOfferFloorplansFromGallery(
            supabase,
            offerResult.offerId,
            mapped.floorplan_filenames,
          );
          summary.floorplans_imported = (summary.floorplans_imported ?? 0) + fp.added;
        } catch (e) {
          summary.errors.push({
            offer_id: mapped.galactica_offer_id,
            step: "floorplans",
            message: errMsg(e),
          });
        }
      }
    } catch (e) {
      summary.errors.push({
        offer_id: mapped.galactica_offer_id,
        step: "offer_upsert",
        message: errMsg(e),
      });
    }
  }

  // 5. <Usuniete> -> dezaktywuj (gdy VIRGO jawnie zgłosi usunięcia).
  if (!opts.dryRun) {
    for (const id of parsed.deletes) {
      try {
        if (await deactivateOffer(supabase, id)) summary.offers_deleted++;
      } catch (e) {
        summary.errors.push({ offer_id: id, step: "offer_deactivate", message: errMsg(e) });
      }
    }
  }

  // 6. Reconcile z pełnej listy (GetOfferList): wygaś Symbol-e, których już nie ma w VIRGO.
  //    Te same progi bezpieczeństwa co przy FTP 'calosc' (min ofert / max % wygaszeń).
  if (opts.reconcile) {
    try {
      let symbols: string[];
      if (importType === "full") {
        // `xml` z kroku 1 to już lekka lista GetOfferList - wyciągamy z niej Symbol-e
        // płaskim ekstraktorem (parseVirgoXml jej NIE czyta: <Oferta> jest bez wrappera
        // <Oferty>, stąd dawniej 0 symboli -> reconcile zawsze pomijany).
        symbols = parseOfferListSymbols(xml);
      } else {
        if (!sid || !cfg) {
          cfg = getVirgoConfig();
          sid = await loginEx(cfg);
        }
        symbols = parseOfferListSymbols(await getOfferListXml(sid, cfg));
      }
      const recon = await deactivateMissingFromFullExport(supabase, symbols, {
        dryRun: opts.dryRun,
      });
      if (recon.skipped) {
        summary.reconcileNote = `Reconcile pominięty: ${recon.reason ?? "nieznany powód"}`;
      } else {
        summary.offers_deleted += recon.deactivated;
        summary.reconcileNote =
          `Reconcile: wygaszono ${recon.deactivated} z ${recon.candidates} aktywnych ` +
          `(VIRGO lista: ${symbols.length} ofert).`;
      }
    } catch (e) {
      summary.errors.push({ step: "virgo_reconcile", message: errMsg(e) });
    }
  }

  // 7. Status + log
  summary.duration_ms = Date.now() - started;
  if (summary.errors.length === 0) summary.status = "success";
  else if (summary.offers_created + summary.offers_updated > 0) summary.status = "partial";
  else summary.status = "failed";

  if (summary.runId) await logRunFinish(supabase, summary);

  return summary;
}

async function logRunStart(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  summary: ImportSummary,
  sourceBranch: string,
): Promise<string | null> {
  try {
    const payload: Record<string, unknown> = {
      status: "running",
      source_filename: summary.source_filename,
      import_type: summary.import_type,
      source_branch: sourceBranch,
    };
    let insert = await supabase.from("import_runs").insert(payload).select("id").single();
    if (insert.error && /source_branch/i.test(insert.error.message ?? "")) {
      delete payload.source_branch;
      insert = await supabase.from("import_runs").insert(payload).select("id").single();
    }
    if (insert.error) throw insert.error;
    return insert.data?.id ?? null;
  } catch (e) {
    summary.errors.push({ step: "import_runs.insert", message: errMsg(e) });
    return null;
  }
}

async function logRunFinish(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  summary: ImportSummary,
): Promise<void> {
  try {
    await supabase
      .from("import_runs")
      .update({
        status: summary.status,
        finished_at: new Date().toISOString(),
        offers_created: summary.offers_created,
        offers_updated: summary.offers_updated,
        offers_deleted: summary.offers_deleted,
        images_imported: summary.images_imported,
        errors_count: summary.errors.length,
        error_details: summary.errors.length > 0 ? summary.errors : null,
        log: buildLog(summary),
      })
      .eq("id", summary.runId!);
  } catch (e) {
    summary.errors.push({ step: "import_runs.update", message: errMsg(e) });
  }
}

function buildLog(s: ImportSummary): string {
  const lines: string[] = [];
  lines.push(`source: ${s.source_filename ?? "-"} (VIRGO)`);
  lines.push(`type: ${s.import_type ?? "-"}`);
  lines.push(
    `offers: +${s.offers_created} / ~${s.offers_updated} / -${s.offers_deleted} / skipped ${s.offers_skipped}`,
  );
  lines.push(`agents created: ${s.agents_created}`);
  lines.push(`images: +${s.images_imported} / -${s.images_deleted}`);
  if (s.floorplans_imported) lines.push(`rzuty (offer_floorplans): +${s.floorplans_imported}`);
  if (s.reconcileNote) lines.push(s.reconcileNote);
  lines.push(`duration: ${s.duration_ms} ms`);
  if (s.errors.length > 0) {
    lines.push(`errors: ${s.errors.length}`);
    for (const e of s.errors.slice(0, 20)) {
      lines.push(`  [${e.step}${e.offer_id ? " " + e.offer_id : ""}] ${e.message}`);
    }
  }
  return lines.join("\n");
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
