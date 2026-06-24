import { NextResponse } from "next/server";
import { sendCapiEvents, type CapiEvent } from "@/lib/facebook-capi";

export const runtime = "nodejs";

/**
 * Odbiera zdarzenie konwersji z przeglądarki i przekazuje je do Meta przez CAPI.
 * Wywoływane przez `navigator.sendBeacon` z przycisku „Kupuję dostęp" (AddToCart)
 * tuż przed przekierowaniem do koszyka Imkera.
 *
 * Klient wysyła to TYLKO po zgodzie marketingowej (Cookiebot) - tu i tak nie
 * przyjmujemy żadnych danych osobowych (e-mail/telefon), jedynie cookies piksela
 * (_fbp/_fbc) oraz IP/User-Agent z nagłówków, do dopasowania zdarzeń.
 *
 * Endpoint jest publiczny, więc dopuszczamy tylko znane nazwy zdarzeń
 * (ALLOWED_EVENTS) - to ogranicza zaśmiecanie zbioru danych przez osoby trzecie.
 */

const ALLOWED_EVENTS = new Set(["PageView", "AddToCart", "InitiateCheckout", "ViewContent"]);

type Body = {
  event_name?: string;
  event_id?: string;
  event_source_url?: string;
  fbp?: string | null;
  fbc?: string | null;
  /** Własny, stały identyfikator użytkownika (cookie fibra_uid) -> external_id. */
  external_id?: string | null;
  custom_data?: Record<string, unknown>;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = typeof body.event_name === "string" ? body.event_name : "";
  if (!ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: false, error: "Unsupported event" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent");
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    null;

  const event: CapiEvent = {
    event_name: eventName,
    event_id: typeof body.event_id === "string" ? body.event_id : undefined,
    event_source_url: typeof body.event_source_url === "string" ? body.event_source_url : null,
    action_source: "website",
    user_data: {
      client_ip_address: ip,
      client_user_agent: userAgent,
      fbp: typeof body.fbp === "string" ? body.fbp : null,
      fbc: typeof body.fbc === "string" ? body.fbc : null,
      external_id: typeof body.external_id === "string" ? body.external_id : null,
    },
    custom_data:
      body.custom_data && typeof body.custom_data === "object" ? body.custom_data : undefined,
  };

  // Nie blokujemy klienta - i tak już nawiguje do koszyka. Wynik tylko logujemy.
  const result = await sendCapiEvents([event]);
  if (!result.ok && !result.skipped) {
    console.error("[fb/capi] wysyłka nieudana:", result.error);
  }
  return NextResponse.json({ ok: true });
}
