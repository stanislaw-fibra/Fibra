import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// Wspólny szablon maili Fibra. Czysty, stonowany, oparty na tabelach + style
// inline (jedyne, co niezawodnie działa w Gmailu / Apple Mail / Outlooku).
// Paleta marki ze strony: granat #005a94, pomarańcz #f26522, atrament #14171c.
//
// Język: naturalny polski, bez myślników em (—), bez sloganów. Spokojny, rzeczowy ton.
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  ink: "#14171c",
  muted: "#5b6470",
  faint: "#8a929c",
  border: "#e7e3dc",
  paper: "#f4f1ec",
  card: "#ffffff",
  brand: "#005a94",
  brandDark: "#004878",
  accent: "#f26522",
} as const;

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Bezpieczne escapowanie wartości użytkownika wstawianych do HTML maila. */
export function esc(v: string | null | undefined): string {
  if (!v) return "";
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Akapit tekstu. */
export function p(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.ink};">${html}</p>`;
}

/** Drobny, stonowany akapit (np. dopiski). */
export function pMuted(html: string): string {
  return `<p style="margin:0 0 12px;font-family:${FONT};font-size:13.5px;line-height:1.6;color:${C.muted};">${html}</p>`;
}

/** Przycisk CTA. */
export function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
    <tr><td style="border-radius:8px;background:${C.brand};">
      <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${esc(label)}</a>
    </td></tr>
  </table>`;
}

/** Cienka linia rozdzielająca. */
export function divider(): string {
  return `<div style="height:1px;background:${C.border};margin:24px 0;"></div>`;
}

/** Tabela "etykieta: wartość" - do podsumowania zgłoszenia w mailu do biura. */
export function dataRows(rows: Array<{ label: string; value: string | null | undefined }>): string {
  const visible = rows.filter((r) => r.value && r.value.trim().length > 0);
  if (visible.length === 0) return "";
  const body = visible
    .map(
      (r) => `<tr>
        <td style="padding:8px 16px 8px 0;font-family:${FONT};font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:${C.faint};vertical-align:top;white-space:nowrap;">${esc(r.label)}</td>
        <td style="padding:8px 0;font-family:${FONT};font-size:14.5px;line-height:1.55;color:${C.ink};">${(r.value ?? "")
          .split("\n")
          .map((line) => esc(line))
          .join("<br>")}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border-top:1px solid ${C.border};border-bottom:1px solid ${C.border};margin:4px 0 8px;">${body}</table>`;
}

export interface ShellOptions {
  /** Tekst-zajawka widoczny w skrzynce przed otwarciem (preheader). */
  preheader: string;
  /** Nagłówek H1 wewnątrz maila. */
  heading: string;
  /** Gotowy HTML treści (akapity, przyciski, tabele - z helperów wyżej). */
  contentHtml: string;
}

/** Składa pełny dokument HTML maila wokół przekazanej treści. */
export function emailShell({ preheader, heading, contentHtml }: ShellOptions): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${C.paper};">${esc(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.paper};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">

        <tr><td style="padding:0 4px 18px;">
          <span style="font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:0.22em;color:${C.brand};text-transform:uppercase;">Fibra</span>
          <span style="font-family:${FONT};font-size:13px;letter-spacing:0.16em;color:${C.faint};text-transform:uppercase;"> Nieruchomości</span>
        </td></tr>

        <tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:14px;padding:36px 36px 32px;">
          <h1 style="margin:0 0 20px;font-family:${FONT};font-size:23px;line-height:1.3;font-weight:700;color:${C.ink};">${esc(heading)}</h1>
          ${contentHtml}
        </td></tr>

        <tr><td style="padding:22px 8px 4px;">
          <p style="margin:0 0 6px;font-family:${FONT};font-size:12.5px;line-height:1.6;color:${C.muted};">
            <strong style="color:${C.ink};">Grupa Fibra Sp. z o.o.</strong><br>
            ul. Rymera 177, 44-310 Radlin<br>
            <a href="tel:+48510777200" style="color:${C.brand};text-decoration:none;">510 777 200</a> &nbsp;·&nbsp;
            <a href="mailto:${OFFICE_EMAIL}" style="color:${C.brand};text-decoration:none;">${OFFICE_EMAIL}</a>
          </p>
          <p style="margin:0;font-family:${FONT};font-size:11.5px;line-height:1.6;color:${C.faint};">
            <a href="https://fibra.pl" style="color:${C.faint};text-decoration:underline;">fibra.pl</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Adres pokazywany w stopce maila (kontakt dla odbiorcy). To grupafibra.pl,
// bo tam biuro realnie odbiera pocztę (nadawca to osobna domena nadawcza fibra.pl).
const OFFICE_EMAIL = process.env.PUBLIC_OFFICE_EMAIL?.trim() || "biuro@grupafibra.pl";
