import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Wewnętrzna analityka kliknięć CTA na stronie kursu - NIE idzie do Meta.
 * Zapisujemy KAŻDY klik (kotwica i zakup) do tabeli `cta_clicks`, niezależnie od
 * zgody marketingowej: to first-party, bez danych osobowych (sekcja, czas, UA,
 * zahashowane IP). Dzięki temu w Supabase widać, które przyciski realnie klikają.
 *
 * Wołane przez `navigator.sendBeacon` z przycisków CTA. Fail-soft: błąd zapisu
 * nie może nic wywrócić (klik użytkownika idzie dalej).
 */

const ALLOWED_SECTIONS = new Set([
  "hero",
  "solution",
  "program",
  "free_lesson",
  "order",
  "final",
  "sticky",
]);

const ALLOWED_KINDS = new Set(["interest", "add_to_cart"]);

type Body = { section?: string; kind?: string; url?: string };

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const section = typeof body.section === "string" ? body.section : "";
  const kind = typeof body.kind === "string" ? body.kind : "interest";
  if (!ALLOWED_SECTIONS.has(section) || !ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.slice(0, 300) : null;
  const userAgent = req.headers.get("user-agent");
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    null;
  const salt = process.env.LEAD_IP_SALT?.trim() || "";
  const ip_hash = ip ? sha256Hex(`${salt}${ip}`) : null;

  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from("cta_clicks").insert({
      section,
      kind,
      url,
      user_agent: userAgent,
      ip_hash,
    });
    if (error) {
      // Fail-soft: log, ale nie zwracaj błędu klientowi (i tak już nawiguje).
      console.error("[course-cta] zapis nieudany:", error.message);
    }
  } catch (e) {
    console.error("[course-cta] wyjątek zapisu:", e);
  }

  return NextResponse.json({ ok: true });
}
