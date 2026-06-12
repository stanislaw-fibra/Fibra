import { NextResponse } from "next/server";
import { reconcileFromCalosc } from "@/lib/importer/calosc-reconcile";
import { isCronOrAdminAuthorized } from "@/lib/importer/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Ten endpoint NIE pobiera całego (wielkiego) pliku 'calosc' - czyta tylko jego
// początek przez FTP i wyłuskuje oferty.xml. Patrz src/lib/importer/calosc-reconcile.ts.
// Dlatego jest lekki i mieści się spokojnie nawet w limicie Hobby (60 s).

async function handle(req: Request) {
  if (!(await isCronOrAdminAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    // Domyślnie DRY-RUN: bez ?apply=1 niczego nie wygaszamy, tylko raportujemy.
    // To zabezpieczenie przed przypadkowym masowym wygaszeniem przy ręcznym wywołaniu.
    const dryRun = url.searchParams.get("apply") !== "1";
    const result = await reconcileFromCalosc({ dryRun });
    const status = result.ok || result.reconcile?.skipped ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
