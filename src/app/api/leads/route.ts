import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAnon } from "@/lib/supabase/server-anon";

export const runtime = "nodejs";

type LeadSource =
  | "offer_page"
  | "offer_page_mini"
  | "contact_page"
  | "sprzedaj_page"
  | "home_form"
  | "newsletter_footer";

type LeadPayload = {
  source: LeadSource;
  offer_id?: string | null;
  galactica_offer_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  newsletter_consent?: boolean | null;
};

function isLeadSource(x: unknown): x is LeadSource {
  return (
    x === "offer_page" ||
    x === "offer_page_mini" ||
    x === "contact_page" ||
    x === "sprzedaj_page" ||
    x === "home_form" ||
    x === "newsletter_footer"
  );
}

function cleanText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const body = json as Partial<LeadPayload>;
  if (!isLeadSource(body.source)) {
    return NextResponse.json({ ok: false, error: "Invalid source" }, { status: 400 });
  }

  const full_name = cleanText(body.full_name) ?? null;

  const offer_id = cleanText(body.offer_id) ?? null;
  const galactica_offer_id = cleanText(body.galactica_offer_id) ?? null;
  const email = cleanText(body.email) ?? null;
  const phone = cleanText(body.phone) ?? null;
  const message = cleanText(body.message) ?? null;
  const newsletter_consent = Boolean(body.newsletter_consent);

  // Walidacja per źródło.
  if (body.source === "newsletter_footer") {
    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }
  } else {
    if (!full_name) {
      return NextResponse.json({ ok: false, error: "Missing full_name" }, { status: 400 });
    }
  }

  const supabase = getSupabaseAnon();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  const userAgent = req.headers.get("user-agent");
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    null;
  const salt = process.env.LEAD_IP_SALT?.trim() || "";
  const ip_hash = ip ? sha256Hex(`${salt}${ip}`) : null;

  const { error } = await supabase.from("lead_submissions").insert({
    source: body.source,
    offer_id,
    galactica_offer_id,
    full_name,
    email,
    phone,
    message,
    newsletter_consent,
    user_agent: userAgent,
    ip_hash,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

