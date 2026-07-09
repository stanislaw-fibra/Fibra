import { captureAttributionFromUrl, getAttribution } from "@/lib/attribution";

export type LeadSource =
  | "offer_page"
  | "offer_page_mini"
  | "contact_page"
  | "sprzedaj_page"
  | "home_form"
  | "newsletter_footer"
  | "b2b_page"
  | "rental_zamyslow"
  | "investor_zamyslow";

export type SubmitLeadInput = {
  source: LeadSource;
  offer_id?: string | null;
  galactica_offer_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  newsletter_consent?: boolean | null;
  /** Zapis z kontekstu kursu (box w portalu kursu) - dokłada tag 'zrodlo-kurs'
   *  w GetResponse, po którym wyzwalamy wysyłkę streszczenia rysunkowego. */
  course_context?: boolean;
  // Pola anty-bot - dokładane przez useFormGuards (honeypot, znacznik czasu, token Turnstile).
  hp?: string;
  ts?: number;
  turnstile_token?: string;
};

export async function submitLead(input: SubmitLeadInput): Promise<void> {
  // Dokładamy atrybucję (gclid/utm) do KAŻDEGO leada niezależnie od formularza.
  // captureAttributionFromUrl na wszelki wypadek łapie parametry z bieżącego URL
  // (gdy ktoś wysyła na tej samej stronie, na którą wszedł z reklamy).
  captureAttributionFromUrl();
  const body = { ...input, ...getAttribution() };

  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = "Lead submission failed";
    try {
      const json = (await res.json()) as { error?: string };
      if (json?.error) msg = json.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
}

