import { NextResponse } from "next/server";
import { getPanelRouteUser } from "@/lib/supabase/route-handler-auth";

export const runtime = "nodejs";

const CF_STREAM_TUS = (accountId: string) =>
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`;

function shouldForwardTusHeader(key: string) {
  const k = key.toLowerCase();
  return (
    k === "location" ||
    k === "stream-media-id" ||
    k.startsWith("tus-") ||
    k.startsWith("upload-") ||
    k === "access-control-expose-headers" ||
    k === "access-control-allow-origin"
  );
}

function metaWithMaxDuration(clientMeta: string | null, maxSeconds: number) {
  const b64 = Buffer.from(String(maxSeconds), "utf8").toString("base64");
  const part = `maxDurationSeconds ${b64}`;
  const c = clientMeta?.trim();
  return c ? `${part},${c}` : part;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, HEAD, OPTIONS, PATCH",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type, Tus-Resumable, Upload-Length, Upload-Metadata, Upload-Offset, X-HTTP-Method-Override",
      "Access-Control-Max-Age": "86400",
    },
  });
}

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

  const uploadLength = request.headers.get("Upload-Length") ?? "";
  const clientMeta = request.headers.get("Upload-Metadata");
  const tusResumable = request.headers.get("Tus-Resumable") ?? "1.0.0";

  const cfRes = await fetch(CF_STREAM_TUS(accountId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Tus-Resumable": tusResumable,
      "Upload-Length": uploadLength,
      "Upload-Metadata": metaWithMaxDuration(clientMeta, 3600),
    },
  });

  const out = new NextResponse(cfRes.body, { status: cfRes.status });
  cfRes.headers.forEach((value, key) => {
    if (shouldForwardTusHeader(key)) {
      out.headers.set(key, value);
    }
  });
  return out;
}
