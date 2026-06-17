import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { courseAccessEmail } from "@/lib/email/templates";
import { subscribeToNewsletter } from "@/lib/getresponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Produkt kursu "20 Lekcji Inwestora" w SalesCRM/Imker. */
const COURSE_PRODUCT_ID = 21500;

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
  email_address?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  newsletter?: boolean | string | null;
  status?: string | null;
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

/** Porównanie odporne na timing dla sekretu z URL. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
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

  // Autoryzacja: sekret w URL (?key=) LUB podpis HMAC (gdy Imker go wysyła).
  // W tej konfiguracji Imker NIE wysyła nagłówka podpisu, więc głównym mechanizmem
  // jest sekret w URL; weryfikację HMAC zostawiamy, gdyby kiedyś zaczął podpisywać.
  const queryKey = new URL(req.url).searchParams.get("key")?.trim() ?? "";
  const authedByKey = queryKey.length > 0 && safeEqual(queryKey, secret);
  const authedBySig = signature.length > 0 && verifySignature(rawBody, secret, signature);
  if (!authedByKey && !authedBySig) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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

  // Imker przysyła e-mail w `order.email_address`, a imię/nazwisko w
  // `first_name`/`last_name` (fallback do `customer.*` na wypadek innego formatu).
  const email = cleanEmail(order.email_address ?? order.customer?.email);
  if (!email) {
    return NextResponse.json({ ok: false, error: "Missing customer email" }, { status: 400 });
  }

  const fullName =
    [order.first_name ?? order.customer?.name, order.last_name ?? order.customer?.surname]
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

  // Zgoda marketingowa z zamówienia (order.newsletter) -> zapis na newsletter w
  // GetResponse. Double opt-in + dostarczenie streszczenia rysunkowego ogarnia
  // GetResponse (autoresponder). Błąd nie może zepsuć nadania dostępu.
  const newsletterConsent = order.newsletter === true || order.newsletter === "true";
  if (newsletterConsent && email) {
    try {
      await subscribeToNewsletter({
        email,
        name: fullName,
        source: "newsletter_footer",
        extraTags: ["zrodlo_kurs"],
      });
    } catch (e) {
      console.error("[imker] GetResponse subscribe nieudany (dostęp i tak zapisany):", e);
    }
  }

  // Mail z dostępem do kursu. Dostęp jest już zapisany w course_access, więc nawet
  // gdyby mail padł, kupujący może zalogować się swoim e-mailem zakupu. Dlatego błąd
  // wysyłki tylko logujemy - nie zwracamy 500 (Imker ponawiałby webhook bez sensu).
  try {
    const mail = courseAccessEmail({ email, customer_name: fullName });
    const res = await sendEmail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    if (!res.ok && !res.skipped) {
      console.error("[imker] Dostęp zapisany, ale mail nie poszedł:", res.error);
    }
  } catch (e) {
    console.error("[imker] Wyjątek przy mailu z dostępem (dostęp i tak zapisany):", e);
  }

  return NextResponse.json({ ok: true });
}
