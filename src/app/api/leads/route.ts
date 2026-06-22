import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAnon } from "@/lib/supabase/server-anon";
import { sendEmail, LEAD_NOTIFY_RECIPIENTS } from "@/lib/email/resend";
import {
  leadClientConfirmation,
  leadOfficeNotification,
  type LeadEmailData,
} from "@/lib/email/templates";
import { isValidEmail } from "@/lib/email-validation";
import { subscribeToNewsletter } from "@/lib/getresponse";
import { honeypotTripped, tooFast, verifyTurnstile, rateLimited } from "@/lib/forms/anti-bot";
import { RENTAL_AGENT } from "@/lib/rentals/zamyslow-rentals";

export const runtime = "nodejs";

type LeadSource =
  | "offer_page"
  | "offer_page_mini"
  | "contact_page"
  | "sprzedaj_page"
  | "home_form"
  | "newsletter_footer"
  | "b2b_page"
  | "rental_zamyslow"
  | "investor_zamyslow";

type LeadPayload = {
  source: LeadSource;
  offer_id?: string | null;
  galactica_offer_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  newsletter_consent?: boolean | null;
  // Zapis z kontekstu kursu -> tag 'zrodlo-kurs' w GetResponse (wyzwala streszczenie).
  course_context?: boolean | null;
  // Pola anty-bot (dokładane automatycznie przez useFormGuards po stronie klienta).
  hp?: string | null;
  ts?: number | null;
  turnstile_token?: string | null;
};

function isLeadSource(x: unknown): x is LeadSource {
  return (
    x === "offer_page" ||
    x === "offer_page_mini" ||
    x === "contact_page" ||
    x === "sprzedaj_page" ||
    x === "home_form" ||
    x === "newsletter_footer" ||
    x === "b2b_page" ||
    x === "rental_zamyslow" ||
    x === "investor_zamyslow"
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

  // ── Ochrona antybotowa ──────────────────────────────────────────────
  // Honeypot i pułapka czasowa: zwracamy "ciche" OK (200), żeby nie podpowiadać
  // botowi, że został złapany - a leada nie zapisujemy.
  if (honeypotTripped(body.hp) || tooFast(body.ts)) {
    return NextResponse.json({ ok: true });
  }

  const userAgent = req.headers.get("user-agent");
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    null;
  const salt = process.env.LEAD_IP_SALT?.trim() || "";
  const ip_hash = ip ? sha256Hex(`${salt}${ip}`) : null;

  // Cloudflare Turnstile - egzekwowane TYLKO na hoście produkcyjnym. Poza prod
  // (localhost, *.vercel.app) klient renderuje testowy klucz CF, którego prawdziwy
  // sekret by nie zweryfikował - więc tam pomijamy (chronią honeypot + pułapka
  // czasowa + rate-limit). Na prod: pełna weryfikacja. Pomijane też bez SECRET_KEY.
  const host = req.headers.get("host")?.toLowerCase() ?? "";
  const isProdHost = host === "fibra.pl" || host === "www.fibra.pl";
  const turnstile = isProdHost
    ? await verifyTurnstile(body.turnstile_token, ip)
    : { ok: true, skipped: true };
  if (!turnstile.ok) {
    return NextResponse.json(
      { ok: false, error: "Weryfikacja antyspamowa nie powiodła się. Odśwież stronę i spróbuj ponownie." },
      { status: 400 },
    );
  }

  // Rate-limit per IP (twardy limit zgłoszeń z jednego adresu w oknie czasu).
  if (await rateLimited(ip_hash)) {
    return NextResponse.json(
      { ok: false, error: "Za dużo zgłoszeń z tego adresu. Odczekaj chwilę i spróbuj ponownie." },
      { status: 429 },
    );
  }
  // ────────────────────────────────────────────────────────────────────

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

  // Wynajem: e-mail jest wymagany, bo cała mechanika opiera się na automatycznym
  // mailu z linkiem do listy mieszkań (zapowiadanym telefonem przez Arkadiusza).
  if (body.source === "rental_zamyslow" && !email) {
    return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
  }

  // E-mail jest opcjonalny w większości formularzy, ale jeśli ktoś go podał -
  // musi być poprawny. W newsletterze jest wymagany (sprawdzony wyżej).
  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Podaj poprawny adres e-mail." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAnon();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

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

  // GetResponse - zapis na listę newslettera (z tagiem źródła do późniejszej segmentacji):
  //  - z formularza newslettera (newsletter_footer) ZAWSZE,
  //  - z innych formularzy tylko gdy zaznaczono zgodę (newsletter_consent).
  // subscribeToNewsletter nie rzuca, ale obejmujemy try/catch dla pewności -
  // problem z GetResponse NIE może zepsuć zapisu leada (jest już w bazie).
  if ((body.source === "newsletter_footer" || newsletter_consent) && email && isValidEmail(email)) {
    try {
      await subscribeToNewsletter({
        email,
        name: full_name,
        source: body.source,
        extraTags: body.course_context ? ["zrodlo_kurs"] : undefined,
        // Osoby od kursu -> osobna lista, na której autoresponder „dzień 0" wysyła streszczenie.
        campaignId: body.course_context
          ? process.env.GETRESPONSE_COURSE_CAMPAIGN_ID?.trim() || undefined
          : undefined,
      });
    } catch (e) {
      console.error("[leads] GetResponse subscribe nieudany (lead i tak zapisany):", e);
    }
  }

  // Newsletter to osobny temat - listę i double opt-in obsługuje GetResponse
  // (mail potwierdzający + wypisywanie). My nie wysyłamy tu żadnego maila
  // transakcyjnego. U nas Resend = tylko reakcja na formularz kontaktowy / kurs.
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
    //    żeby biuro mogło odpowiedzieć wprost do zgłaszającego. Dla wynajmu
    //    dorzucamy bezpośrednio Arkadiusza - to on oddzwania do zgłaszających.
    const officeRecipients =
      body.source === "rental_zamyslow"
        ? Array.from(new Set([...LEAD_NOTIFY_RECIPIENTS, RENTAL_AGENT.email]))
        : LEAD_NOTIFY_RECIPIENTS;
    const office = leadOfficeNotification(emailData);
    jobs.push(
      sendEmail({
        to: officeRecipients,
        subject: office.subject,
        html: office.html,
        text: office.text,
        replyTo: email ?? undefined,
      }),
    );

    // 2) Potwierdzenie do klienta - tylko gdy podał poprawny e-mail.
    if (email && isValidEmail(email)) {
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

