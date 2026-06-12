import "server-only";
import { Client, type FileInfo } from "basic-ftp";
import { Writable } from "node:stream";
import zlib from "node:zlib";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getFtpConfig, isOffersZip, zipDateKey } from "./ftp-client";
import { parseGalacticaXml } from "./xml-parser";
import {
  deactivateMissingFromFullExport,
  type FullExportReconcileResult,
} from "./offer-sync";

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM, który ten moduł rozwiązuje
//
// Galactica wysyła na FTP dwa rodzaje plików:
//   - 'roznica' (diff)  → małe ZIP-y, tylko zmienione oferty, NIGDY nie usuwają,
//   - 'calosc'  (full)  → kompletny stan WSZYSTKICH ofert, ale plik ma setki MB
//                          (zdjęcia w środku), więc na serverless (Vercel) nie da
//                          się go pobrać w całości w limicie czasu/pamięci.
//
// Skutek: pełny eksport nigdy się nie wciągał, więc sprzedane / wycofane oferty
// (których diff nie usuwa) narastały jako nieaktualne.
//
// ROZWIĄZANIE bez ściągania całego pliku:
// W ZIP-ie z Galactiki `oferty.xml` jest PIERWSZYM wpisem i jest mały
// (~90 KB spakowany). Pobieramy więc tylko pierwsze ~400 KB pliku przez FTP
// (partial download), wyłuskujemy z Local File Header skompresowane bajty
// oferty.xml, rozpakowujemy je w pamięci (inflateRaw) i mamy pełną listę ofert.
// Na jej podstawie wygaszamy oferty, których w pełnym eksporcie już nie ma.
// Zdjęć w ogóle nie dotykamy - reconcile zajmuje się tylko stanem is_active.
// ─────────────────────────────────────────────────────────────────────────────

// Plik 'calosc' ma setki MB. 'roznica' to KB-MB. Próg odsiewa diffy: do podglądu
// pełnego stanu bierzemy tylko duże pliki. (Konfigurowalny, gdyby eksport schudł.)
const CALOSC_MIN_SIZE = 50 * 1024 * 1024; // 50 MB

// Ile bajtów początku ZIP-a pobrać. oferty.xml spakowany to ~90 KB + nagłówek,
// 400 KB daje spory zapas, a wciąż jest pobraniem trywialnym (< sekunda).
const PARTIAL_BYTES = 400 * 1024;

export interface CaloscReconcileResult {
  ok: boolean;
  message: string;
  dryRun: boolean;
  sourceFilename: string | null;
  sourceSize: number | null;
  importType: "full" | "diff" | null;
  offersInExport: number;
  reconcile: FullExportReconcileResult | null;
}

/**
 * Pobiera tylko początek zdalnego pliku (do `maxBytes`) i zwraca go jako Buffer.
 * basic-ftp nie ma natywnego "pobierz N bajtów", więc podpinamy własny Writable,
 * który po zebraniu `maxBytes` niszczy strumień -> to przerywa transfer FTP.
 * Przerwanie generuje błąd na sockecie danych; połykamy go, jeśli mamy już dość bajtów.
 */
async function partialDownload(
  client: Client,
  remoteName: string,
  maxBytes: number,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;

  const sink = new Writable({
    write(chunk: Buffer, _enc, cb) {
      chunks.push(chunk);
      total += chunk.length;
      if (total >= maxBytes) {
        cb();
        // Niszczymy strumień -> basic-ftp przerywa pobieranie reszty pliku.
        this.destroy();
        return;
      }
      cb();
    },
  });

  try {
    await client.downloadTo(sink, remoteName);
  } catch (e) {
    // Świadome przerwanie transferu po osiągnięciu maxBytes rzuca błędem - to OK.
    // Realny problem tylko wtedy, gdy nic nie zdążyliśmy pobrać.
    if (total === 0) throw e;
  }

  return Buffer.concat(chunks).subarray(0, maxBytes);
}

/**
 * Wyłuskuje treść `oferty.xml` z początku ZIP-a (pierwszy Local File Header).
 * Zakłada, że oferty.xml jest pierwszym wpisem (tak robi eksport Galactiki).
 */
function extractFirstEntryXml(buf: Buffer): string {
  if (buf.length < 30) {
    throw new Error("Pobrany fragment jest zbyt krótki na nagłówek ZIP.");
  }
  // Sygnatura Local File Header: PK\x03\x04
  if (!(buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04)) {
    throw new Error("Brak sygnatury ZIP (PK\\x03\\x04) na początku pliku.");
  }

  const flags = buf.readUInt16LE(6);
  const method = buf.readUInt16LE(8);
  const compSize = buf.readUInt32LE(18);
  const nameLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);

  const nameStart = 30;
  const name = buf.subarray(nameStart, nameStart + nameLen).toString("utf-8");
  if (!/oferty\.xml$/i.test(name)) {
    throw new Error(`Pierwszy wpis ZIP to nie oferty.xml (jest: "${name}").`);
  }

  // Bit 3 flagi = rozmiary są w data descriptorze PO danych, a w nagłówku 0.
  // Eksport Galactiki tego nie używa (rozmiar jest w nagłówku), ale gdyby się
  // pojawiło - przerywamy z czytelnym komunikatem zamiast czytać śmieci.
  if ((flags & 0x08) !== 0 || compSize === 0) {
    throw new Error(
      "ZIP używa data descriptor (rozmiar oferty.xml nie jest w nagłówku) - " +
        "ten szybki tryb nie obsłuży tego pliku.",
    );
  }

  const dataStart = nameStart + nameLen + extraLen;
  const dataEnd = dataStart + compSize;
  if (dataEnd > buf.length) {
    throw new Error(
      `Pobrany fragment (${buf.length} B) nie objął całego oferty.xml ` +
        `(potrzeba ${dataEnd} B). Zwiększ PARTIAL_BYTES.`,
    );
  }

  const compData = buf.subarray(dataStart, dataEnd);
  if (method === 8) {
    return zlib.inflateRawSync(compData).toString("utf-8");
  }
  if (method === 0) {
    return compData.toString("utf-8");
  }
  throw new Error(`Nieobsługiwana metoda kompresji ZIP: ${method}.`);
}

/**
 * Reconcile bazy względem NAJNOWSZEGO pełnego eksportu ('calosc') z FTP,
 * bez pobierania całego (wielkiego) pliku - patrz opis na górze modułu.
 *
 * dryRun=true  → tylko policz i pokaż, które oferty byłyby wygaszone (NIC nie zmienia).
 * dryRun=false → realnie wygasza (is_active=false) brakujące oferty, z progami
 *                bezpieczeństwa z deactivateMissingFromFullExport.
 */
export async function reconcileFromCalosc(
  opts: { dryRun?: boolean; minSize?: number } = {},
): Promise<CaloscReconcileResult> {
  const dryRun = opts.dryRun ?? false;
  const minSize = opts.minSize ?? CALOSC_MIN_SIZE;
  const config = getFtpConfig();

  const base: CaloscReconcileResult = {
    ok: false,
    message: "",
    dryRun,
    sourceFilename: null,
    sourceSize: null,
    importType: null,
    offersInExport: 0,
    reconcile: null,
  };

  // 1. Znajdź najnowszy duży ZIP (kandydat na 'calosc') i pobierz jego początek.
  const client = new Client();
  client.ftp.verbose = false;
  let xmlText: string;
  let chosen: FileInfo;
  try {
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      secure: config.secure,
      secureOptions: { rejectUnauthorized: false },
    });
    if (config.remoteDir && config.remoteDir !== "/") {
      await client.cd(config.remoteDir);
    }

    const list: FileInfo[] = await client.list();
    const candidates = list
      .filter((f) => f.isFile && isOffersZip(f.name) && f.size >= minSize)
      .sort((a, b) => zipDateKey(b.name).localeCompare(zipDateKey(a.name)));

    if (candidates.length === 0) {
      return {
        ...base,
        message: `Nie znaleziono pliku 'calosc' (ZIP > ${Math.round(minSize / 1024 / 1024)} MB) na FTP.`,
      };
    }

    chosen = candidates[0];
    const partial = await partialDownload(client, chosen.name, PARTIAL_BYTES);
    xmlText = extractFirstEntryXml(partial);
  } finally {
    client.close();
  }

  base.sourceFilename = chosen.name;
  base.sourceSize = chosen.size;

  // 2. Sparsuj XML i upewnij się, że to RZECZYWIŚCIE pełny eksport.
  const parsed = parseGalacticaXml(xmlText);
  base.importType = parsed.header.zawartosc_pliku === "calosc" ? "full" : "diff";
  base.offersInExport = parsed.offers.length;

  if (base.importType !== "full") {
    return {
      ...base,
      message:
        `Najnowszy duży plik (${chosen.name}) ma nagłówek ` +
        `zawartosc_pliku="${parsed.header.zawartosc_pliku}", a nie "calosc". ` +
        `Przerwano dla bezpieczeństwa - nie wygaszam ofert na podstawie diffu.`,
    };
  }

  // 3. Reconcile (z progami bezpieczeństwa wewnątrz). dryRun nie rusza bazy.
  //    Jako cutoff podajemy czas wygenerowania calosc (header.data) - oferty
  //    dotknięte przez NOWSZY diff (updated_at > cutoff) zostaną ochronione,
  //    bo calosc jest wtedy starszą prawdą niż diff i nie chcemy ich wygasić.
  const supabase = createSupabaseAdmin();
  const presentIds = parsed.offers.map((o) => o.id);
  const notUpdatedAfter = parsed.header.data; // np. "2026-06-11 03:48:43"
  const recon = await deactivateMissingFromFullExport(supabase, presentIds, {
    dryRun,
    notUpdatedAfter,
  });

  const verb = dryRun ? "wygasiłby" : "wygasił";
  const protectedNote = recon.protectedRecent
    ? ` Ochroniono ${recon.protectedRecent} (nowszy diff niż calosc).`
    : "";
  const message = recon.skipped
    ? `Reconcile pominięty: ${recon.reason ?? "nieznany powód"}`
    : `Pełny eksport ${chosen.name} (${notUpdatedAfter ?? "?"}): ${parsed.offers.length} ofert. ` +
      `Reconcile ${verb} ${dryRun ? recon.wouldDeactivate : recon.deactivated} ` +
      `z ${recon.candidates} aktywnych ofert.${protectedNote}`;

  return { ...base, ok: !recon.skipped, message, reconcile: recon };
}
