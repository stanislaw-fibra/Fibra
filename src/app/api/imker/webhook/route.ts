import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Produkt kursu "20 Lekcji Inwestora" w SalesCRM/Imker. */
const COURSE_PRODUCT_ID = 21494;

/** Nagłówek z podpisem HMAC od Imkera (silnik Shoplo). */
const HMAC_HEADER = "shoplo-hmac-sha256";

type ImkerCustomer = {
  email?: string | null;
  name?: string | null;
  surname?: string | null;
};

type ImkerOrderItem = {
  product_id?: number | string | null;
  quantity?: number | null;
};

type ImkerOrder = {
  order_identifier?: string | null;
  customer?: ImkerCustomer | null;
  order_items?: ImkerOrderItem[] | null;
};

type ImkerPayload = {
  order?: ImkerOrder | null;
};

/**
 * Weryfikacja podpisu HMAC-SHA256.
 * Shoplo standardowo liczy base64(HMAC_SHA256(rawBody, secret)).
 * Wariant z konkatenacją (secret + body) sprawdzamy jako fallback,
 * bo opis w panelu Imkera bywa nieprecyzyjny - przy pierwszym realnym
 * zamówieniu potwierdzimy, który wariant trafia, i zostawimy jeden.
 */
function verifySignature(rawBody: string, secret: string, received: string): boolean {
  const candidates = [
    createHmac("sha256", secret).update(rawBody, "utf8").digest("base64"),
    createHmac("sha256", secret).update(rawBody, "utf8").digest("hex"),
    createHmac("sha256", secret).update(secret + rawBody, "utf8").digest("base64"),
  ];

  const recvTrimmed = received.trim();
  return candidates.some((expected) => {
    if (expected.length !== recvTrimmed.length) return false;
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(recvTrimmed));
    } catch {
      return false;
    }
  });
}

function cleanEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().toLowerCase();
  return t.length ? t : null;
}

function orderContainsCourse(items: ImkerOrderItem[] | null | undefined): boolean {
  if (!Array.isArray(items)) return false;
  return items.some((it) => Number(it?.product_id) === COURSE_PRODUCT_ID);
}

export async function POST(req: Request) {
  const secret = process.env.IMKER_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Surowe ciało jest potrzebne do HMAC - czytamy je jako tekst, nie .json().
  const rawBody = await req.text();
  const signature = req.headers.get(HMAC_HEADER) ?? "";

  if (!signature || !verifySignature(rawBody, secret, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: ImkerPayload;
  try {
    payload = JSON.parse(rawBody) as ImkerPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const order = payload.order;
  if (!order) {
    return NextResponse.json({ ok: false, error: "Missing order" }, { status: 400 });
  }

  // Druga linia obrony: nawet jeśli filtr w panelu zawiedzie, nadajemy dostęp
  // tylko, gdy zamówienie faktycznie zawiera produkt kursu.
  if (!orderContainsCourse(order.order_items)) {
    return NextResponse.json({ ok: true, skipped: "no course product" });
  }

  const email = cleanEmail(order.customer?.email);
  if (!email) {
    return NextResponse.json({ ok: false, error: "Missing customer email" }, { status: 400 });
  }

  const fullName =
    [order.customer?.name, order.customer?.surname]
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter(Boolean)
      .join(" ") || null;

  const now = new Date().toISOString();

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  const { error } = await supabase
    .from("course_access")
    .upsert(
      {
        email,
        product_id: COURSE_PRODUCT_ID,
        order_identifier: order.order_identifier ?? null,
        customer_name: fullName,
        status: "paid",
        source: "imker",
        granted_at: now,
        raw: payload as unknown as Record<string, unknown>,
        updated_at: now,
      },
      { onConflict: "email" },
    );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // TODO: wysyłka maila z dostępem (Resend / magic-link) - dopnę, gdy będzie
  // skonfigurowany Resend (domena nadawcza + API key).

  return NextResponse.json({ ok: true });
}
