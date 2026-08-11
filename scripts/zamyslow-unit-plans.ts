/**
 * Wycina rzut KAŻDEGO mieszkania z rzutu piętra + wyznacza pozycje pokoi.
 *
 *   npx tsx scripts/zamyslow-unit-plans.ts ["<katalog z SVG>"] [--scale=3]
 *
 * Jak to działa:
 *  - z SVG usuwamy rastrowe kafelki kreskowania (<image>) -> CZYSTY rzut
 *    (białe wnętrza + kreska), który wygląda po prostu lepiej i waży ~10x mniej,
 *  - kolorową wersję renderujemy osobno, bo kolor mieszkania służy do
 *    SEGMENTACJI pokoi: obszary koloru rozdzielone ścianami -> erozja domyka
 *    otwory drzwiowe -> spójne składowe -> przydział wszystkich pikseli koloru
 *    do najbliższej składowej (multi-source BFS) -> środek i pole każdego pokoju,
 *  - pokoje łączymy z listą pomieszczeń PO METRAŻU (najbliższa wartość,
 *    każdy obszar użyty raz; tolerancja 45%). Nadmiarowy obszar - zwykle
 *    przedpokój za drzwiami, którego arkusz nie wymienia osobno - zostaje
 *    bez znacznika. Gdy dopasowanie się nie domyka, mieszkanie nie dostaje
 *    pozycji i strona pokazuje rzut bez znaczników,
 *  - obrysy mieszkań bierzemy WPROST z `zamyslowData` (jedno źródło prawdy),
 *    a maskę rozszerzamy o grubość ściany (dylatacja, zmierzone 5,5-12 jedn.).
 *
 * Wynik:
 *  - public/investments/zamyslow/floorplans/units/m1..m36.webp   (strona, czyste)
 *  - <Pulpit>/Rzuty mieszkan (karty lokali)/M1..M36.png          (mastery, przezroczyste)
 *  - src/lib/investments/zamyslow-unit-rooms.json                (pozycje pokoi)
 */
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { zamyslowData } from "../src/lib/investments/zamyslow-data";

const DEFAULT_SRC = `${process.env.HOME}/Desktop/OLDER (MAJ 2026)`;
const args = process.argv.slice(2);
const SRC_DIR = args.find((a) => !a.startsWith("--")) ?? DEFAULT_SRC;
const SCALE = Number(args.find((a) => a.startsWith("--scale="))?.split("=")[1] ?? 3);

const DILATE_U = 6;    // jednostki viewBox - dobiera ściany do maski
const MARGIN_U = 5;    // margines kadru wokół mieszkania
const ERODE_U = 5;     // erozja domykająca otwory drzwiowe (drzwi ~9-10 jedn.)
const WEB_MAX_W = 1400;

const FLOORS: Record<string, { svg: string; win: { left: number; top: number; width: number; height: number }; out: { w: number; h: number } }> = {
  ground:    { svg: "Rzuty/Rzuty- new/rzut parteru architektura 13_07_26.svg", win: { left: 786, top: 1102, width: 3238, height: 1789 }, out: { w: 1812, h: 1001 } },
  "floor-1": { svg: "rzut 1 piętra architektura 13_07_26.svg",                 win: { left: 951, top: 1326, width: 2940, height: 1496 }, out: { w: 1645, h: 837 } },
  "floor-2": { svg: "Rzuty/Rzuty- new/rzut 2 piętra architektura 13_07_26.svg", win: { left: 951, top: 1326, width: 2940, height: 1496 }, out: { w: 1645, h: 837 } },
  "floor-3": { svg: "Rzuty/Rzuty- new/rzut 3 piętra architektura 13_07_26.svg", win: { left: 951, top: 1326, width: 2940, height: 1496 }, out: { w: 1645, h: 837 } },
  "floor-4": { svg: "Rzuty/Rzuty- new/rzut 4 piętra architektura 13_07_26.svg", win: { left: 951, top: 1326, width: 2940, height: 1496 }, out: { w: 1645, h: 837 } },
  "floor-5": { svg: "Rzuty/Rzuty- new/rzut 5 piętra architektura 13_07_26.svg", win: { left: 951, top: 1326, width: 2940, height: 1496 }, out: { w: 1645, h: 837 } },
};

type Pt = [number, number];
const parsePath = (d: string): Pt[] => {
  const n = (d.match(/-?[\d.]+/g) ?? []).map(Number);
  const p: Pt[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]);
  return p;
};

function rasterize(poly: Pt[], W: number, H: number): Uint8Array {
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

/** Morfologia kwadratem 2r+1 po pasmach - O(N). mode: 1 = dylatacja, 0 = erozja. */
function morph(m: Uint8Array, W: number, H: number, r: number, mode: 1 | 0): Uint8Array {
  const inv = (src: Uint8Array) => { const o = new Uint8Array(src.length); for (let i = 0; i < src.length; i++) o[i] = src[i] ? 0 : 1; return o; };
  const dil = (src: Uint8Array): Uint8Array => {
    const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      let run = -1;
      for (let x = 0; x <= W; x++) {
        const on = x < W && src[y * W + x];
        if (on && run < 0) run = x;
        if (!on && run >= 0) {
          const lo = Math.max(0, run - r), hi = Math.min(W - 1, x - 1 + r);
          for (let k = lo; k <= hi; k++) tmp[y * W + k] = 1;
          run = -1;
        }
      }
    }
    for (let x = 0; x < W; x++) {
      let run = -1;
      for (let y = 0; y <= H; y++) {
        const on = y < H && tmp[y * W + x];
        if (on && run < 0) run = y;
        if (!on && run >= 0) {
          const lo = Math.max(0, run - r), hi = Math.min(H - 1, y - 1 + r);
          for (let k = lo; k <= hi; k++) out[k * W + x] = 1;
          run = -1;
        }
      }
    }
    return out;
  };
  return mode === 1 ? dil(m) : inv(dil(inv(m)));
}

/** Spójne składowe (4-sąsiedztwo). Zwraca etykiety 1..n i rozmiary. */
function components(m: Uint8Array, W: number, H: number): { labels: Int32Array; sizes: number[] } {
  const labels = new Int32Array(W * H);
  const sizes: number[] = [];
  const stack: number[] = [];
  let next = 0;
  for (let i = 0; i < W * H; i++) {
    if (!m[i] || labels[i]) continue;
    next += 1;
    let size = 0;
    stack.push(i);
    labels[i] = next;
    while (stack.length) {
      const j = stack.pop()!;
      size += 1;
      const x = j % W, y = (j / W) | 0;
      if (x > 0 && m[j - 1] && !labels[j - 1]) { labels[j - 1] = next; stack.push(j - 1); }
      if (x < W - 1 && m[j + 1] && !labels[j + 1]) { labels[j + 1] = next; stack.push(j + 1); }
      if (y > 0 && m[j - W] && !labels[j - W]) { labels[j - W] = next; stack.push(j - W); }
      if (y < H - 1 && m[j + W] && !labels[j + W]) { labels[j + W] = next; stack.push(j + W); }
    }
    sizes.push(size);
  }
  return { labels, sizes };
}

/** Rozlanie etykiet składowych na CAŁĄ maskę koloru (multi-source BFS) -
 *  dzięki temu pola pokoi liczą się z pełnych obszarów, nie z erodowanych. */
function watershed(colorMask: Uint8Array, seeds: Int32Array, W: number, H: number): Int32Array {
  const out = Int32Array.from(seeds);
  const q: number[] = [];
  for (let i = 0; i < W * H; i++) if (out[i]) q.push(i);
  let head = 0;
  while (head < q.length) {
    const j = q[head++];
    const x = j % W, y = (j / W) | 0;
    const nb = [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, y > 0 ? j - W : -1, y < H - 1 ? j + W : -1];
    for (const k of nb) {
      if (k >= 0 && colorMask[k] && !out[k]) { out[k] = out[j]; q.push(k); }
    }
  }
  return out;
}

const webDir = "public/investments/zamyslow/floorplans/units";
const masterDir = `${process.env.HOME}/Desktop/Rzuty mieszkan (karty lokali)`;
const roomsJsonPath = "src/lib/investments/zamyslow-unit-rooms.json";
mkdirSync(webDir, { recursive: true });
mkdirSync(masterDir, { recursive: true });

/** Usuwa rastrowe kafelki kreskowania z SVG -> czysty line-art. */
function makeCleanSvg(svgPath: string, outPath: string) {
  let s = readFileSync(svgPath, "utf-8");
  s = s.replace(/<image\b[^>]*\/>/g, "");
  s = s.replace(/<image\b[^>]*>[\s\S]*?<\/image>/g, "");
  writeFileSync(outPath, s);
}

async function main() {
  const roomsJson: Record<string, { fx: number; fy: number; areaM2: number }[]> = {};
  let total = 0, withRooms = 0;

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

    // render CZYSTY (do wycinków) i KOLOROWY (do segmentacji pokoi)
    const cleanSvg = `/tmp/zamyslow-clean-${floor.id}.svg`;
    makeCleanSvg(svgPath, cleanSvg);
    const flatClean = `/tmp/zamyslow-clean-${floor.id}.png`;
    const flatColor = `/tmp/zamyslow-color-${floor.id}.png`;
    execFileSync("rsvg-convert", ["-w", String(RENDER_W), "--background-color=none", cleanSvg, "-o", flatClean]);
    execFileSync("rsvg-convert", ["-w", String(RENDER_W), "--background-color=none", svgPath, "-o", flatColor]);

    const toFloor = async (src: string) => {
      const rot = await sharp(src).rotate(-90).toBuffer();
      return sharp(rot).extract(win).resize(OUT.w, OUT.h, { fit: "fill" }).rotate(180).png().toBuffer();
    };
    const cleanBuf = await toFloor(flatClean);
    const { data: fd } = await sharp(cleanBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    // wersja robocza kolorowa w skali 1x (PX2 = 2 px/jedn.) + blur scalający kreskowanie
    const SEG_W = cfg.out.w, SEG_H = cfg.out.h;
    const PX2 = SEG_W / plan.viewBox.width;
    const segRaw = await sharp(await toFloor(flatColor))
      .resize(SEG_W, SEG_H, { fit: "fill" })
      .blur(2.2)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const sd = segRaw.data;
    const colored = new Uint8Array(SEG_W * SEG_H);
    for (let p = 0; p < SEG_W * SEG_H; p++) {
      const i = p * 4;
      if (sd[i + 3] < 40) continue;
      const r = sd[i], g = sd[i + 1], b = sd[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx > 110 && (mx - mn) / mx > 0.05) colored[p] = 1;
    }

    console.log(`\n${floor.label}: rzut ${OUT.w}x${OUT.h}`);

    for (const unit of plan.units) {
      const polyHi = parsePath(unit.d).map(([x, y]) => [x * PX, y * PX] as Pt);
      const maskHi = morph(rasterize(polyHi, OUT.w, OUT.h), OUT.w, OUT.h, Math.round(DILATE_U * PX), 1);

      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < OUT.h; y++) for (let x = 0; x < OUT.w; x++) if (maskHi[y * OUT.w + x]) {
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
        out[di + 3] = maskHi[(y0 + y) * OUT.w + (x0 + x)] ? fd[si + 3] : 0;
      }
      const raw = { raw: { width: cw, height: chh, channels: 4 as const } };
      await sharp(out, raw).png({ compressionLevel: 9 }).toFile(path.join(masterDir, `${unit.id}.png`));
      await sharp(out, raw)
        .resize({ width: Math.min(WEB_MAX_W, cw), withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .webp({ quality: 80, effort: 6 })
        .toFile(path.join(webDir, `${unit.id.toLowerCase()}.webp`));
      total++;

      // ── segmentacja pokoi (na wersji roboczej 1x) ─────────────────────────
      const poly2 = parsePath(unit.d).map(([x, y]) => [x * PX2, y * PX2] as Pt);
      const inPoly = rasterize(poly2, SEG_W, SEG_H);
      const unitColor = new Uint8Array(SEG_W * SEG_H);
      let colorCount = 0;
      for (let p = 0; p < SEG_W * SEG_H; p++) if (inPoly[p] && colored[p]) { unitColor[p] = 1; colorCount++; }

      const eroded = morph(unitColor, SEG_W, SEG_H, Math.round(ERODE_U * PX2), 0);
      const { labels, sizes } = components(eroded, SEG_W, SEG_H);
      const pxPerM2 = colorCount / unit.areaM2;
      // odfiltruj drobiazgi; zostają pokoje ORAZ np. przedpokój za drzwiami
      const keep = sizes
        .map((s2, i) => ({ label: i + 1, size: s2 }))
        .filter((c) => c.size > 1.2 * pxPerM2 * 0.35); // erozja zjada ~65% mniejszych pokoi

      // pełne pola: rozlej etykiety wszystkich składowych na całą maskę koloru
      const seeds = new Int32Array(SEG_W * SEG_H);
      const wanted = new Set(keep.map((k) => k.label));
      for (let p = 0; p < SEG_W * SEG_H; p++) if (labels[p] && wanted.has(labels[p])) seeds[p] = labels[p];
      const full = watershed(unitColor, seeds, SEG_W, SEG_H);
      const stats = new Map<number, { n: number; sx: number; sy: number }>();
      for (let y = 0; y < SEG_H; y++) for (let x = 0; x < SEG_W; x++) {
        const l = full[y * SEG_W + x];
        if (!l) continue;
        const st = stats.get(l) ?? { n: 0, sx: 0, sy: 0 };
        st.n++; st.sx += x; st.sy += y;
        stats.set(l, st);
      }
      const regions = [...stats.entries()].map(([label, st]) => ({
        label,
        m2: st.n / pxPerM2,
        cx: st.sx / st.n,
        cy: st.sy / st.n,
        used: false,
      }));

      // Dopasowanie pomieszczeń z arkusza do obszarów PO METRAŻU (nie po liczbie):
      // przedpokój bywa osobnym obszarem za drzwiami, którego arkusz nie wymienia -
      // zostaje wtedy bez znacznika, a reszta dopasowuje się normalnie.
      const roomsDesc = unit.roomsList
        .map((r, idx) => ({ ...r, idx }))
        .sort((a, b) => b.areaM2 - a.areaM2);
      const placed: { fx: number; fy: number; areaM2: number }[] = [];
      const sc = OUT.w / SEG_W; // praca 1x -> piksele wycinka (hi-res)
      let ok = true;
      for (const room of roomsDesc) {
        let best: (typeof regions)[number] | null = null;
        let bestDiff = Infinity;
        for (const reg of regions) {
          if (reg.used) continue;
          const diff = Math.abs(reg.m2 - room.areaM2) / room.areaM2;
          if (diff < bestDiff) { bestDiff = diff; best = reg; }
        }
        if (!best || bestDiff > 0.45) { ok = false; break; }
        best.used = true;
        placed.push({
          fx: +(((best.cx * sc) - x0) / cw).toFixed(4),
          fy: +(((best.cy * sc) - y0) / chh).toFixed(4),
          areaM2: room.areaM2,
        });
      }
      if (!ok) {
        console.log(`  ${unit.id.padEnd(4)} ${String(cw).padStart(4)}x${String(chh).padStart(4)}  pokoje: ${regions.length} obszarów vs ${unit.roomsList.length} -> BEZ znaczników`);
        continue;
      }
      roomsJson[unit.id] = placed;
      withRooms++;
      const extras = regions.filter((r) => !r.used).length;
      console.log(`  ${unit.id.padEnd(4)} ${String(cw).padStart(4)}x${String(chh).padStart(4)}  pokoje: ${placed.length}/${unit.roomsList.length} OK${extras ? ` (+${extras} bez etykiety, np. przedpokój)` : ""}`);
    }
  }

  writeFileSync(roomsJsonPath, JSON.stringify(roomsJson, null, 1) + "\n");
  console.log(`\nGotowe: ${total} rzutów, pozycje pokoi dla ${withRooms}/${total}`);
  console.log(`  strona : ${webDir}/m*.webp`);
  console.log(`  mastery: ${masterDir}/M*.png`);
  console.log(`  pokoje : ${roomsJsonPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
