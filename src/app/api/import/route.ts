import { NextResponse } from "next/server";
import { runImport } from "@/lib/importer/run-import";
import { getPanelRouteUser } from "@/lib/supabase/route-handler-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Hobby = 60s, Pro = 300s. Na Hobby rozważ tryb bez zdjęć, albo upgrade Pro.
export const maxDuration = 300;

async function isAuthorized(req: Request): Promise<boolean> {
  const secret = process.env.IMPORT_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization")?.trim() || "";
    const fromHeader =
      auth.startsWith("Bearer ") && auth.slice(7).trim() === secret;
    const fromCronHeader = req.headers.get("x-import-secret")?.trim() === secret;

    // Vercel Cron wysyła header `Authorization: Bearer {CRON_SECRET}` jeśli CRON_SECRET jest skonfigurowany,
    // ale my używamy naszego IMPORT_SECRET — obsłuż też Vercel Cron przez user-agent jako fallback.
    if (fromHeader || fromCronHeader) return true;
  }

  // Drugi wariant: zalogowany admin z panelu (np. ręczny przycisk "Zaimportuj teraz").
  const user = await getPanelRouteUser();
  return !!user;
}

async function handle(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const skipImages = url.searchParams.get("skipImages") === "1";
    const force = url.searchParams.get("force") === "1";
    const summary = await runImport({ skipImages, force });
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
