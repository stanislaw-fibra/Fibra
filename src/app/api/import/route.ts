import { NextResponse } from "next/server";
import { runImport } from "@/lib/importer/run-import";
import { runVirgoImport } from "@/lib/importer/virgo-run";
import { isCronOrAdminAuthorized } from "@/lib/importer/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Hobby = 60s, Pro = 300s. Na Hobby rozważ tryb bez zdjęć, albo upgrade Pro.
export const maxDuration = 300;

async function handle(req: Request) {
  if (!(await isCronOrAdminAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const skipImages = url.searchParams.get("skipImages") === "1";

    // Nowe źródło: VIRGO API. FTP zostaje domyślne (?source pominięte) jako uśpiony fallback.
    if (url.searchParams.get("source") === "virgo") {
      // importType: "full" (GetOfferList - pełny snapshot) vs "diff" (GetOffers - przyrost; domyślne dla crona).
      const importType =
        url.searchParams.get("importType") === "full" ? "full" : "diff";
      // Reconcile (wygaszanie brakujących) WYŁĄCZONE domyślnie - włączamy je osobnym, dziennym
      // wywołaniem (?reconcile=1), żeby przyrostowy GetOffers nigdy nie wygasił bazy.
      const reconcile = url.searchParams.get("reconcile") === "1";
      // Reset: wymusza pełną resynchronizację (VIRGO Reset -> GetOffers zwraca komplet).
      // Świadomie ręczny / rzadki - kasuje stan dostarczenia po stronie serwera VIRGO.
      const reset = url.searchParams.get("reset") === "1";
      const maxImagesRaw = url.searchParams.get("maxImagesPerRun");
      const maxImagesPerRun = maxImagesRaw ? Number(maxImagesRaw) : undefined;
      const summary = await runVirgoImport({
        importType,
        skipImages,
        reconcile,
        reset,
        maxImagesPerRun: Number.isFinite(maxImagesPerRun) ? maxImagesPerRun : undefined,
      });
      const status =
        summary.status === "failed" ? 500 : summary.status === "partial" ? 207 : 200;
      return NextResponse.json(summary, { status });
    }

    const force = url.searchParams.get("force") === "1";
    // Pełny eksport 'calosc' ma reconciliować bazę (wygasić oferty, których już nie ma).
    // Można wyłączyć przez ?reconcile=0 (np. gdy podejrzewamy uszkodzony plik).
    const reconcileFullExport = url.searchParams.get("reconcile") !== "0";
    const summary = await runImport({ skipImages, force, reconcileFullExport });
    const status =
      summary.status === "failed" ? 500 : summary.status === "partial" ? 207 : 200;
    return NextResponse.json(summary, { status });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return handle(req);
}

// Vercel Cron uderza GET-em
export async function GET(req: Request) {
  return handle(req);
}
