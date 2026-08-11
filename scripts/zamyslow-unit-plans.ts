/**
 * Wycina rzut KAŻDEGO mieszkania z rzutu piętra.
 *
 *   npx tsx scripts/zamyslow-unit-plans.ts ["<katalog z SVG>"] [--scale=3]
 *
 * Skąd się to bierze:
 *  - rzut piętra renderujemy z tego samego SVG i w tej samej ramce co obrazy
 *    na stronie (te same okna kadru), tylko w wyższej rozdzielczości,
 *  - obrysy mieszkań bierzemy WPROST z `zamyslowData` (jedno źródło prawdy -
 *    te same wielokąty, które są klikalne w eksploratorze),
 *  - obrys jest dociągnięty do KOLORU mieszkania, czyli do wewnętrznej krawędzi
 *    ścian. Samo cięcie po nim obcięłoby ściany, dlatego maskę rozszerzamy
 *    (dylatacja) o grubość ściany - zmierzone na rzucie: 5,5-12 jednostek.
 *
 * Wynik:
 *  - public/investments/zamyslow/floorplans/units/m1.webp … m36.webp  (strona)
 *  - <Pulpit>/Rzuty mieszkan (karty lokali)/M1.png … M36.png          (druk/karta)
 */
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { zamyslowData } from "../src/lib/investments/zamyslow-data";

const DEFAULT_SRC = `${process.env.HOME}/Desktop/OLDER (MAJ 2026)`;
const args = process.argv.slice(2);
const SRC_DIR = args.find((a) => !a.startsWith("--")) ?? DEFAULT_SRC;
const SCALE = Number(args.find((a) => a.startsWith("--scale="))?.split("=")[1] ?? 3);

const DILATE_U = 6;   // jednostki viewBox - dobiera ściany do maski
const MARGIN_U = 5;   // margines kadru wokół mieszkania
const WEB_MAX_W = 900;  // szerokość wersji na stronę

/** Nazwa pliku SVG + okno kadru (przy RENDER_W=3000) - identyczne jak przy
 *  generowaniu rzutów pięter, dzięki czemu obrysy z danych pasują 1:1. */
const FLOORS: Record<string, { svg: string; win: { left: number; top: number; width: number; height: number }; out: { w: number; h: number } }> = {
  ground:    { svg: "Rzuty/Rzuty- new/rzut parteru architektura 13_07_26.svg", win: { left: 786, top: 1102, width: 3238, height: 1789 }, out: { w: 1812, h: 1001 } },
  "floor-1": { svg: "rzut 1 piętra architektura 13_07_26.svg",                 win: { left: 951, top: 1326, width: 2940, height: 1496 }, out: { w: 1645, h: 837 } },
  "floor-2": { svg: "Rzuty/Rzuty- new/rzut 2 piętra architektura 13_07_26.svg", win: { left: 951, top: 1326, width: 2940, height: 1496 }, out: { w: 1645, h: 837 } },
  "floor-3": { svg: "Rzuty/Rzuty- new/rzut 3 piętra architektura 13_07_26.svg", win: { left: 951, top: 1326, width: 2940, height: 1496 }, out: { w: 1645, h: 837 } },
  "floor-4": { svg: "Rzuty/Rzuty- new/rzut 4 piętra architektura 13_07_26.svg", win: { left: 951, top: 1326, width: 2940, height: 1496 }, out: { w: 1645, h: 837 } },
  "floor-5": { svg: "Rzuty/Rzuty- new/rzut 5 piętra architektura 13_07_26.svg", win: { left: 951, top: 1326, width: 2940, height: 1496 }, out: { w: 1645, h: 837 } },
};

const parsePath = (d: string): [number, number][] => {
  const n = (d.match(/-?[\d.]+/g) ?? []).map(Number);
  const p: [number, number][] = [];
  for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]);
  return p;
};

function rasterize(poly: [number, number][], W: number, H: number): Uint8Array {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const yy = y + 0.5;
    const xs: number[] = [];
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > yy) !== (yj > yy)) xs.push(xi + ((yy - yi) / (yj - yi)) * (xj - xi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.ceil(xs[k] - 0.5)), b = Math.min(W - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = a; x <= b; x++) m[y * W + x] = 1;
    }
  }
  return m;
}

/** Dylatacja kwadratem 2r+1, po pasmach - O(N), bez filtrowania piksel po pikselu. */
function dilate(m: Uint8Array, W: number, H: number, r: number): Uint8Array {
  const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
  const sweep = (src: Uint8Array, dst: Uint8Array, outer: number, inner: number, idx: (a: number, b: number) => number) => {
    for (let a = 0; a < outer; a++) {
      let run = -1;
      for (let b = 0; b <= inner; b++) {
        const on = b < inner && src[idx(a, b)];
        if (on && run < 0) run = b;
        if (!on && run >= 0) {
          const lo = Math.max(0, run - r), hi = Math.min(inner - 1, b - 1 + r);
          for (let k = lo; k <= hi; k++) dst[idx(a, k)] = 1;
          run = -1;
        }
      }
    }
  };
  sweep(m, tmp, H, W, (y, x) => y * W + x);
  sweep(tmp, out, W, H, (x, y) => y * W + x);
  return out;
}

const webDir = "public/investments/zamyslow/floorplans/units";
const masterDir = `${process.env.HOME}/Desktop/Rzuty mieszkan (karty lokali)`;
mkdirSync(webDir, { recursive: true });
mkdirSync(masterDir, { recursive: true });

async function main() {
let total = 0;
for (const floor of zamyslowData.floors) {
  const cfg = FLOORS[floor.id];
  const plan = floor.floorPlan;
  if (!cfg || !plan) continue;
  const svgPath = path.join(SRC_DIR, cfg.svg);
  if (!existsSync(svgPath)) {
    console.error(`BRAK pliku SVG: ${svgPath}`);
    process.exit(1);
  }

  const RENDER_W = 3000 * SCALE;
  const win = { left: cfg.win.left * SCALE, top: cfg.win.top * SCALE, width: cfg.win.width * SCALE, height: cfg.win.height * SCALE };
  const OUT = { w: cfg.out.w * SCALE, h: cfg.out.h * SCALE };
  const PX = OUT.w / plan.viewBox.width;

  const flat = `/tmp/zamyslow-unit-${floor.id}.png`;
  execFileSync("rsvg-convert", ["-w", String(RENDER_W), "--background-color=none", svgPath, "-o", flat]);
  const rot = await sharp(flat).rotate(-90).toBuffer();
  const floorBuf = await sharp(rot).extract(win).resize(OUT.w, OUT.h, { fit: "fill" }).rotate(180).png().toBuffer();
  const { data: fd } = await sharp(floorBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  console.log(`\n${floor.label}: rzut ${OUT.w}x${OUT.h} (${PX.toFixed(1)} px/jedn.)`);

  for (const unit of plan.units) {
    const poly = parsePath(unit.d).map(([x, y]) => [x * PX, y * PX] as [number, number]);
    const mask = dilate(rasterize(poly, OUT.w, OUT.h), OUT.w, OUT.h, Math.round(DILATE_U * PX));

    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < OUT.h; y++) for (let x = 0; x < OUT.w; x++) if (mask[y * OUT.w + x]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    const M = Math.round(MARGIN_U * PX);
    x0 = Math.max(0, x0 - M); y0 = Math.max(0, y0 - M);
    x1 = Math.min(OUT.w - 1, x1 + M); y1 = Math.min(OUT.h - 1, y1 + M);
    const cw = x1 - x0 + 1, chh = y1 - y0 + 1;

    const out = Buffer.alloc(cw * chh * 4);
    for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
      const si = ((y0 + y) * OUT.w + (x0 + x)) * 4, di = (y * cw + x) * 4;
      out[di] = fd[si]; out[di + 1] = fd[si + 1]; out[di + 2] = fd[si + 2];
      out[di + 3] = mask[(y0 + y) * OUT.w + (x0 + x)] ? fd[si + 3] : 0;
    }
    const raw = { raw: { width: cw, height: chh, channels: 4 as const } };
    const slug = unit.id.toLowerCase();
    // Master do karty lokalu: PNG z przezroczystym tłem (można podłożyć dowolne).
    await sharp(out, raw).png({ compressionLevel: 9 }).toFile(path.join(masterDir, `${unit.id}.png`));
    // Wersja na stronę: BEZ kanału alfa - rzut siedzi na białej karcie, a alfa
    // przy tak drobnym kreskowaniu potrafiła ważyć 3x tyle co sam obraz
    // (193 kB z alfą vs 67 kB bez, przy tej samej jakości).
    await sharp(out, raw)
      .resize({ width: Math.min(WEB_MAX_W, cw), withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .webp({ quality: 80, effort: 6 })
      .toFile(path.join(webDir, `${slug}.webp`));
    console.log(`  ${unit.id.padEnd(4)} ${String(cw).padStart(4)}x${String(chh).padStart(4)} px`);
    total++;
  }
}
console.log(`\nGotowe: ${total} rzutów mieszkań`);
console.log(`  strona : ${webDir}/m*.webp`);
console.log(`  mastery: ${masterDir}/M*.png`);
}

main().catch((e) => { console.error(e); process.exit(1); });
