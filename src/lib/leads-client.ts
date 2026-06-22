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
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
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

