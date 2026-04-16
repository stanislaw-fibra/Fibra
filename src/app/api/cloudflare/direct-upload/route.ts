import { NextResponse } from "next/server";
import { getPanelRouteUser } from "@/lib/supabase/route-handler-auth";

export const runtime = "nodejs";

const CF_API = "https://api.cloudflare.com/client/v4";

export async function POST(request: Request) {
  const user = await getPanelRouteUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !token) {
    return NextResponse.json(
      { error: "Brak CLOUDFLARE_ACCOUNT_ID lub CLOUDFLARE_API_TOKEN po stronie serwera." },
      { status: 501 },
    );
  }

  let maxDurationSeconds = 3600;
  try {
    const body = (await request.json()) as { maxDurationSeconds?: number };
    if (typeof body.maxDurationSeconds === "number" && Number.isFinite(body.maxDurationSeconds)) {
      maxDurationSeconds = Math.min(Math.max(Math.floor(body.maxDurationSeconds), 60), 43_200);
    }
  } catch {
    /* default */
  }

  const r = await fetch(`${CF_API}/accounts/${accountId}/stream/direct_upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ maxDurationSeconds }),
  });

  const json = (await r.json()) as {
    success?: boolean;
    result?: { uploadURL?: string; uid?: string };
    errors?: { message?: string }[];
  };

  if (!json.success || !json.result?.uploadURL || !json.result?.uid) {
    const msg = json.errors?.[0]?.message || "Cloudflare: nie udało się utworzyć linku uploadu.";
    return NextResponse.json({ error: msg, details: json.errors }, { status: 502 });
  }

  return NextResponse.json({
    uploadURL: json.result.uploadURL,
    uid: json.result.uid,
  });
}
