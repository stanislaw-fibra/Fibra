/**
 * Rzut piętra Zamysłowa: SVG z Illustratora -> webp + gotowe strefy klikalne.
 *
 *   node scripts/zamyslow-floorplan.mjs "<plik.svg>" <slug> [--auto-frame]
 *
 * Jak to działa:
 *  1. Render SVG (rsvg) i obrót -90° -> wspólna przestrzeń "render" 4244x3000.
 *     Wszystkie piętra są eksportowane z tego samego obszaru roboczego (A4 842x1191),
 *     więc żyją w jednym układzie współrzędnych.
 *  2. Rysunki architekta NIE są idealnie zgrane między arkuszami (parter jest
 *     przesunięty o ~17x79 px względem 1. piętra), więc mierzymy bbox KOLOROWYCH
 *     mieszkań i kompensujemy przesunięcie względem wzorca (1. piętro).
 *  3. Kadr: domyślnie wspólny (piętra 1-5), a `--auto-frame` liczy własny kadr
 *     z treści piętra + margines (potrzebne na parterze, bo tarasy wychodzą dalej).
 *  4. Strefy wzorcowe rzutujemy w kadr piętra, a potem DOCIĄGAMY je do rzeczywistych
 *     granic kolorów (maksymalizacja IoU) - to koryguje resztki niedopasowania.
 *
 * Na końcu wypisuje `d` i `label` gotowe do wklejenia w zamyslow-data.ts.
 */
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const RENDER_W = 3000;
// Wzorzec = 1. piętro (kadr + strefy po kalibracji)
const W1 = { left: 951, top: 1326, width: 2940, height: 1496 };
const OUT1 = { w: 1645, h: 837 }, VB1 = { w: 822.53, h: 418.5 };
const REF_COLOR_BBOX = { x0: 395, y0: 527 };     // w przestrzeni roboczej 1500 px
const WORK_W = 1500;

// strefy wzorcowe: [id na 1. piętrze, offset numeru w piętrze (1..6), d]
const REF_ZONES = [
  ["M11", 5, "M46.2 46.2L46.2 371.2L176.2 371.2L176.2 242.2L271.2 242.2L271.2 196.2L176.2 196.2L176.2 46.2Z"],
  ["M12", 6, "M181.2 46.2L181.2 191.2L371.2 191.2L371.2 134.2L454.2 134.2L454.2 46.2Z"],
  ["M7", 1, "M460.2 47.2L460.2 135.2L517.2 135.2L517.2 159.2L517.2 190.2L662.2 190.2L662.2 47.2Z"],
  ["M8", 2, "M578.2 196.2L578.2 284.2L682.2 284.2L682.2 370.2L774.2 370.2L774.2 47.2L669.2 47.2L669.2 196.2Z"],
  ["M10", 4, "M181.2 247.2L181.2 370.2L368.2 370.2L371.2 238.2L277.2 238.2L277.2 247.2Z"],
  ["M9", 3, "M459.2 237.2L459.2 370.2L674.2 370.2L674.2 290.2L571.2 290.2L571.2 237.2Z"],
];
const FLOOR_INDEX = { ground: 0, "floor-1": 1, "floor-2": 2, "floor-3": 3, "floor-4": 4, "floor-5": 5 };

const parse = (d) => { const n = d.match(/-?[\d.]+/g).map(Number), p = []; for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]); return p; };
const toD = (p) => "M" + p.map(([x, y], i) => `${i ? "L" : ""}${x.toFixed(1)} ${y.toFixed(1)}`).join("") + "Z";
const toRender = ([zx, zy], W, OUT, VB) => {
  const px = zx * (OUT.w / VB.w), py = zy * (OUT.h / VB.h);
  return [W.left + (OUT.w - 1 - px) * (W.width / OUT.w), W.top + (OUT.h - 1 - py) * (W.height / OUT.h)];
};
const fromRender = ([rx, ry], W, OUT, VB) => {
  const qx = (rx - W.left) * (OUT.w / W.width), qy = (ry - W.top) * (OUT.h / W.height);
  return [(OUT.w - 1 - qx) / (OUT.w / VB.w), (OUT.h - 1 - qy) / (OUT.h / VB.h)];
};

function raster(poly, x0, y0, w, h) {
  const m = new Uint8Array(w * h);
  for (let yy = 0; yy < h; yy++) {
    const y = y0 + yy + 0.5, xs = [];
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y)) xs.push(xi + ((y - yi) / (yj - yi)) * (xj - xi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(x0, Math.ceil(xs[k] - 0.5)), b = Math.min(x0 + w - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = a; x <= b; x++) m[yy * w + (x - x0)] = 1;
    }
  }
  return m;
}
const hueOf = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return null;
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60; return h < 0 ? h + 360 : h;
};
const dHue = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

const [, , svgArg, slug, ...flags] = process.argv;
if (!svgArg || !slug) { console.error('Użycie: node scripts/zamyslow-floorplan.mjs "<plik.svg>" <slug> [--auto-frame]'); process.exit(1); }
const autoFrame = flags.includes("--auto-frame");
const svgPath = svgArg.replace(/^~/, process.env.HOME ?? "");
const outPath = `public/investments/zamyslow/floorplans/${slug.startsWith("floor-") ? slug : `floor-${slug}`}-plan.webp`;
const base = (FLOOR_INDEX[slug] ?? 0) * 6;

const tmp = mkdtempSync(path.join(tmpdir(), "zamyslow-"));
try {
  const flat = path.join(tmp, "flat.png");
  execFileSync("rsvg-convert", ["-w", String(RENDER_W), "--background-color=none", svgPath, "-o", flat]);
  const rot = await sharp(flat).rotate(-90).toBuffer();          // materializacja (pułapka sharp)
  const meta = await sharp(rot).metadata();
  const R2W = WORK_W / meta.width;

  // --- bbox kolorów (do kompensacji przesunięcia arkusza) i bbox całej treści (do kadru)
  const work = await sharp(rot).resize({ width: WORK_W }).blur(2).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: WW, height: WH } = work.info;
  let cx0 = 1e9, cy0 = 1e9;
  for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
    const i = (y * WW + x) * 4; if (work.data[i + 3] < 40) continue;
    const r = work.data[i], g = work.data[i + 1], b = work.data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx < 110 || (mx - mn) / mx < 0.06) continue;
    if (x < cx0) cx0 = x; if (y < cy0) cy0 = y;
  }
  const off = [(cx0 - REF_COLOR_BBOX.x0) / R2W, (cy0 - REF_COLOR_BBOX.y0) / R2W];
  console.log(`przesunięcie arkusza vs 1. piętro: ${off.map((v) => v.toFixed(0)).join(", ")} px (render)`);

  // --- kadr
  let W = W1, OUT = OUT1, VB = VB1;
  if (autoFrame) {
    const full = await sharp(rot).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: RW, height: RH } = full.info;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++)
      if (full.data[(y * RW + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const M = 20;
    W = { left: x0 - M, top: y0 - M, width: x1 - x0 + 2 * M, height: y1 - y0 + 2 * M };
    const dens = OUT1.w / W1.width;
    OUT = { w: Math.round(W.width * dens), h: Math.round(W.height * dens) };
    VB = { w: +(OUT.w / 2).toFixed(2), h: +(OUT.h / 2).toFixed(2) };
  }
  console.log(`kadr: ${JSON.stringify(W)} -> obraz ${OUT.w}x${OUT.h}, viewBox ${VB.w}x${VB.h}`);

  await sharp(rot).extract(W).resize(OUT.w, OUT.h, { fit: "fill" }).rotate(180)
    .webp({ quality: 92, alphaQuality: 100 }).toFile(outPath);
  console.log("zapisano", outPath);

  // --- maski kolorów na wygenerowanym obrazie (siatka viewBox)
  const img = await sharp(outPath).flatten({ background: "#ffffff" }).blur(2.2).raw().toBuffer({ resolveWithObject: true });
  const { width: IW, height: IH, channels: IC } = img.info;
  const sx = IW / VB.w, sy = IH / VB.h;
  const GW = Math.round(VB.w), GH = Math.round(VB.h);

  // strefy wstępne (rzut wzorca z kompensacją przesunięcia)
  const pre = REF_ZONES.map(([, k, d]) => ({
    id: `M${base + k}`,
    poly: parse(d).map((pt) => { const R = toRender(pt, W1, OUT1, VB1); return fromRender([R[0] + off[0], R[1] + off[1]], W, OUT, VB); }),
  }));

  // barwa wzorcowa każdej strefy = mediana hue w jej środku
  const refHue = pre.map((z) => {
    const cx = z.poly.reduce((a, q) => a + q[0], 0) / z.poly.length, cy = z.poly.reduce((a, q) => a + q[1], 0) / z.poly.length;
    let hx = 0, hy = 0, n = 0;
    for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
      const px = Math.round((cx + dx) * sx), py = Math.round((cy + dy) * sy);
      if (px < 0 || px >= IW || py < 0 || py >= IH) continue;
      const i = (py * IW + px) * IC, r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx < 120 || (mx - mn) / mx < 0.04) continue;
      const h = hueOf(r, g, b); if (h === null) continue;
      hx += Math.cos(h * Math.PI / 180); hy += Math.sin(h * Math.PI / 180); n++;
    }
    let h = Math.atan2(hy / n, hx / n) * 180 / Math.PI; if (h < 0) h += 360;
    return { id: z.id, hue: h };
  });
  console.log("barwy:", refHue.map((r) => `${r.id}=${r.hue.toFixed(0)}°`).join("  "));

  const masks = Object.fromEntries(refHue.map((r) => [r.id, new Uint8Array(GW * GH)]));
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const px = Math.round((gx + 0.5) * sx), py = Math.round((gy + 0.5) * sy);
    if (px < 0 || px >= IW || py < 0 || py >= IH) continue;
    const i = (py * IW + px) * IC, r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx < 110 || (mx - mn) / mx < 0.05) continue;
    const h = hueOf(r, g, b); if (h === null) continue;
    let best = null, bd = 26;
    for (const ref of refHue) { const d2 = dHue(h, ref.hue); if (d2 < bd) { bd = d2; best = ref.id; } }
    if (best) masks[best][gy * GW + gx] = 1;
  }

  // --- dociąganie krawędzi do kolorów
  const out = [];
  for (const z of pre) {
    let poly = z.poly.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
    const mask = masks[z.id];
    const score = (p) => {
      const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
      const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 34), y0 = Math.max(0, Math.floor(Math.min(...ys)) - 34);
      const x1 = Math.min(GW - 1, Math.ceil(Math.max(...xs)) + 34), y1 = Math.min(GH - 1, Math.ceil(Math.max(...ys)) + 34);
      const w = x1 - x0 + 1, h = y1 - y0 + 1, r = raster(p, x0, y0, w, h);
      let inter = 0, uni = 0;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
        const a = r[yy * w + xx], b = mask[(y0 + yy) * GW + (x0 + xx)];
        if (a | b) uni++; if (a & b) inter++;
      }
      return inter / uni;
    };
    let cur = score(poly); const before = cur;
    for (let round = 0; round < 4; round++) for (const axis of [0, 1]) {
      for (const v of [...new Set(poly.map((p) => p[axis]))]) {
        let bo = 0, bs = cur;
        for (let o = -26; o <= 26; o++) {
          if (!o) continue;
          const cand = poly.map((p) => (p[axis] === v ? (axis ? [p[0], p[1] + o] : [p[0] + o, p[1]]) : p));
          const s2 = score(cand); if (s2 > bs + 1e-6) { bs = s2; bo = o; }
        }
        if (bo) { poly = poly.map((p) => (p[axis] === v ? (axis ? [p[0], p[1] + bo] : [p[0] + bo, p[1]]) : p)); cur = bs; }
      }
    }
    const cx = poly.reduce((a, q) => a + q[0], 0) / poly.length, cy = poly.reduce((a, q) => a + q[1], 0) / poly.length;
    out.push({ id: z.id, d: toD(poly), lx: +cx.toFixed(1), ly: +cy.toFixed(1), before, after: cur });
    console.log(`${z.id}: IoU ${before.toFixed(3)} -> ${cur.toFixed(3)}`);
  }
  out.sort((a, b) => +a.id.slice(1) - +b.id.slice(1));

  writeFileSync(`/tmp/zamyslow-${slug}-zones.json`, JSON.stringify({ image: outPath, viewBox: VB, units: out }, null, 2));
  console.log(`\nviewBox: { width: ${VB.w}, height: ${VB.h} }`);
  for (const o of out) console.log(`${o.id}: d="${o.d}"  label={ x: ${o.lx}, y: ${o.ly} }`);

  const COL = ["#e11d48", "#ca8a04", "#0891b2", "#16a34a", "#ea580c", "#2563eb"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB.w} ${VB.h}" width="${OUT.w}" height="${OUT.h}">` +
    out.map((z, i) => `<path d="${z.d}" fill="${COL[i % 6]}" fill-opacity="0.30" stroke="${COL[i % 6]}" stroke-width="2.5"/>`).join("") +
    out.map((z, i) => `<text x="${z.lx}" y="${z.ly}" font-size="18" font-weight="800" fill="#000" text-anchor="middle" dominant-baseline="middle">${z.id}</text>`).join("") + `</svg>`;
  const flatImg = await sharp(outPath).flatten({ background: "#faf9f7" }).png().toBuffer();
  await sharp(flatImg).composite([{ input: Buffer.from(svg) }]).png().toFile(`/tmp/zamyslow-${slug}-podglad.png`);
  console.log(`\npodgląd: /tmp/zamyslow-${slug}-podglad.png`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
