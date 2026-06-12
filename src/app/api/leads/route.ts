import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAnon } from "@/lib/supabase/server-anon";
import { sendEmail, OFFICE_INBOX } from "@/lib/email/resend";
import {
  leadClientConfirmation,
  leadOfficeNotification,
  type LeadEmailData,
} from "@/lib/email/templates";

export const runtime = "nodejs";

type LeadSource =
  | "offer_page"
  | "offer_page_mini"
  | "contact_page"
  | "sprzedaj_page"
  | "home_form"
  | "newsletter_footer"
  | "b2b_page";

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
    x === "newsletter_footer" ||
    x === "b2b_page"
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

  // Newsletter to osobny temat - obsłuży go GetResponse (własna lista + automatyczne
  // wypisywanie). My nie wysyłamy tu żadnego maila, zostawiamy sam zapis w bazie.
  // U nas Resend = tylko maile transakcyjne (reakcja na formularz, kurs).
  if (body.source === "newsletter_footer") {
    return NextResponse.json({ ok: true });
  }

  // Wysyłka maili. Świadomie await (na serverless praca po response bywa ubijana),
  // ale w try/catch + allSettled, żeby ŻADEN problem z mailem nie zepsuł zapisu leada
  // ani nie zwrócił błędu użytkownikowi - lead jest już bezpiecznie w bazie.
  const emailData: LeadEmailData = {
    source: body.source,
    full_name,
    email,
    phone,
    message,
    offer_id,
    galactica_offer_id,
    newsletter_consent,
  };
  try {
    const jobs: Promise<unknown>[] = [];

    // 1) Powiadomienie do biura - zawsze. Reply-To = e-mail klienta (jeśli jest),
    //    żeby biuro mogło odpowiedzieć wprost do zgłaszającego.
    const office = leadOfficeNotification(emailData);
    jobs.push(
      sendEmail({
        to: OFFICE_INBOX,
        subject: office.subject,
        html: office.html,
        text: office.text,
        replyTo: email ?? undefined,
      }),
    );

    // 2) Potwierdzenie do klienta - tylko gdy podał poprawny e-mail.
    if (email && /.+@.+\..+/.test(email)) {
      const confirm = leadClientConfirmation(emailData);
      jobs.push(
        sendEmail({
          to: email,
          subject: confirm.subject,
          html: confirm.html,
          text: confirm.text,
        }),
      );
    }

    await Promise.allSettled(jobs);
  } catch (e) {
    // Nie przerywamy - lead zapisany. Tylko log.
    console.error("[leads] Błąd wysyłki maili (lead i tak zapisany):", e);
  }

  return NextResponse.json({ ok: true });
}

