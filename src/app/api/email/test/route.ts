import { NextResponse } from "next/server";
import { isCronOrAdminAuthorized } from "@/lib/importer/cron-auth";
import { sendEmail, EMAIL_FROM, OFFICE_INBOX, DEFAULT_REPLY_TO } from "@/lib/email/resend";
import {
  leadClientConfirmation,
  leadOfficeNotification,
  courseAccessEmail,
} from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Endpoint diagnostyczny: wysyła przykładowy mail, żeby potwierdzić, że nadawca
// (RESEND_FROM) jest na zweryfikowanej domenie i Resend przyjmuje wysyłkę.
// Chroniony jak crony (IMPORT_SECRET/CRON_SECRET Bearer albo zalogowany admin).
//
// Użycie:
//   GET /api/email/test?to=ktos@przyklad.pl            -> domyślnie mail kursowy
//   GET /api/email/test?to=...&kind=client|office|course
//
// Zwraca konfigurację (from / reply-to / inbox) i wynik z Resend (id albo błąd).

async function handle(req: Request) {
  if (!(await isCronOrAdminAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const to = url.searchParams.get("to")?.trim();
  const kind = (url.searchParams.get("kind") || "course").trim();

  if (!to || !/.+@.+\..+/.test(to)) {
    return NextResponse.json(
      { error: "Podaj poprawny ?to=adres@email" },
      { status: 400 },
    );
  }

  let rendered;
  if (kind === "client") {
    rendered = leadClientConfirmation({
      source: "offer_page",
      full_name: "Test Testowy",
      email: to,
      galactica_offer_id: "FIB-TEST-0001",
    });
  } else if (kind === "office") {
    rendered = leadOfficeNotification({
      source: "offer_page",
      full_name: "Test Testowy",
      email: to,
      phone: "510 000 000",
      message: "To jest testowa wiadomość z formularza.",
      galactica_offer_id: "FIB-TEST-0001",
      newsletter_consent: true,
    });
  } else {
    rendered = courseAccessEmail({ email: to, customer_name: "Test Testowy" });
  }

  const result = await sendEmail({
    to,
    subject: `[TEST] ${rendered.subject}`,
    html: rendered.html,
    text: rendered.text,
  });

  return NextResponse.json(
    {
      config: { from: EMAIL_FROM, replyTo: DEFAULT_REPLY_TO, officeInbox: OFFICE_INBOX },
      kind,
      to,
      result,
    },
    { status: result.ok ? 200 : 500 },
  );
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
