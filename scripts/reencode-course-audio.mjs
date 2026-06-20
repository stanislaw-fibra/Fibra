// Backup + re-enkodowanie audiobooka kursu (bucket course-materials).
// KROK 1 (domyślnie): pobiera WSZYSTKIE materiały do .course-backup/originals/ (master backup),
//   przekodowuje audiobook do .course-backup/reencoded/ (mono, BITRATE, domyślnie 96k) i RAPORTUJE
//   rozmiary przed/po. NIC NIE WGRYWA do Supabase.
// KROK 2 (UPLOAD=1): wgrywa przekodowane MP3 z .course-backup/reencoded/audiobook/ z powrotem
//   do bucketa (nadpisanie tych samych ścieżek). Wymaga wcześniejszego kroku 1.
//
//   node scripts/reencode-course-audio.mjs              <- backup + encode + raport
//   BITRATE=128k node scripts/reencode-course-audio.mjs <- inna jakość
//   UPLOAD=1 node scripts/reencode-course-audio.mjs     <- wgranie przekodowanych plików
import { readFileSync, mkdirSync, writeFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

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
const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Brak URL/SERVICE_ROLE_KEY"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

const BUCKET = "course-materials";
const BITRATE = process.env.BITRATE || "96k";
const UPLOAD = process.env.UPLOAD === "1";
const ROOT = new URL("../.course-backup/", import.meta.url).pathname;
const ORIG = ROOT + "originals/";
const ENC = ROOT + "reencoded/";
const FFMPEG = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "ffmpeg"].find((p) => {
  try { execFileSync(p, ["-version"], { stdio: "ignore" }); return true; } catch { return false; }
});
const mb = (b) => (b / 1024 / 1024).toFixed(1) + " MB";
const sizeOf = (p) => statSync(p).size;

async function listAll(prefix = "") {
  // Zwraca płaską listę ścieżek plików (rekurencyjnie, jeden poziom zagłębienia wystarcza tu).
  const out = [];
  const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const e of data) {
    const path = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.id === null) { out.push(...(await listAll(path))); } // folder
    else out.push(path);
  }
  return out;
}

async function download(path, dest) {
  const { data, error } = await db.storage.from(BUCKET).download(path);
  if (error) throw error;
  const buf = Buffer.from(await data.arrayBuffer());
  mkdirSync(dest.substring(0, dest.lastIndexOf("/")), { recursive: true });
  writeFileSync(dest, buf);
  return buf.length;
}

async function uploadStep() {
  const dir = ENC + "audiobook/";
  if (!existsSync(dir)) { console.error("Brak przekodowanych plików. Najpierw odpal bez UPLOAD."); process.exit(2); }
  const files = readdirSync(dir).filter((f) => f.endsWith(".mp3"));
  console.log(`\n‼️  UPLOAD: wgrywam ${files.length} przekodowanych MP3 (nadpisanie w buckecie)\n`);
  for (const f of files) {
    const buf = readFileSync(dir + f);
    const { error } = await db.storage.from(BUCKET).upload(`audiobook/${f}`, buf, {
      contentType: "audio/mpeg", upsert: true,
    });
    if (error) throw error;
    console.log(`  ✓ audiobook/${f}  ${mb(buf.length)}`);
  }
  console.log("\nGotowe. Sprawdź licznik Storage w Supabase.\n");
}

async function main() {
  if (UPLOAD) return uploadStep();
  if (!FFMPEG) { console.error("Brak ffmpeg - poczekaj aż skończy się instalacja (brew install ffmpeg)."); process.exit(2); }

  console.log("Listuję course-materials i pobieram backup masterów…\n");
  const paths = await listAll();
  const audio = paths.filter((p) => p.endsWith(".mp3"));
  const other = paths.filter((p) => !p.endsWith(".mp3"));

  let origAudio = 0, encAudio = 0, otherBytes = 0;
  // PDF-y i reszta: tylko backup (bez zmian).
  for (const p of other) { otherBytes += await download(p, ORIG + p); }
  // Audiobook: backup + encode.
  console.log(`Audiobook: ${audio.length} plików, BITRATE=${BITRATE} mono\n`);
  for (const p of audio) {
    const src = ORIG + p;
    await download(p, src);
    const dst = ENC + p;
    mkdirSync(dst.substring(0, dst.lastIndexOf("/")), { recursive: true });
    execFileSync(FFMPEG, ["-y", "-i", src, "-ac", "1", "-b:a", BITRATE, "-map_metadata", "0", dst], { stdio: "ignore" });
    const a = sizeOf(src), b = sizeOf(dst);
    origAudio += a; encAudio += b;
    console.log(`  ${p.replace("audiobook/", "").padEnd(48)} ${mb(a).padStart(9)} -> ${mb(b).padStart(9)}`);
  }

  const newCourse = encAudio + otherBytes;
  console.log("\n==========================================================");
  console.log(`Audiobook:        ${mb(origAudio)}  ->  ${mb(encAudio)}   (oszczędność ${mb(origAudio - encAudio)})`);
  console.log(`PDF + reszta:     ${mb(otherBytes)} (bez zmian)`);
  console.log(`course-materials: ${mb(origAudio + otherBytes)}  ->  ${mb(newCourse)}`);
  console.log("==========================================================");
  console.log(`\nMaster backup:    ${ORIG}`);
  console.log(`Przekodowane:     ${ENC}audiobook/`);
  console.log(`\nPRÓBKA do odsłuchu (przed/po), np.:`);
  if (audio[1]) {
    console.log(`  oryginał:     ${ORIG}${audio[1]}`);
    console.log(`  przekodowany: ${ENC}${audio[1]}`);
  }
  console.log(`\nGdy zaakceptujesz jakość:  UPLOAD=1 node scripts/reencode-course-audio.mjs\n`);
}
main().catch((e) => { console.error(e); process.exit(1); });
