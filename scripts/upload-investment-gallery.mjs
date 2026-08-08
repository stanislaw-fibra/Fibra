// Wgrywa zdjęcia galerii inwestycji do bucketa `investment-gallery`.
//
// Zdjęcia z dysku (folder podany w SOURCE_DIR) są przeskalowane i przekodowane do WebP -
// oryginały z drona ważą po 3-4 MB, a do galerii w zupełności wystarczy master 2560 px.
// Nazwa pliku w buckecie zaczyna się od numeru - to on ustala kolejność w galerii
// (`getGalleryPhotos()` sortuje po nazwie), więc żeby przestawić zdjęcia wystarczy
// zmienić prefiks. Reszta nazwy nie ma znaczenia dla kodu.
//
// Uruchomienie:  node scripts/upload-investment-gallery.mjs
// Podgląd bez wgrywania:  DRY_RUN=1 node scripts/upload-investment-gallery.mjs

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "investment-gallery";
const SOURCE_DIR = process.env.SOURCE_DIR ?? path.join(homedir(), "Desktop", "Zamyslow zdjeci");
const DRY_RUN = process.env.DRY_RUN === "1";

// Zapas na lightbox na pełnym ekranie i wyświetlacze 2x. Next/image i tak zejdzie
// niżej dla miniatur - w Storage trzymamy jeden master w dobrej jakości.
const MAX_WIDTH = 2560;
const QUALITY = 86;

// Ręczny wybór z folderu: same inwestycje, bez powtórek tego samego ujęcia
// i bez zdjęć miasta (rynek, teatr, zalew, kopalnia) - galeria ma pokazywać to,
// co Fibra wybudowała, a nie okolicę.
const SELECTION = [
  { file: "foto 01.jpg", alt: "Gotowy budynek mieszkalny na osiedlu w Rybniku-Zamysłowie" },
  { file: "foto 04.jpg", alt: "Budynek z garażami i kolejnym budynkiem w realizacji" },
  { file: "foto 13.jpg", alt: "Osiedle w Rybniku-Zamysłowie z lotu ptaka" },
  { file: "foto 02.jpg", alt: "Elewacja boczna gotowego budynku z balkonami" },
  { file: "foto 07.jpg", alt: "Budynek, garaże i parking widziane z góry" },
  { file: "foto 12.jpg", alt: "Budynek oddany do użytku obok budynku w budowie" },
  { file: "foto 17.jpg", alt: "Osiedle i okoliczna zabudowa Rybnika-Zamysłowa" },
  { file: "foto 11.jpg", alt: "Budynek mieszkalny z parkingiem i terenem zielonym" },
  { file: "foto 19.jpg", alt: "Osiedle w otoczeniu pól i zieleni pod Rybnikiem" },
  { file: "foto 5.jpg", alt: "Wcześniejsza realizacja Fibry - budynek z parkingiem" },
  { file: "foto 1.jpg", alt: "Zabudowane osiedle Fibry z lotu ptaka" },
  { file: "foto 11-kopia.jpg", alt: "Budynek mieszkalny na skraju osiedla" },
];

function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const kb = (b) => `${(b / 1024).toFixed(0)} kB`;

async function main() {
  const env = loadEnv();
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  if (!DRY_RUN) {
    const { data: buckets, error: bErr } = await db.storage.listBuckets();
    if (bErr) throw bErr;
    if (!buckets.some((b) => b.name === BUCKET)) {
      const { error } = await db.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: "10MB",
        allowedMimeTypes: ["image/webp", "image/jpeg", "image/png"],
      });
      if (error) throw error;
      console.log(`Utworzono bucket ${BUCKET} (publiczny).`);
    }
  }

  let totalIn = 0;
  let totalOut = 0;

  for (const [i, item] of SELECTION.entries()) {
    const src = path.join(SOURCE_DIR, item.file);
    const input = readFileSync(src);
    totalIn += input.length;

    const output = await sharp(input)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    totalOut += output.length;

    // 01_..., 02_... - prefiks trzyma kolejność przy sortowaniu po nazwie.
    const name = `${String(i + 1).padStart(2, "0")}_${item.file
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()}.webp`;

    console.log(`  ${name.padEnd(28)} ${kb(input.length).padStart(9)} -> ${kb(output.length).padStart(8)}`);

    if (DRY_RUN) continue;

    const { error } = await db.storage.from(BUCKET).upload(name, output, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) throw error;
  }

  console.log(
    `\n${SELECTION.length} zdjęć: ${(totalIn / 1024 / 1024).toFixed(1)} MB -> ${(totalOut / 1024 / 1024).toFixed(1)} MB${DRY_RUN ? "  (DRY_RUN - nic nie wgrano)" : ""}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
