/**
 * Karty lokali (PDF, A4) dla mieszkań pięter 1-5 - M7..M36.
 *
 *   npx tsx scripts/zamyslow-unit-cards.ts [--only=m12]
 *
 * Parter celowo pominięty: mieszkania z ogródkami/tarasami dostaną osobny
 * wariant karty, gdy będzie gotowa koncepcja ogródków.
 *
 * Układ wzorowany na kartach z poprzedniego etapu (Galactica), ale w języku
 * wizualnym strony: Instrument Serif + Inter, papier/atrament/akcent, czysty
 * rzut lokalu ze znacznikami pokoi, wizualizacja z podświetlonym piętrem,
 * miniatura kondygnacji z zaznaczonym lokalem, kompas północy, norma PN-ISO.
 *
 * Render: HTML (wszystkie zasoby wbudowane base64) -> Chrome headless
 * --print-to-pdf. Wynik: public/investments/zamyslow/karty/karta-lokalu-mX.pdf
 */
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  zamyslowData,
  buildingViewBox,
  FLOOR_PLAN_NORTH_DEG,
  ZAMYSLOW_PHONE,
} from "../src/lib/investments/zamyslow-data";
import roomPositions from "../src/lib/investments/zamyslow-unit-rooms.json";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MASTER_VIZ = "public/investments/zamyslow/images/wizualizacja-6-master-3309x1847.jpg";
const OUT_DIR = "public/investments/zamyslow/karty";
const CONTACT = { name: "Grupa Fibra", email: "arkadiusz.jezusek@fibra.pl", site: "fibra.pl" };

const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]?.toUpperCase();

/**
 * Pomieszczenia czytamy z OPUBLIKOWANEGO arkusza (jak strona oferty), żeby
 * numeracja, nazwy i metraże na karcie były 1:1 z tym, co widzi kupujący.
 * (zamyslow-units.ts ma "server-only", więc parsujemy tu minimalnie sami.)
 */
const SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQivrSotst5b5hgIt3qpQ-CzC76fgKae3WmQy4wZtdZ4Q-eyQF8CaPgEW6PUUf41yKfx6WZXtXw0W0F/pub?output=csv";

type SheetRoom = { name: string; areaM2: number };
type SheetUnit = { rooms: SheetRoom[]; areaM2: number; outdoor: string; outdoorArea: string };

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else q = false; } else field += c; continue; }
    if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  row.push(field); rows.push(row);
  return rows;
}
const num = (v: string) => { const n = parseFloat((v ?? "").replace(",", ".").replace(/[^\d.]/g, "")); return Number.isFinite(n) ? n : 0; };

async function fetchSheetUnits(): Promise<Map<string, SheetUnit>> {
  const res = await fetch(SHEET_CSV);
  if (!res.ok) throw new Error(`Arkusz odpowiedział ${res.status}`);
  const rows = parseCsv(await res.text());
  const hi = rows.findIndex((r) => r.map((c) => c.trim().toLowerCase()).includes("id"));
  if (hi === -1) throw new Error("Brak wiersza nagłówków w arkuszu");
  const H = rows[hi].map((c) => c.trim().toLowerCase());
  const col = (n: string) => H.indexOf(n);
  const like = (fr: string) => H.findIndex((h) => h.includes(fr));
  const c = { id: col("id"), area: col("powierzchnia"), salon: col("salon z aneksem"),
    s1: col("sypialnia 1"), s2: col("sypialnia 2"), bath: col("łazienka"),
    out: like("balkon / taras"), outA: like("pow. balkonu") };
  const map = new Map<string, SheetUnit>();
  for (let r = hi + 1; r < rows.length; r++) {
    const row = rows[r];
    const id = (row[c.id] ?? "").trim().toUpperCase();
    if (!/^M\d{1,2}$/.test(id)) continue;
    const rooms: SheetRoom[] = [];
    const push = (name: string, i: number) => { const a = num(row[i] ?? ""); if (a > 0) rooms.push({ name, areaM2: a }); };
    push("Salon z aneksem kuchennym", c.salon);
    push("Sypialnia", c.s1);
    push("Sypialnia 2", c.s2);
    push("Łazienka", c.bath);
    if (rooms.some((x) => x.name === "Sypialnia 2")) {
      const first = rooms.find((x) => x.name === "Sypialnia");
      if (first) first.name = "Sypialnia 1";
    }
    map.set(id, { rooms, areaM2: num(row[c.area] ?? ""), outdoor: (row[c.out] ?? "").trim(), outdoorArea: (row[c.outA] ?? "").trim() });
  }
  return map;
}

const b64 = (p: string, mime: string) => `data:${mime};base64,${readFileSync(p).toString("base64")}`;

/** @font-face z lokalnych woff2 (latin + latin-ext, polskie znaki). */
function fontCss(): string {
  const manifest = JSON.parse(readFileSync("scripts/assets/fonts/manifest.json", "utf-8")) as {
    family: string; style: string; weight: number; file: string; unicodeRange: string;
  }[];
  return manifest
    .map((f) => `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};src:url(${b64(`scripts/assets/fonts/${f.file}`, "font/woff2")}) format('woff2');unicode-range:${f.unicodeRange};}`)
    .join("\n");
}

/** Kompas jak FloorPlanCompass - igła obrócona o zmierzony kąt północy. */
function compassSvg(size: number): string {
  const a = (FLOOR_PLAN_NORTH_DEG * Math.PI) / 180;
  const nx = 24 + Math.sin(a) * 15.8, ny = 24 - Math.cos(a) * 15.8;
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="rgba(255,255,255,0.88)" stroke="rgba(11,15,20,0.14)" stroke-width="1"/>
    <g transform="rotate(${FLOOR_PLAN_NORTH_DEG} 24 24)">
      <path d="M24 11.5 L24 24 L20.9 24 Z" fill="#0b0f14" opacity="0.62"/>
      <path d="M24 11.5 L27.1 24 L24 24 Z" fill="#0b0f14"/>
      <path d="M24 36.5 L20.9 24 L24 24 Z" fill="rgba(11,15,20,0.30)"/>
      <path d="M24 36.5 L24 24 L27.1 24 Z" fill="rgba(11,15,20,0.18)"/>
    </g>
    <circle cx="24" cy="24" r="1.15" fill="#fff" stroke="rgba(11,15,20,0.4)" stroke-width="0.7"/>
    <text x="${nx}" y="${ny}" font-size="8" font-weight="700" fill="#0b0f14" text-anchor="middle" dominant-baseline="central" font-family="Inter">N</text>
  </svg>`;
}

/** Wizualizacja budynku z podświetlonym piętrem (akcent marki, jak w starej karcie). */
async function heroForFloor(floorId: string): Promise<string> {
  const floor = zamyslowData.floors.find((f) => f.id === floorId)!;
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${buildingViewBox.width} ${buildingViewBox.height}" width="1500" height="838">
    <path d="${floor.polygons.left}" fill="#f26522" fill-opacity="0.40" stroke="#f26522" stroke-width="5"/>
    <path d="${floor.polygons.right}" fill="#f26522" fill-opacity="0.40" stroke="#f26522" stroke-width="5"/>
  </svg>`;
  const base = await sharp(MASTER_VIZ).resize(1500, 838, { fit: "fill" }).toBuffer();
  const buf = await sharp(base)
    .composite([{ input: Buffer.from(overlay) }])
    .jpeg({ quality: 76, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

const fmt = (v: number) => v.toFixed(2).replace(".", ",");
const floorLabel = (n: number) => (n === 0 ? "Parter" : `${n}. piętro`);

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const sheet = await fetchSheetUnits();
  console.log(`arkusz: ${sheet.size} mieszkań\n`);
  const fonts = fontCss();
  const logo = b64("public/Fibra - logo firmy.svg", "image/svg+xml");
  const heroCache = new Map<string, string>();
  const miniCache = new Map<string, string>();
  const positions = roomPositions as Record<string, { fx: number; fy: number; areaM2: number }[]>;

  let made = 0;
  for (const floor of zamyslowData.floors) {
    if (floor.id === "ground") continue; // parter: osobny wariant, gdy będą ogródki
    const plan = floor.floorPlan!;
    if (!heroCache.has(floor.id)) heroCache.set(floor.id, await heroForFloor(floor.id));
    const hero = heroCache.get(floor.id)!;
    const floorNo = Number(floor.id.replace("floor-", ""));

    if (!miniCache.has(floor.id)) {
      const src = `public/investments/zamyslow/floorplans/${floor.id === "floor-1" ? "floor-1-plan-v3-north" : `${floor.id}-plan`}.webp`;
      const buf = await sharp(src).resize({ width: 760 }).flatten({ background: "#ffffff" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      miniCache.set(floor.id, `data:image/jpeg;base64,${buf.toString("base64")}`);
    }
    const floorPlanImg = miniCache.get(floor.id)!;

    for (const unit of plan.units) {
      if (only && unit.id !== only) continue;
      const su = sheet.get(unit.id);
      if (!su || su.rooms.length === 0) throw new Error(`Brak danych w arkuszu dla ${unit.id}`);

      // rzut lokalu: czysty webp (białe tło) + wymiary do proporcji kadru
      const unitImgPath = `public/investments/zamyslow/floorplans/units/${unit.id.toLowerCase()}.webp`;
      const meta = await sharp(unitImgPath).metadata();
      const unitImg = b64(unitImgPath, "image/webp");

      // Kadr rzutu liczony z geometrii strony (A4 794px):
      // 794 - 2*44 (padding) - 248 (lewa kolumna) - 26 (odstęp) = 432 na kolumnę,
      // minus 2*24 ramy = 384. W pionie zostaje ~556. Rama NIGDY nie wystaje.
      const maxW = 384, maxH = 556;
      const s = Math.min(maxW / meta.width!, maxH / meta.height!);
      const planW = Math.round(meta.width! * s), planH = Math.round(meta.height! * s);

      const pos = positions[unit.id] ?? [];
      // pokój (index listy) -> pozycja po metrażu, każdy znacznik raz
      const free = pos.map((p) => ({ ...p, used: false }));
      const chipFor = (areaM2: number) => {
        let best: (typeof free)[number] | null = null, diff = Infinity;
        for (const f of free) {
          if (f.used) continue;
          const d = Math.abs(f.areaM2 - areaM2);
          if (d < diff) { diff = d; best = f; }
        }
        if (best && diff <= 0.6) { best.used = true; return best; }
        return null;
      };
      const chips = su.rooms.map((room, i) => {
        const p = chipFor(room.areaM2);
        if (!p) return "";
        return `<div class="chip" style="left:${(p.fx * 100).toFixed(2)}%;top:${(p.fy * 100).toFixed(2)}%">
          <span class="chip-n">${i + 1}</span><span class="chip-a">${fmt(room.areaM2)} m²</span>
        </div>`;
      }).join("");

      const rows = su.rooms.map((room, i) => `
        <div class="room">
          <span class="room-n">${i + 1}</span>
          <span class="room-name">${room.name}</span>
          <span class="room-dots"></span>
          <span class="room-a">${fmt(room.areaM2)} m²</span>
        </div>`).join("");

      const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>
${fonts}
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:0}
:root{--ink:#0b0f14;--ink6:#4b5563;--ink5:#6e7884;--ink4:#9aa3ad;--line:rgba(11,15,20,0.12);--paper:#fafaf8;--warm:#f6f2ea;--accent:#f26522;--brand:#0d948f}
body{width:794px;height:1123px;overflow:hidden;font-family:'Inter',sans-serif;color:var(--ink);background:#fff;display:flex;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between;padding:26px 44px 20px;background:var(--paper)}
.top img{height:30px;display:block}
.top .inv{text-align:right}
.top .inv .a{font-family:'Instrument Serif',serif;font-size:19px;line-height:1.1}
.top .inv .b{font-size:10.5px;color:var(--ink5);margin-top:4px;letter-spacing:0.04em}
.hero{position:relative;height:252px;overflow:hidden}
.hero img{width:100%;height:100%;object-fit:cover;display:block}
.hero .tag{position:absolute;right:26px;bottom:22px;background:rgba(7,9,12,0.85);color:#fff;border-radius:14px;padding:14px 20px;text-align:right;backdrop-filter:blur(4px)}
.hero .tag .fl{font-size:9.5px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.62)}
.hero .tag .id{font-size:30px;font-weight:700;letter-spacing:-0.02em;margin-top:3px;line-height:1}
.hero .tag .id i{font-style:normal;color:var(--accent)}
.hero .tag .ar{font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px;font-variant-numeric:tabular-nums}
.main{flex:1;display:flex;gap:26px;padding:30px 44px 24px;background:#fff}
.left{width:248px;flex-shrink:0;display:flex;flex-direction:column}
.eyebrow{font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink4);display:flex;align-items:center;gap:9px}
.eyebrow::before{content:"";display:block;width:26px;height:1px;background:var(--brand)}
h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:27px;line-height:1.12;margin-top:12px}
.rooms{margin-top:18px}
.room{display:flex;align-items:baseline;gap:9px;padding:9.5px 0;border-bottom:1px solid var(--line)}
.room:first-child{border-top:1px solid var(--line)}
.room-n{width:19px;height:19px;border-radius:50%;background:var(--ink);color:#fff;font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;align-self:center;flex-shrink:0}
.room-name{font-size:11.5px;color:var(--ink6);line-height:1.25}
.room-dots{flex:1;border-bottom:1px dotted rgba(11,15,20,0.22);transform:translateY(-3px);min-width:12px}
.room-a{font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.extra{display:flex;align-items:center;gap:9px;padding:9.5px 0;color:var(--ink5);font-size:11.5px}
.extra .plus{width:19px;height:19px;border-radius:50%;border:1px solid var(--ink4);color:var(--ink4);font-size:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.total{margin-top:14px;background:var(--ink);border-radius:14px;padding:16px 18px;color:#fff}
.total .l{font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.55)}
.total .v{font-family:'Instrument Serif',serif;font-size:33px;color:var(--accent);margin-top:5px;line-height:1}
.total .v small{font-family:'Inter';font-size:12px;color:rgba(255,255,255,0.5);margin-left:4px}
.norm{margin-top:10px;font-size:8.5px;line-height:1.5;color:var(--ink4)}
.mini{margin-top:auto}
.mini .cap{font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink4);margin-bottom:8px}
.mini .map{position:relative;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}
.mini .map img{width:100%;display:block}
.mini .map svg.ov{position:absolute;inset:0;width:100%;height:100%}
.mini .compass{position:absolute;right:7px;top:7px}
.right{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}
.planframe{position:relative;border:1px solid var(--line);border-radius:16px;background:#fff;padding:28px 24px 24px;max-width:100%;box-shadow:0 1px 2px rgba(11,15,20,0.04),0 18px 40px -22px rgba(11,15,20,0.16)}
.planwrap{position:relative;width:${planW}px;height:${planH}px}
.planwrap img{width:100%;height:100%;display:block}
.chip{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px}
.chip-n{width:22px;height:22px;border-radius:50%;background:var(--ink);color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px rgba(255,255,255,0.85)}
.chip-a{background:rgba(255,255,255,0.94);border:1px solid var(--line);border-radius:6px;padding:1.5px 5px;font-size:9.5px;font-weight:600;font-variant-numeric:tabular-nums;color:#374151;white-space:nowrap}
.plan-cap{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink4)}
.foot{background:var(--ink);color:rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:space-between;padding:17px 44px;font-size:11px}
.foot b{color:#fff;font-weight:600}
.foot .r{display:flex;gap:18px;font-variant-numeric:tabular-nums}
</style></head><body>
  <div class="top">
    <img src="${logo}" alt="Fibra">
    <div class="inv">
      <div class="a">Osiedle Zamysłów · Etap II</div>
      <div class="b">Rybnik, ul. Niedobczycka · budynek 128G</div>
    </div>
  </div>

  <div class="hero">
    <img src="${hero}" alt="">
    <div class="tag">
      <div class="fl">${floorLabel(floorNo)} · Osiedle Zamysłów</div>
      <div class="id">${unit.id}<i>.</i></div>
      <div class="ar">${fmt(su.areaM2)} m² · ${unit.rooms} ${unit.rooms === 1 ? "pokój" : "pokoje"}</div>
    </div>
  </div>

  <div class="main">
    <div class="left">
      <div class="eyebrow">Zestawienie powierzchni</div>
      <h2>Pomieszczenia.</h2>
      <div class="rooms">${rows}
        <div class="extra"><span class="plus">+</span><span>${su.outdoor || "Balkon"}${su.outdoorArea ? ` · ${su.outdoorArea.replace(".", ",")}` : ""}</span></div>
      </div>
      <div class="total">
        <div class="l">Powierzchnia użytkowa</div>
        <div class="v">${fmt(su.areaM2)}<small>m²</small></div>
      </div>
      <p class="norm">Powierzchnia użytkowa obliczona na podstawie normy PN-ISO 9836:2015.</p>
      <div class="mini">
        <div class="cap">Położenie na piętrze · ${floorLabel(floorNo)}</div>
        <div class="map">
          <img src="${floorPlanImg}" alt="">
          <svg class="ov" viewBox="0 0 ${plan.viewBox.width} ${plan.viewBox.height}" preserveAspectRatio="none">
            <path d="M0 0H${plan.viewBox.width}V${plan.viewBox.height}H0Z ${unit.d}" fill="rgba(250,250,248,0.55)" fill-rule="evenodd"/>
            <path d="${unit.d}" fill="rgba(0,221,214,0.18)" stroke="rgba(13,148,143,0.95)" stroke-width="3"/>
          </svg>
          <div class="compass">${compassSvg(26)}</div>
        </div>
      </div>
    </div>
    <div class="right">
      <div class="planframe">
        <div class="planwrap">
          <img src="${unitImg}" alt="Rzut mieszkania ${unit.id}">
          ${chips}
        </div>
        <div style="position:absolute;left:12px;top:12px">${compassSvg(32)}</div>
      </div>
      <div class="plan-cap" style="width:${planW + 48}px;max-width:100%"><span>Rzut mieszkania ${unit.id}</span><span>Skala poglądowa</span></div>
    </div>
  </div>

  <div class="foot">
    <span><b>${CONTACT.name}</b> · ${CONTACT.site}</span>
    <span class="r"><span>${CONTACT.email}</span><span>${ZAMYSLOW_PHONE.display}</span></span>
  </div>
</body></html>`;

      const htmlPath = `/tmp/karta-${unit.id.toLowerCase()}.html`;
      const pdfPath = path.join(OUT_DIR, `karta-lokalu-${unit.id.toLowerCase()}.pdf`);
      writeFileSync(htmlPath, html);
      execFileSync(CHROME, [
        "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        `--print-to-pdf=${pdfPath}`, htmlPath,
      ], { stdio: "pipe" });
      const kb = Math.round(statSync(pdfPath).size / 1024);
      console.log(`${unit.id.padEnd(4)} -> ${pdfPath} (${kb} kB)`);
      made++;
    }
  }
  console.log(`\nGotowe: ${made} kart w ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
