// Ręczne nadanie dostępu do kursu "20 Lekcji Inwestora" tak, jak przy NORMALNYM
// zakupie - odtwarza zamówienie przez produkcyjny webhook Imkera. Dzięki temu
// odpala się cały realny tor: wpis do course_access + mail powitalny (Resend) +
// (opcjonalnie) zapis na newsletter z autoresponderem. Do sprzedaży poza Imkerem
// (np. na konferencji).
//
// Czemu produkcja, nie localhost: mail powitalny wysyła Resend, którego klucz jest
// tylko na Vercelu. Dlatego domyślnie celujemy w https://fibra.pl.
//
// Wymaga w .env.local: IMKER_WEBHOOK_SECRET (ten sam co na Vercelu).
//
// Użycie:
//   node scripts/grant-course-access.mjs <email> [--name "Imię Nazwisko"] [--newsletter] [--url https://fibra.pl]
//
// Przykład (sprzedaż konferencyjna):
//   node scripts/grant-course-access.mjs m.lutrzyk@outlook.com --name "M. Lutrzyk" --newsletter

import { readFileSync } from "node:fs";

function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}

/** Produkt kursu w SalesCRM/Imker - musi się zgadzać z webhookiem (COURSE_PRODUCT_ID). */
const COURSE_PRODUCT_ID = 21500;

function parseArgs(argv) {
  const args = { email: null, name: null, newsletter: false, url: "https://fibra.pl" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--newsletter") args.newsletter = true;
    else if (a === "--name") args.name = argv[++i] ?? null;
    else if (a === "--url") args.url = argv[++i] ?? args.url;
    else if (!a.startsWith("--") && !args.email) args.email = a;
  }
  return args;
}

async function main() {
  const env = loadEnv();
  const secret = env.IMKER_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("Brak IMKER_WEBHOOK_SECRET w .env.local");
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const email = (args.email ?? "").trim().toLowerCase();
  if (!email || !/.+@.+\..+/.test(email)) {
    console.error('Podaj poprawny e-mail. Użycie: node scripts/grant-course-access.mjs <email> [--name "..."] [--newsletter]');
    process.exit(1);
  }

  const [firstName, ...rest] = (args.name ?? "").trim().split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ") || null;

  const payload = {
    order: {
      order_identifier: `manual-${email}-${new Date().toISOString().slice(0, 10)}`,
      email_address: email,
      first_name: firstName ?? null,
      last_name: lastName,
      newsletter: args.newsletter,
      order_items: [{ product_id: COURSE_PRODUCT_ID, quantity: 1 }],
    },
  };

  const url = `${args.url.replace(/\/$/, "")}/api/imker/webhook?key=${encodeURIComponent(secret)}`;
  console.log(`→ Nadaję dostęp dla ${email} (newsletter: ${args.newsletter ? "tak" : "nie"}) przez ${args.url}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log(`← HTTP ${res.status}: ${text}`);

  if (res.ok) {
    console.log(`✓ Gotowe. Mail powitalny poszedł na ${email}. Logowanie: ${args.url.replace(/\/$/, "")}/kurs/login`);
  } else {
    console.error("✗ Coś poszło nie tak - sprawdź odpowiedź wyżej.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
