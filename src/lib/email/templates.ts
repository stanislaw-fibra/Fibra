import "server-only";
import type { LeadSource } from "@/lib/leads-client";
import { RENTAL_AGENT } from "@/lib/rentals/zamyslow-rentals";
import { emailShell, p, pMuted, button, divider, dataRows, esc } from "./render";

// ─────────────────────────────────────────────────────────────────────────────
// Treści maili. Miejsce formularza = intencja osoby, więc copy jest dopasowane
// per źródło. Ton: naturalny, rzeczowy, bez myślników em i bez sloganów.
// ─────────────────────────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://fibra.pl";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface LeadEmailData {
  source: LeadSource;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  offer_id?: string | null;
  galactica_offer_id?: string | null;
  newsletter_consent?: boolean | null;
}

function firstName(full?: string | null): string {
  const t = (full ?? "").trim();
  if (!t) return "";
  return t.split(/\s+/)[0];
}

/** Grzecznościowy zwrot otwierający (HTML, z escapowaniem imienia). */
function greeting(full?: string | null): string {
  const name = firstName(full);
  return name ? `Dzień dobry, ${esc(name)}.` : "Dzień dobry.";
}

/** Wersja zwrotu do maili tekstowych (bez escapowania HTML). */
function greetingText(full?: string | null): string {
  const name = firstName(full);
  return name ? `Dzień dobry, ${name}.` : "Dzień dobry.";
}

// ── Mapa źródło → ludzka etykieta (dla biura) ──────────────────────────────────
const SOURCE_LABEL: Record<LeadSource, string> = {
  offer_page: "Formularz przy ofercie",
  offer_page_mini: "Szybki kontakt przy ofercie",
  contact_page: "Strona kontaktu",
  sprzedaj_page: "Strona „Sprzedaj”",
  home_form: "Formularz na stronie głównej",
  newsletter_footer: "Zapis na newsletter",
  b2b_page: "Strona dla firm",
  rental_zamyslow: "Wynajem Zamysłów (128F)",
};

// ── Potwierdzenie dla KLIENTA (copy per intencja) ──────────────────────────────
interface ClientCopy {
  subject: string;
  heading: string;
  // Funkcja, bo część treści zależy od danych (imię, numer oferty).
  body: (d: LeadEmailData) => string;
  textBody: (d: LeadEmailData) => string;
}

function offerRef(d: LeadEmailData): string | null {
  return d.galactica_offer_id?.trim() || null;
}

const CLIENT_COPY: Record<LeadSource, ClientCopy> = {
  offer_page: {
    subject: "Mamy Twoje zapytanie o ofertę",
    heading: "Dziękujemy za zainteresowanie",
    body: (d) => {
      const ref = offerRef(d);
      return (
        p(`${greeting(d.full_name)} Dotarło do nas Twoje zapytanie o ofertę${ref ? ` <strong>${esc(ref)}</strong>` : ""}.`) +
        p("Odezwiemy się, żeby odpowiedzieć na pytania i, jeśli zechcesz, umówić oglądanie. Zwykle kontaktujemy się w ciągu kilku godzin w dni robocze.") +
        pMuted("Jeśli chcesz coś dopowiedzieć wcześniej, po prostu odpowiedz na tę wiadomość.")
      );
    },
    textBody: (d) => {
      const ref = offerRef(d);
      return `${greetingText(d.full_name)}\n\nDotarło do nas Twoje zapytanie o ofertę${ref ? ` ${ref}` : ""}. Odezwiemy się, żeby odpowiedzieć na pytania i umówić oglądanie. Zwykle kontaktujemy się w ciągu kilku godzin w dni robocze.\n\nMożesz też po prostu odpowiedzieć na tę wiadomość.`;
    },
  },
  offer_page_mini: {
    subject: "Mamy Twoje zapytanie o ofertę",
    heading: "Dziękujemy za zainteresowanie",
    body: (d) => {
      const ref = offerRef(d);
      return (
        p(`${greeting(d.full_name)} Mamy Twoje zapytanie o ofertę${ref ? ` <strong>${esc(ref)}</strong>` : ""} i wkrótce się odezwiemy.`) +
        pMuted("Jeśli chcesz coś dopowiedzieć, odpowiedz na tę wiadomość.")
      );
    },
    textBody: (d) => {
      const ref = offerRef(d);
      return `${greetingText(d.full_name)}\n\nMamy Twoje zapytanie o ofertę${ref ? ` ${ref}` : ""} i wkrótce się odezwiemy.`;
    },
  },
  contact_page: {
    subject: "Dziękujemy za wiadomość",
    heading: "Dziękujemy, odezwiemy się wkrótce",
    body: (d) =>
      p(`${greeting(d.full_name)} Dziękujemy za wiadomość. Ktoś z naszego zespołu skontaktuje się z Tobą zwykle w ciągu kilku godzin w dni robocze.`) +
      pMuted("Jeśli chcesz coś dodać, odpowiedz na tę wiadomość."),
    textBody: (d) =>
      `${greetingText(d.full_name)}\n\nDziękujemy za wiadomość. Skontaktujemy się z Tobą zwykle w ciągu kilku godzin w dni robocze.`,
  },
  home_form: {
    subject: "Dziękujemy, oddzwonimy",
    heading: "Dziękujemy, oddzwonimy",
    body: (d) =>
      p(`${greeting(d.full_name)} Mamy Twoje zgłoszenie. Oddzwonimy możliwie szybko, zwykle w ciągu kilku godzin w dni robocze.`),
    textBody: (d) =>
      `${greetingText(d.full_name)}\n\nMamy Twoje zgłoszenie. Oddzwonimy możliwie szybko, zwykle w ciągu kilku godzin w dni robocze.`,
  },
  sprzedaj_page: {
    subject: "Pomożemy Ci sprzedać nieruchomość",
    heading: "Porozmawiajmy o sprzedaży",
    body: (d) =>
      p(`${greeting(d.full_name)} Dziękujemy za zgłoszenie. Przygotujemy bezpłatną wycenę i plan sprzedaży, a potem odezwiemy się, żeby omówić szczegóły.`) +
      pMuted("Jeśli chcesz coś dopowiedzieć o nieruchomości, odpowiedz na tę wiadomość."),
    textBody: (d) =>
      `${greetingText(d.full_name)}\n\nDziękujemy za zgłoszenie. Przygotujemy bezpłatną wycenę i plan sprzedaży, a potem odezwiemy się, żeby omówić szczegóły.`,
  },
  b2b_page: {
    subject: "Dziękujemy za kontakt",
    heading: "Mamy Twoje zapytanie",
    body: (d) =>
      p(`${greeting(d.full_name)} Dziękujemy za wiadomość. Wrócimy do Ciebie z konkretami dotyczącymi współpracy, zwykle w ciągu jednego dnia roboczego.`),
    textBody: (d) =>
      `${greetingText(d.full_name)}\n\nDziękujemy za wiadomość. Wrócimy do Ciebie z konkretami dotyczącymi współpracy, zwykle w ciągu jednego dnia roboczego.`,
  },
  rental_zamyslow: {
    subject: "Mieszkania na wynajem - Zamysłów, Niedobczycka 128F",
    heading: "Dziękujemy za zainteresowanie",
    body: (d) => {
      const url = `${SITE_URL}/wynajem-zamyslow`;
      return (
        p(`${greeting(d.full_name)} Dziękujemy za zainteresowanie mieszkaniami na wynajem przy ulicy Niedobczyckiej 128F w Rybniku (dzielnica Zamysłów).`) +
        p("Pod tym linkiem znajdziesz aktualną listę lokali: metraż, liczbę pokoi, odstępne, kaucję, miejsce postojowe i to, które są jeszcze dostępne. Listę aktualizujemy na bieżąco.") +
        button("Zobacz dostępne mieszkania", url) +
        p(`Wkrótce zadzwoni do Ciebie ${esc(RENTAL_AGENT.name)}, żeby odpowiedzieć na pytania i, jeśli zechcesz, umówić oglądanie.`) +
        divider() +
        pMuted(
          `Chcesz odezwać się od razu? Zadzwoń lub napisz SMS: <a href="tel:${RENTAL_AGENT.phoneTel}" style="color:#005a94;text-decoration:none;">${esc(RENTAL_AGENT.phoneDisplay)}</a>, e-mail: <a href="mailto:${RENTAL_AGENT.email}" style="color:#005a94;text-decoration:none;">${esc(RENTAL_AGENT.email)}</a>.`,
        )
      );
    },
    textBody: (d) => {
      const url = `${SITE_URL}/wynajem-zamyslow`;
      return `${greetingText(d.full_name)}

Dziękujemy za zainteresowanie mieszkaniami na wynajem przy ulicy Niedobczyckiej 128F w Rybniku (dzielnica Zamysłów).

Aktualną listę dostępnych lokali (metraż, pokoje, odstępne, kaucja, miejsce postojowe) znajdziesz tutaj:
${url}

Wkrótce zadzwoni do Ciebie ${RENTAL_AGENT.name}. Chcesz odezwać się od razu? Telefon i SMS: ${RENTAL_AGENT.phoneDisplay}, e-mail: ${RENTAL_AGENT.email}.`;
    },
  },
  newsletter_footer: {
    subject: "Jesteś na liście",
    heading: "Jesteś na liście",
    body: () =>
      p("Dziękujemy za zapis. Będziemy wysyłać Ci nowe oferty i informacje rynkowe, bez spamu.") +
      pMuted("Z subskrypcji możesz zrezygnować w każdej chwili, odpisując na dowolną naszą wiadomość."),
    textBody: () =>
      "Dziękujemy za zapis. Będziemy wysyłać Ci nowe oferty i informacje rynkowe, bez spamu. Z subskrypcji możesz zrezygnować w każdej chwili.",
  },
};

/** Mail potwierdzający dla klienta. Wymaga, by w danych był e-mail (sprawdza wołający). */
export function leadClientConfirmation(d: LeadEmailData): RenderedEmail {
  const copy = CLIENT_COPY[d.source];
  return {
    subject: copy.subject,
    html: emailShell({
      preheader: copy.subject,
      heading: copy.heading,
      contentHtml: copy.body(d),
    }),
    text: `${copy.textBody(d)}\n\nGrupa Fibra Sp. z o.o.\nul. Rymera 177, 44-310 Radlin\n510 777 200 · biuro@grupafibra.pl\nfibra.pl`,
  };
}

/** Powiadomienie do BIURA o nowym zgłoszeniu. Reply-To ustawia wołający na e-mail klienta. */
export function leadOfficeNotification(d: LeadEmailData): RenderedEmail {
  const label = SOURCE_LABEL[d.source];
  const ref = offerRef(d);
  const subject =
    d.source === "newsletter_footer"
      ? `Newsletter: nowy zapis${d.email ? ` (${d.email})` : ""}`
      : `Nowy lead: ${label}${ref ? ` · ${ref}` : ""}`;

  const rows = dataRows([
    { label: "Źródło", value: label },
    { label: "Imię i nazwisko", value: d.full_name ?? null },
    { label: "Telefon", value: d.phone ?? null },
    { label: "E-mail", value: d.email ?? null },
    { label: "Oferta", value: ref },
    { label: "Wiadomość", value: d.message ?? null },
    { label: "Newsletter", value: d.newsletter_consent ? "Tak, wyraził zgodę" : null },
  ]);

  const replyHint = d.email
    ? p(`Odpowiadając na tę wiadomość, napiszesz bezpośrednio do <strong>${esc(d.email)}</strong>.`)
    : d.phone
      ? pMuted(`Brak e-maila. Kontakt telefoniczny: <strong>${esc(d.phone)}</strong>.`)
      : "";

  const text = [
    `Nowe zgłoszenie: ${label}`,
    "",
    d.full_name ? `Imię i nazwisko: ${d.full_name}` : null,
    d.phone ? `Telefon: ${d.phone}` : null,
    d.email ? `E-mail: ${d.email}` : null,
    ref ? `Oferta: ${ref}` : null,
    d.message ? `\nWiadomość:\n${d.message}` : null,
    d.newsletter_consent ? "\nZgoda na newsletter: tak" : null,
  ]
    .filter((x) => x !== null)
    .join("\n");

  return {
    subject,
    html: emailShell({
      preheader: subject,
      heading: "Nowe zgłoszenie ze strony",
      contentHtml: rows + divider() + replyHint,
    }),
    text,
  };
}

// ── Dostęp do kursu (po zakupie przez Imkera) ──────────────────────────────────
export interface CourseAccessEmailData {
  email: string;
  customer_name?: string | null;
}

/** Mail z dostępem do kursu „20 Lekcji Inwestora”. */
export function courseAccessEmail(d: CourseAccessEmailData): RenderedEmail {
  const loginUrl = `${SITE_URL}/kurs/login`;
  const subject = "Twój dostęp do kursu 20 Lekcji Inwestora";
  const heading = "Witaj w kursie";

  const html = emailShell({
    preheader: "Zakup potwierdzony. Oto jak wejść do kursu.",
    heading,
    contentHtml:
      p(`${greeting(d.customer_name)} Dziękujemy za zakup kursu <strong>20 Lekcji Inwestora</strong>. Twój dostęp jest już aktywny.`) +
      p(`Aby wejść do kursu, otwórz stronę logowania i podaj adres e-mail, którym opłaciłeś zamówienie: <strong>${esc(d.email)}</strong>.`) +
      button("Wejdź do kursu", loginUrl) +
      divider() +
      pMuted(`Gdyby przycisk nie działał, skopiuj ten adres do przeglądarki:<br>${esc(loginUrl)}`) +
      pMuted("Masz pytanie albo coś nie działa? Odpowiedz na tę wiadomość, pomożemy."),
  });

  const text = `${greetingText(d.customer_name)}

Dziękujemy za zakup kursu 20 Lekcji Inwestora. Twój dostęp jest już aktywny.

Aby wejść do kursu, otwórz stronę logowania i podaj adres e-mail, którym opłaciłeś zamówienie: ${d.email}

Logowanie: ${loginUrl}

Masz pytanie albo coś nie działa? Odpowiedz na tę wiadomość, pomożemy.

Grupa Fibra Sp. z o.o.
fibra.pl`;

  return { subject, html, text };
}
