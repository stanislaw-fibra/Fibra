export type LeadSource =
  | "offer_page"
  | "offer_page_mini"
  | "contact_page"
  | "sprzedaj_page"
  | "home_form"
  | "newsletter_footer";

export type SubmitLeadInput = {
  source: LeadSource;
  offer_id?: string | null;
  galactica_offer_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  newsletter_consent?: boolean | null;
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

