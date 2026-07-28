/**
 * Dociąga krawędzie stref klikalnych do RZECZYWISTYCH granic kolorów mieszkań.
 *   node scripts/zamyslow-zones-snap.mjs [ścieżka-do-rzutu.webp]
 * Kształty zostają czyste (prostokątne) - zmieniają się tylko współrzędne krawędzi,
 * maksymalizując pokrycie (IoU) z maską koloru danego mieszkania.
 * UNITS poniżej = aktualne strefy; po zmianie rzutu podmień je i uruchom ponownie.
 */
import sharp from "sharp";
import fs from "node:fs";

const IMG = process.argv[2] || "public/investments/zamyslow/floorplans/floor-1-plan-v3-north.webp";
const SP = "/private/tmp/claude-502/-Users-stanislawdrozniak-strony-www-Fibra/ae4e7679-9a8d-47b1-9e75-b23893c00fca/scratchpad";
const VW = 822.53, VH = 418.5;

const UNITS = [
  { id: "M7", d: "M463.2 48.2L463.2 133.2L517.2 133.2L517.2 159.2L517.2 189.2L660.2 189.2L660.2 48.2Z" },
  { id: "M8", d: "M579.2 199.2L579.2 284.2L683.2 284.2L683.2 369.2L775.2 369.2L775.2 52.2L669.2 52.2L669.2 199.2Z" },
  { id: "M9", d: "M464.2 240.2L464.2 370.2L672.2 370.2L672.2 292.2L571.2 292.2L571.2 240.2Z" },
  { id: "M10", d: "M184.2 250.2L184.2 369.2L369.2 369.2L368.2 240.2L278.2 240.2L278.2 250.2Z" },
  { id: "M11", d: "M48.2 48.2L48.2 369.2L174.2 369.2L174.2 241.2L269.2 241.2L269.2 197.2L174.2 197.2L174.2 48.2Z" },
  { id: "M12", d: "M184.2 49.2L184.2 189.2L370.2 189.2L370.2 132.2L452.2 132.2L452.2 49.2Z" },
];

const parse = (d) => {
  const n = d.match(/-?[\d.]+/g).map(Number); const p = [];
  for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]);
  return p;
};
const toD = (p) => "M" + p.map(([x, y], i) => `${i ? "L" : ""}${x.toFixed(1)} ${y.toFixed(1)}`).join("") + "Z";

// rasteryzacja wielokąta (even-odd, scanline) w oknie [x0..x1]x[y0..y1] siatki 1 j. viewBox
function raster(poly, x0, y0, w, h) {
  const m = new Uint8Array(w * h);
  for (let yy = 0; yy < h; yy++) {
    const y = y0 + yy + 0.5;
    const xs = [];
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

(async () => {
  // maska kolorów: rozmycie scala kreskowanie w jednolity tint
  const { data, info } = await sharp(IMG).flatten({ background: "#ffffff" }).blur(2.2).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const sx = W / VW, sy = H / VH;

  // hue w punkcie etykiety każdego mieszkania -> wzorzec barwy
  const hueAt = (vx, vy) => {
    let hx = 0, hy = 0, n = 0;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      const px = Math.round((vx + dx) * sx), py = Math.round((vy + dy) * sy);
      if (px < 0 || px >= W || py < 0 || py >= H) continue;
      const i = (py * W + px) * C, r = data[i], g = data[i + 1], b = data[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx < 120) continue;
      const s = (mx - mn) / mx; if (s < 0.04) continue;
      let hd = 0, dd = mx - mn;
      if (mx === r) hd = ((g - b) / dd) % 6; else if (mx === g) hd = (b - r) / dd + 2; else hd = (r - g) / dd + 4;
      hd *= 60; if (hd < 0) hd += 360;
      hx += Math.cos(hd * Math.PI / 180); hy += Math.sin(hd * Math.PI / 180); n++;
    }
    let h = Math.atan2(hy / n, hx / n) * 180 / Math.PI; if (h < 0) h += 360;
    return h;
  };

  // środek każdego wielokąta jako punkt próbkowania barwy
  const refs = UNITS.map((u) => {
    const p = parse(u.d);
    const cx = p.reduce((a, q) => a + q[0], 0) / p.length, cy = p.reduce((a, q) => a + q[1], 0) / p.length;
    return { id: u.id, hue: hueAt(cx, cy) };
  });
  console.log("barwy mieszkań:", refs.map((r) => `${r.id}=${r.hue.toFixed(0)}°`).join("  "));

  // maski per mieszkanie w siatce viewBox (1 jednostka = 1 komórka)
  const GW = Math.round(VW), GH = Math.round(VH);
  const masks = Object.fromEntries(refs.map((r) => [r.id, new Uint8Array(GW * GH)]));
  const dHue = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const px = Math.round((gx + 0.5) * sx), py = Math.round((gy + 0.5) * sy);
    if (px < 0 || px >= W || py < 0 || py >= H) continue;
    const i = (py * W + px) * C, r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx < 110) continue;
    const s = (mx - mn) / mx; if (s < 0.05) continue;
    let hd = 0, dd = mx - mn;
    if (mx === r) hd = ((g - b) / dd) % 6; else if (mx === g) hd = (b - r) / dd + 2; else hd = (r - g) / dd + 4;
    hd *= 60; if (hd < 0) hd += 360;
    let best = null, bd = 26;              // maks. odchyłka barwy
    for (const ref of refs) { const d2 = dHue(hd, ref.hue); if (d2 < bd) { bd = d2; best = ref.id; } }
    if (best) masks[best][gy * GW + gx] = 1;
  }
  for (const r of refs) console.log(`  maska ${r.id}: ${masks[r.id].reduce((a, v) => a + v, 0)} komórek`);

  // dopasowanie krawędzi (coordinate descent po unikalnych x i y)
  const out = [];
  for (const u of UNITS) {
    let poly = parse(u.d);
    const mask = masks[u.id];
    const score = (p) => {
      const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
      const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 30), y0 = Math.max(0, Math.floor(Math.min(...ys)) - 30);
      const x1 = Math.min(GW - 1, Math.ceil(Math.max(...xs)) + 30), y1 = Math.min(GH - 1, Math.ceil(Math.max(...ys)) + 30);
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      const r = raster(p, x0, y0, w, h);
      let inter = 0, uni = 0;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
        const a = r[yy * w + xx], b = mask[(y0 + yy) * GW + (x0 + xx)];
        if (a | b) uni++; if (a & b) inter++;
      }
      return inter / uni;
    };
    let cur = score(poly);
    const before = cur;
    for (let round = 0; round < 3; round++) {
      for (const axis of [0, 1]) {
        const vals = [...new Set(poly.map((p) => p[axis]))];
        for (const v of vals) {
          let bestOff = 0, bestS = cur;
          for (let off = -16; off <= 16; off += 1) {
            if (!off) continue;
            const cand = poly.map((p) => (p[axis] === v ? (axis ? [p[0], p[1] + off] : [p[0] + off, p[1]]) : p));
            const s = score(cand);
            if (s > bestS + 1e-6) { bestS = s; bestOff = off; }
          }
          if (bestOff) {
            poly = poly.map((p) => (p[axis] === v ? (axis ? [p[0], p[1] + bestOff] : [p[0] + bestOff, p[1]]) : p));
            cur = bestS;
          }
        }
      }
    }
    const cx = poly.reduce((a, q) => a + q[0], 0) / poly.length, cy = poly.reduce((a, q) => a + q[1], 0) / poly.length;
    out.push({ id: u.id, d: toD(poly), lx: +cx.toFixed(1), ly: +cy.toFixed(1), before, after: cur });
    console.log(`${u.id}: IoU ${before.toFixed(3)} -> ${cur.toFixed(3)}`);
  }

  fs.writeFileSync(SP + "/snapped.json", JSON.stringify(out, null, 2));
  console.log("\n--- nowe ścieżki ---");
  for (const o of out) console.log(`${o.id}: d="${o.d}"`);

  const COL = { M7: "#e11d48", M8: "#ca8a04", M9: "#0891b2", M10: "#16a34a", M11: "#ea580c", M12: "#2563eb" };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="1645" height="837">` +
    out.map((z) => `<path d="${z.d}" fill="${COL[z.id]}" fill-opacity="0.30" stroke="${COL[z.id]}" stroke-width="2.5"/>`).join("") +
    out.map((z) => `<text x="${z.lx}" y="${z.ly}" font-size="18" font-weight="800" fill="#000" text-anchor="middle" dominant-baseline="middle">${z.id}</text>`).join("") +
    `</svg>`;
  await sharp(IMG).flatten({ background: "#faf9f7" }).composite([{ input: Buffer.from(svg) }]).png().toFile(SP + "/snapped_zones.png");
  console.log("\npodgląd:", SP + "/snapped_zones.png");
})();
