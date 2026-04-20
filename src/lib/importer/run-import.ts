import "server-only";
import AdmZip from "adm-zip";
import { promises as fs } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { downloadLatestOffersZip, type DownloadedZip } from "./ftp-client";
import { parseGalacticaXml, type ParsedXml } from "./xml-parser";
import { mapOffer, type MappedOffer } from "./field-mapper";
import { upsertAgent } from "./agent-sync";
import {
  deactivateMissingOffers,
  deactivateOffer,
  upsertOffer,
} from "./offer-sync";
import { syncOfferImages, type ImageInput } from "./image-uploader";

export interface ImportSummary {
  runId: string | null;
  status: "success" | "partial" | "failed" | "skipped";
  source_filename: string | null;
  import_type: "full" | "diff" | null;
  offers_created: number;
  offers_updated: number;
  offers_deleted: number;
  offers_skipped: number;
  agents_created: number;
  images_imported: number;
  images_deleted: number;
  errors: Array<{ offer_id?: string; step: string; message: string }>;
  duration_ms: number;
  message?: string;
}

export interface RunImportOptions {
  // Ścieżka do lokalnego XML (dev / testy). Pomija FTP.
  localXmlPath?: string;
  // Ścieżka do katalogu ze zdjęciami dla localXmlPath (opcjonalnie).
  localImagesDir?: string;
  // Ścieżka do lokalnego ZIP-a (oferty_*.zip). Używamy go tak samo jak ZIP z FTP:
  //   - wyciągamy oferty.xml,
  //   - wyciągamy wszystkie obrazy,
  //   - uruchamiamy pełny import (oferty + agenci + zdjęcia).
  localZipPath?: string;
  // Pomiń upload zdjęć (przyspiesza testy).
  skipImages?: boolean;
  // Wymuś ponowne przetworzenie ZIP-a z FTP, nawet jeśli był już importowany.
  force?: boolean;
  // Dry-run: parsuj XML, pokazuj ile zdjęć by się wgrało, ale NIC nie wysyłaj do Supabase.
  dryRun?: boolean;
}

export async function runImport(opts: RunImportOptions = {}): Promise<ImportSummary> {
  const started = Date.now();
  const supabase = createSupabaseAdmin();

  const summary: ImportSummary = {
    runId: null,
    status: "success",
    source_filename: null,
    import_type: null,
    offers_created: 0,
    offers_updated: 0,
    offers_deleted: 0,
    offers_skipped: 0,
    agents_created: 0,
    images_imported: 0,
    images_deleted: 0,
    errors: [],
    duration_ms: 0,
  };

  // 1. Zdobądź XML + buffery zdjęć
  let xmlText: string;
  let imagesMap = new Map<string, Buffer>();
  let sourceFilename: string | null = null;
  let downloaded: DownloadedZip | null = null;

  try {
    if (opts.localZipPath) {
      sourceFilename = opts.localZipPath.split("/").pop() ?? opts.localZipPath;
      const extracted = await extractZip(opts.localZipPath);
      xmlText = extracted.xml;
      if (!opts.skipImages) imagesMap = extracted.images;
    } else if (opts.localXmlPath) {
      xmlText = await fs.readFile(opts.localXmlPath, "utf-8");
      sourceFilename = opts.localXmlPath.split("/").pop() ?? opts.localXmlPath;
      if (opts.localImagesDir && !opts.skipImages) {
        imagesMap = await loadImagesFromDir(opts.localImagesDir);
      }
    } else {
      const skip = await listProcessedFilenames(supabase);
      downloaded = await downloadLatestOffersZip(undefined, opts.force ? [] : skip);
      if (!downloaded) {
        summary.status = "skipped";
        summary.message = "Brak nowych plików oferty_*.zip na FTP";
        summary.duration_ms = Date.now() - started;
        return summary;
      }
      sourceFilename = downloaded.remoteName;
      const extracted = await extractZip(downloaded.localPath);
      xmlText = extracted.xml;
      if (!opts.skipImages) imagesMap = extracted.images;
    }
  } catch (e) {
    summary.status = "failed";
    summary.message = `Błąd pobrania/otwarcia źródła: ${errMsg(e)}`;
    summary.duration_ms = Date.now() - started;
    return summary;
  }

  summary.source_filename = sourceFilename;

  // 2. Parse XML
  let parsed: ParsedXml;
  try {
    parsed = parseGalacticaXml(xmlText);
  } catch (e) {
    summary.status = "failed";
    summary.message = `Błąd parsowania XML: ${errMsg(e)}`;
    summary.duration_ms = Date.now() - started;
    return summary;
  }

  summary.import_type =
    parsed.header.zawartosc_pliku === "calosc" ? "full" : "diff";

  // 3. Zaloguj start w import_runs
  try {
    const { data: run, error } = await supabase
      .from("import_runs")
      .insert({
        status: "running",
        source_filename: sourceFilename,
        import_type: summary.import_type,
      })
      .select("id")
      .single();
    if (error) throw error;
    summary.runId = run.id;
  } catch (e) {
    // Jeśli logowanie się wywali — kontynuuj, ale zapisz błąd.
    summary.errors.push({ step: "import_runs.insert", message: errMsg(e) });
  }

  // 4. Przetwarzaj oferty
  for (const raw of parsed.offers) {
    try {
      const mapped = mapOffer(raw);

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
      const offerResult = await upsertOffer(supabase, mapped, agentId);
      if (offerResult.action === "created") summary.offers_created++;
      else if (offerResult.action === "updated") summary.offers_updated++;
      else if (offerResult.action === "skipped") summary.offers_skipped++;

      // 4c. Zdjęcia
      if (!opts.skipImages && offerResult.offerId && imagesMap.size > 0) {
        try {
          const imgs = collectImages(mapped, imagesMap);
          if (imgs.length > 0) {
            const res = await syncOfferImages(
              supabase,
              offerResult.offerId,
              mapped.galactica_offer_id,
              imgs,
            );
            summary.images_imported += res.uploaded;
            summary.images_deleted += res.deleted;
          }
        } catch (e) {
          summary.errors.push({
            offer_id: mapped.galactica_offer_id,
            step: "images",
            message: errMsg(e),
          });
        }
      }
    } catch (e) {
      summary.errors.push({
        offer_id: raw.id,
        step: "offer_upsert",
        message: errMsg(e),
      });
    }
  }

  // 5. <oferta_usun> → dezaktywuj
  for (const id of parsed.deletes) {
    try {
      const ok = await deactivateOffer(supabase, id);
      if (ok) summary.offers_deleted++;
    } catch (e) {
      summary.errors.push({
        offer_id: id,
        step: "offer_deactivate",
        message: errMsg(e),
      });
    }
  }

  // 6. Eksport pełny → dezaktywuj brakujące (poza MANUAL-*)
  if (summary.import_type === "full") {
    try {
      const presentIds = parsed.offers.map((o) => o.id);
      const deactivated = await deactivateMissingOffers(supabase, presentIds);
      summary.offers_deleted += deactivated;
    } catch (e) {
      summary.errors.push({ step: "full_diff_deactivate", message: errMsg(e) });
    }
  }

  // 7. Finalny status + log w import_runs
  summary.duration_ms = Date.now() - started;
  if (summary.errors.length === 0) {
    summary.status = "success";
  } else if (summary.offers_created + summary.offers_updated > 0) {
    summary.status = "partial";
  } else {
    summary.status = "failed";
  }

  if (summary.runId) {
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
        .eq("id", summary.runId);
    } catch (e) {
      summary.errors.push({ step: "import_runs.update", message: errMsg(e) });
    }
  }

  // 8. Sprzątanie plików tymczasowych po FTP
  if (downloaded) {
    try {
      await fs.rm(downloaded.localPath, { force: true });
    } catch {}
  }

  return summary;
}

// Helpers

async function listProcessedFilenames(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from("import_runs")
    .select("source_filename")
    .eq("status", "success")
    .order("started_at", { ascending: false })
    .limit(50);
  return (data ?? [])
    .map((r) => r.source_filename as string | null)
    .filter((n): n is string => !!n);
}

async function extractZip(
  zipPath: string,
): Promise<{ xml: string; images: Map<string, Buffer> }> {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  let xml = "";
  const images = new Map<string, Buffer>();
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.split("/").pop() ?? entry.entryName;
    if (name.toLowerCase() === "oferty.xml") {
      xml = entry.getData().toString("utf-8");
    } else if (/\.(jpe?g|png|webp)$/i.test(name)) {
      images.set(name, entry.getData());
    }
  }
  if (!xml) throw new Error("Nie znaleziono oferty.xml w ZIP-ie");
  return { xml, images };
}

async function loadImagesFromDir(dir: string): Promise<Map<string, Buffer>> {
  const out = new Map<string, Buffer>();
  try {
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
      const buf = await fs.readFile(`${dir}/${f}`);
      out.set(f, buf);
    }
  } catch {}
  return out;
}

function collectImages(mapped: MappedOffer, pool: Map<string, Buffer>): ImageInput[] {
  const out: ImageInput[] = [];
  for (const img of mapped.image_filenames) {
    const buf = pool.get(img.filename);
    if (!buf) continue; // brakujące pliki po prostu pomijamy — zostaną uzupełnione przy kolejnym ZIP-ie
    out.push({ order: img.order, filename: img.filename, buffer: buf });
  }
  return out;
}

function buildLog(s: ImportSummary): string {
  const lines: string[] = [];
  lines.push(`source: ${s.source_filename ?? "-"}`);
  lines.push(`type: ${s.import_type ?? "-"}`);
  lines.push(`offers: +${s.offers_created} / ~${s.offers_updated} / -${s.offers_deleted} / skipped ${s.offers_skipped}`);
  lines.push(`agents created: ${s.agents_created}`);
  lines.push(`images: +${s.images_imported} / -${s.images_deleted}`);
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
  if (e instanceof Error) return e.message;
  return String(e);
}
