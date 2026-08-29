/**
 * Parter Zamysłowa z ogródkami: SVG architekta -> obraz rzutu + strefy ogródków.
 *
 *   node scripts/zamyslow-parter-ogrody.mjs "<plik.svg>" [--write]
 *
 * DLACZEGO OSOBNY SKRYPT (a nie zamyslow-floorplan.mjs):
 * Wspólny skrypt zakłada, że każde piętro to ten sam arkusz A4 842x1191 i że
 * WSZYSTKO, co kolorowe, jest mieszkaniem. Aranżacja parteru z 26.08.2026 łamie
 * oba założenia: arkusz ma 822x1559, a poza budynkiem leży 389 m² zielonych
 * ogródków. Puszczona przez tamten skrypt dałaby kadr rozdęty do ogródków,
 * błędną kompensację przesunięcia (bbox koloru zaczyna się od trawy, nie od
 * mieszkania) i strefy dociągnięte do zieleni. Piętra 1-5 się nie zmieniają,
 * więc parter dostaje własną ścieżkę zamiast ryzykownego uogólniania tamtej.
 *
 * ZASADA: geometria mieszkań NIE jest liczona od nowa. Rysunek budynku jest
 * bez zmian (zmierzone: 730,0 x 323,6 pt vs 730,3 x 323,9 pt na poprzednim
 * arkuszu, czyli ta sama skala 1:100), więc gotowe, skalibrowane strefy M1-M6
 * z `zamyslow-data.ts` tylko PRZERZUCAMY w nowy kadr. Od zera liczymy wyłącznie
 * ogródki. Dzięki temu zmiana nie może popsuć tego, co już działa.
 *
 * Rozróżnienie ogródek/mieszkanie idzie po NASYCENIU, nie po barwie: trawa ma
 * rgb(105,255,105) i nasycenie 0,59, a pastele mieszkań 0,10-0,20. Sama barwa
 * by nie wystarczyła, bo M4 jest jasnozielone (hue 120, dokładnie jak trawa).
 */
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Gęstość renderu w px na punkt - taka sama jak w zamyslow-floorplan.mjs
// (3000 px na arkusz 842 pt), żeby parter miał tę samą "rozdzielczość rysunku"
// co piętra i nie odcinał się ostrością.
const PX_PER_PT = 3000 / 842;

/** Obecny rzut parteru - punkt odniesienia dla stref M1-M6. */
const OLD_IMAGE = "public/investments/zamyslow/floorplans/floor-ground-plan.webp";
const OLD_VB = { w: 906, h: 500.5 };
const OLD_ZONES = [
  // [id, ścieżka strefy, środek plakietki] - oba w starym viewBox 906x500,5
  ["M1", "M502.2 87.7L502.2 175.7L559.2 175.7L559.2 200.7L559.2 230.7L703.2 230.7L703.2 87.7Z", [584.1, 169.8]],
  ["M2", "M620.2 237.7L620.2 325.7L723.2 325.7L723.2 410.7L816.2 410.7L816.2 87.7L710.2 87.7L710.2 237.7Z", [717.4, 265.4]],
  ["M3", "M501.2 278.7L501.2 411.7L717.2 411.7L717.2 331.7L613.2 331.7L613.2 278.7Z", [610.5, 340.7]],
  ["M4", "M223.2 288.7L223.2 411.7L413.2 411.7L413.2 279.7L318.2 279.7L318.2 288.7Z", [318.2, 326.7]],
  ["M5", "M88.2 87.7L88.2 411.7L218.2 411.7L218.2 283.7L313.2 283.7L313.2 236.7L218.2 236.7L218.2 87.7Z", [209.5, 255]],
  ["M6", "M224.2 87.7L224.2 231.7L412.2 231.7L412.2 99.7L413.2 99.7L413.2 87.7Z", [349.9, 139.7]],
];
/** Podpisy tarasów w starym kadrze - przerzucamy je razem ze strefami. */
const OLD_ANNOTATIONS = [
  { text: "Taras", x: 319, y: 40 },
  { text: "Taras", x: 690, y: 40 },
  { text: "Taras", x: 336, y: 458 },
  { text: "Taras", x: 582, y: 458 },
  { text: "Taras", x: 40, y: 350, rotate: -90 },
  { text: "Taras", x: 865, y: 352, rotate: -90 },
];

/**
 * Powierzchnie ogródków z opisów na aranżacji architekta (26.08.2026).
 * Skrypt liczy geometrię, ale metraż bierze stąd - to liczba z projektu,
 * a nie wynik zliczania pikseli.
 */
const GARDEN_AREA = { M1: 22.6, M2: 153.1, M3: 60.5, M4: 52.7, M5: 81.4, M6: 19.1 };

const parseD = (d) => {
  const n = d.match(/-?[\d.]+/g).map(Number), p = [];
  for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]);
  return p;
};
const toD = (p) =>
  "M" + p.map(([x, y], i) => `${i ? "L" : ""}${x.toFixed(1)} ${y.toFixed(1)}`).join("") + "Z";

const satOf = (r, g, b) => {
  const mx = Math.max(r, g, b);
  return mx ? (mx - Math.min(r, g, b)) / mx : 0;
};
const hueOf = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return null;
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
};

/** Trawa: mocno nasycona zieleń. Pastele mieszkań mają nasycenie < 0,30. */
const isGarden = (r, g, b) => {
  const h = hueOf(r, g, b);
  return h !== null && h > 95 && h < 145 && satOf(r, g, b) > 0.35 && g > 150;
};
/**
 * Wypełnienie mieszkania: pastel - kolorowy, ale jasny i mało nasycony.
 * Warunek `!isGarden` jest konieczny, nie kosmetyczny: M4 ma barwę 120°,
 * dokładnie jak trawa, i różni się od niej wyłącznie nasyceniem.
 */
const isFlat = (r, g, b) => {
  if (isGarden(r, g, b)) return false;
  const s = satOf(r, g, b);
  return s > 0.045 && s < 0.32 && Math.max(r, g, b) > 140;
};

/**
 * Bbox maski liczony na histogramach kolumn/wierszy, z odcięciem `trim` części
 * masy z każdej strony. Skrajne piksele to zwykle antyaliasing na styku trawy
 * i bieli - pojedynczy taki piksel przy zwykłym min/max rozciągałby ramkę
 * budynku na całą działkę.
 */
function bboxOf(data, W, H, ch, test, trim = 0.002, exclude = null) {
  const colH = new Float64Array(W), rowH = new Float64Array(H);
  let n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * ch;
    if (ch === 4 && data[i + 3] < 40) continue;
    if (exclude && exclude[y * W + x]) continue;
    if (!test(data[i], data[i + 1], data[i + 2])) continue;
    colH[x] += 1; rowH[y] += 1; n++;
  }
  if (!n) return { x0: 0, y0: 0, x1: 0, y1: 0, w: 0, h: 0, n: 0 };
  const edge = (hist, len) => {
    const cut = n * trim;
    let acc = 0, lo = 0, hi = len - 1;
    for (let i = 0; i < len; i++) { acc += hist[i]; if (acc > cut) { lo = i; break; } }
    acc = 0;
    for (let i = len - 1; i >= 0; i--) { acc += hist[i]; if (acc > cut) { hi = i; break; } }
    return [lo, hi];
  };
  const [x0, x1] = edge(colH, W), [y0, y1] = edge(rowH, H);
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, n };
}

/**
 * Rozszerzenie maski o `rad` pikseli (przez obraz całkowy, więc O(N)).
 * Potrzebne, żeby wyciąć z maski mieszkań ANTYALIASING na styku trawy i bieli:
 * na obwodzie 389 m² ogródków takich pikseli są dziesiątki tysięcy i to one,
 * a nie budynek, wyznaczały ramkę.
 */
function dilate(mask, W, H, rad) {
  const ii = new Int32Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let run = 0;
    for (let x = 0; x < W; x++) {
      run += mask[y * W + x];
      ii[(y + 1) * (W + 1) + x + 1] = ii[y * (W + 1) + x + 1] + run;
    }
  }
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const y0 = Math.max(0, y - rad), y1 = Math.min(H - 1, y + rad);
    for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - rad), x1 = Math.min(W - 1, x + rad);
      const sum = ii[(y1 + 1) * (W + 1) + x1 + 1] - ii[y0 * (W + 1) + x1 + 1]
        - ii[(y1 + 1) * (W + 1) + x0] + ii[y0 * (W + 1) + x0];
      if (sum > 0) out[y * W + x] = 1;
    }
  }
  return out;
}

/** Spójne składowe maski (4-sąsiedztwo), posortowane malejąco. */
function components(mask, W, H, minPx) {
  const lab = new Int32Array(W * H).fill(-1);
  const qx = new Int32Array(W * H), qy = new Int32Array(W * H);
  const out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (!mask[p] || lab[p] !== -1) continue;
    const id = out.length;
    let head = 0, tail = 0;
    qx[tail] = x; qy[tail] = y; tail++; lab[p] = id;
    let n = 0, x0 = x, x1 = x, y0 = y, y1 = y, sx = 0, sy = 0;
    const px = [];
    while (head < tail) {
      const cx = qx[head], cy = qy[head]; head++; n++; sx += cx; sy += cy;
      px.push(cy * W + cx);
      if (cx < x0) x0 = cx; if (cx > x1) x1 = cx;
      if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const np = ny * W + nx;
        if (!mask[np] || lab[np] !== -1) continue;
        lab[np] = id; qx[tail] = nx; qy[tail] = ny; tail++;
      }
    }
    if (n >= minPx) out.push({ n, x0, y0, x1, y1, cx: sx / n, cy: sy / n, px });
  }
  return out.sort((a, b) => b.n - a.n);
}

/**
 * Upraszczanie łamanej (Douglas-Peucker). Obrys próbkowany kolumnami ma na
 * skośnych krawędziach setki punktów różniących się o jeden piksel - bez tego
 * ścieżka ogródka M2 miała 880 znaków i widoczne "schodki".
 */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let far = -1, fd = tol;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len;
      if (d > fd) { fd = d; far = i; }
    }
    if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/**
 * Obrys prostokątny składowej: dla każdej kolumny bierzemy zakres wierszy,
 * a potem sklejamy w schodkowy wielokąt. Ogródki są prostokątne/L-kształtne,
 * więc taki obrys trzyma się rysunku, a nie wygładza go w owal.
 */
function rectilinearOutline(comp, mask, W, step) {
  const { x0, x1 } = comp;
  const cols = [];
  for (let x = x0; x <= x1; x += step) {
    let top = -1, bot = -1;
    for (let y = comp.y0; y <= comp.y1; y++) {
      if (mask[y * W + x]) { if (top < 0) top = y; bot = y; }
    }
    if (top >= 0) cols.push([x, top, bot]);
  }
  if (!cols.length) return [];
  const up = [], down = [];
  for (const [x, top, bot] of cols) { up.push([x, top]); down.push([x, bot]); }
  const pts = [...up, ...down.reverse()];
  // redukcja współliniowych punktów (tolerancja 1,5 px)
  const keep = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = keep[keep.length - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const len = Math.hypot(cx - ax, cy - ay) || 1;
    if (Math.abs(cross) / len > 1.5) keep.push(pts[i]);
  }
  keep.push(pts[pts.length - 1]);
  return keep;
}

const [, , svgArg, ...flags] = process.argv;
if (!svgArg) {
  console.error('Użycie: node scripts/zamyslow-parter-ogrody.mjs "<plik.svg>" [--write]');
  process.exit(1);
}
const svgPath = svgArg.replace(/^~/, process.env.HOME ?? "");
const write = flags.includes("--write");
const OUT_IMAGE = "public/investments/zamyslow/floorplans/floor-ground-plan-ogrody.webp";

const tmp = mkdtempSync(path.join(tmpdir(), "zamyslow-parter-"));
try {
  // ── 1. Render arkusza w gęstości pięter, obrót do orientacji strony ──────
  const head = execFileSync("head", ["-c", "600", svgPath]).toString();
  const vb = head.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!vb) throw new Error("Nie znalazłem viewBox w SVG.");
  const sheetPt = { w: +vb[1], h: +vb[2] };
  const renderW = Math.round(sheetPt.w * PX_PER_PT);
  console.log(`arkusz: ${sheetPt.w} x ${sheetPt.h} pt -> render ${renderW} px szerokości`);

  const flat = path.join(tmp, "flat.png");
  execFileSync("rsvg-convert", ["-w", String(renderW), "--background-color=none", svgPath, "-o", flat]);
  // rotate(-90) + rotate(180) ze wspólnego skryptu = rotate(90); materializujemy
  // przez plik, bo sharp potrafi zgubić obrót w łańcuchu przetwarzania.
  const rotFile = path.join(tmp, "rot.png");
  await sharp(flat).rotate(90).toFile(rotFile);
  // Maski liczymy na SUROWYM renderze: wypełnienia są jednolite (trawa to pełne
  // rgb(105,255,105)), a cienkie linie działowe między ogródkami zostają
  // nienaruszone - to one rozdzielają sąsiadujące parcele na osobne strefy.
  const R = await sharp(rotFile).flatten({ background: "#ffffff" })
    .raw().toBuffer({ resolveWithObject: true });
  const RW = R.info.width, RH = R.info.height, RC = R.info.channels;
  console.log(`render po obrocie: ${RW} x ${RH}`);

  // ── 2. Maski: budynek (pastele) i ogródki (mocna zieleń) ────────────────
  const gmask = new Uint8Array(RW * RH);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const i = (y * RW + x) * RC;
    if (isGarden(R.data[i], R.data[i + 1], R.data[i + 2])) gmask[y * RW + x] = 1;
  }
  const gnear = dilate(gmask, RW, RH, 14);
  const bBuilding = bboxOf(R.data, RW, RH, RC, isFlat, 0.002, gnear);
  const bGarden = bboxOf(R.data, RW, RH, RC, isGarden);
  console.log(`bbox mieszkań (nowy render): ${bBuilding.w} x ${bBuilding.h} px @ ${bBuilding.x0},${bBuilding.y0}`);
  console.log(`bbox ogródków (nowy render): ${bGarden.w} x ${bGarden.h} px @ ${bGarden.x0},${bGarden.y0}`);

  // ── 3. Ten sam pomiar na OBECNYM rzucie -> mapowanie stary obraz -> render ─
  const O = await sharp(OLD_IMAGE).flatten({ background: "#ffffff" })
    .raw().toBuffer({ resolveWithObject: true });
  const OW = O.info.width, OH = O.info.height, OC = O.info.channels;
  const bOld = bboxOf(O.data, OW, OH, OC, isFlat);
  console.log(`bbox mieszkań (obecny rzut): ${bOld.w} x ${bOld.h} px @ ${bOld.x0},${bOld.y0} (obraz ${OW}x${OH})`);

  const sx = bBuilding.w / bOld.w, sy = bBuilding.h / bOld.h;
  console.log(`skala stary->nowy: ${sx.toFixed(4)} x ${sy.toFixed(4)}  (różnica od 1 = rozjazd rysunku)`);
  if (Math.abs(sx - sy) > 0.02) {
    console.warn("UWAGA: skala X i Y rozjeżdżają się o >2% - rysunek nie jest tym samym co poprzednio.");
  }
  // stary obraz (px) -> nowy render (px)
  const oldPxToRender = ([x, y]) => [
    bBuilding.x0 + (x - bOld.x0) * sx,
    bBuilding.y0 + (y - bOld.y0) * sy,
  ];
  // stary viewBox -> stary obraz (px)
  const oldVbToPx = ([x, y]) => [x * (OW / OLD_VB.w), y * (OH / OLD_VB.h)];

  // ── 4. Nowy kadr: budynek + ogródki + margines ───────────────────────────
  // Margines zadany w pikselach OBRAZU wyjściowego i przeliczony na render,
  // żeby ogródki nie dotykały krawędzi kadru.
  const M = Math.round(22 * (bBuilding.w / bOld.w));
  const fx0 = Math.max(0, Math.min(bBuilding.x0, bGarden.x0) - M);
  const fy0 = Math.max(0, Math.min(bBuilding.y0, bGarden.y0) - M);
  const fx1 = Math.min(RW - 1, Math.max(bBuilding.x1, bGarden.x1) + M);
  const fy1 = Math.min(RH - 1, Math.max(bBuilding.y1, bGarden.y1) + M);
  const FRAME = { left: fx0, top: fy0, width: fx1 - fx0 + 1, height: fy1 - fy0 + 1 };
  // Gęstość obrazu wyjściowego dobrana tak, żeby budynek zajmował dokładnie
  // tyle samo pikseli co na obecnym rzucie - inaczej parter odcinałby się
  // ostrością od pięter.
  const dens = bOld.w / bBuilding.w;
  const OUT = { w: Math.round(FRAME.width * dens), h: Math.round(FRAME.height * dens) };
  const VB = { w: +(OUT.w / 2).toFixed(2), h: +(OUT.h / 2).toFixed(2) };
  console.log(`kadr: ${JSON.stringify(FRAME)} -> obraz ${OUT.w}x${OUT.h}, viewBox ${VB.w}x${VB.h}`);

  const renderToVb = ([x, y]) => [
    (x - FRAME.left) * (VB.w / FRAME.width),
    (y - FRAME.top) * (VB.h / FRAME.height),
  ];

  // ── 5. Obraz wyjściowy ──────────────────────────────────────────────────
  // Aranżacja niesie oznaczenia, których rzut na stronie nie potrzebuje: różę
  // wiatrów (strona rysuje własny kompas - byłyby dwie) i znaczniki przekroju.
  // Leżą w bieli, poza budynkiem i poza trawą, więc kasujemy DOKŁADNIE to:
  // ciemne plamy, które nie dotykają ani budynku, ani ogródka.
  const dark = new Uint8Array(RW * RH);
  for (let y = FRAME.top; y < FRAME.top + FRAME.height; y++)
    for (let x = FRAME.left; x < FRAME.left + FRAME.width; x++) {
      const i = (y * RW + x) * RC;
      if (Math.max(R.data[i], R.data[i + 1], R.data[i + 2]) < 150) dark[y * RW + x] = 1;
    }
  const nearGarden = dilate(gmask, RW, RH, 6);
  const inBuilding = (x, y) =>
    x >= bBuilding.x0 - 40 && x <= bBuilding.x1 + 40 && y >= bBuilding.y0 - 40 && y <= bBuilding.y1 + 40;
  const strayLimit = Math.round(FRAME.width * FRAME.height * 0.004);
  const strays = components(dark, RW, RH, 40).filter((c) => {
    if (c.n > strayLimit) return false;                       // duże = tarasy/ściany
    if (inBuilding(c.cx, c.cy)) return false;                 // wszystko przy budynku zostaje
    return !c.px.some((p) => nearGarden[p]);                  // dotyka trawy = obrys ogródka
  });
  console.log(`oznaczenia do usunięcia (róża wiatrów / przekroje): ${strays.length}`);
  let cleaned = rotFile;
  if (strays.length) {
    const raw = await sharp(rotFile).flatten({ background: "#ffffff" }).raw()
      .toBuffer({ resolveWithObject: true });
    for (const c of strays) {
      // zamalowujemy z zapasem, żeby zniknął też antyaliasing wokół kreski
      for (let y = Math.max(0, c.y0 - 3); y <= Math.min(RH - 1, c.y1 + 3); y++)
        for (let x = Math.max(0, c.x0 - 3); x <= Math.min(RW - 1, c.x1 + 3); x++) {
          const i = (y * RW + x) * raw.info.channels;
          raw.data[i] = 255; raw.data[i + 1] = 255; raw.data[i + 2] = 255;
        }
      console.log(`  usunięto plamę ${c.x1 - c.x0 + 1}x${c.y1 - c.y0 + 1} px @ ${c.x0},${c.y0}`);
    }
    cleaned = path.join(tmp, "clean.png");
    await sharp(raw.data, { raw: { width: RW, height: RH, channels: raw.info.channels } })
      .png().toFile(cleaned);
  }

  await sharp(cleaned).extract(FRAME).resize(OUT.w, OUT.h, { fit: "fill" })
    .webp({ quality: 92, alphaQuality: 100 }).toFile(OUT_IMAGE);
  console.log("zapisano", OUT_IMAGE);

  // ── 6. Strefy M1-M6 przerzucone ze starego kadru ─────────────────────────
  const project = (p) => renderToVb(oldPxToRender(oldVbToPx(p)));
  const zones = OLD_ZONES.map(([id, d, label]) => {
    const [lx, ly] = project(label);
    return {
      id,
      d: toD(parseD(d).map(project)),
      label: { x: +lx.toFixed(1), y: +ly.toFixed(1) },
    };
  });

  // ── 7. Ogródki: spójne składowe w PEŁNEJ rozdzielczości renderu ─────────
  // W siatce viewBox (ok. 1 px na 5 px renderu) cienkie linie działowe między
  // parcelami znikają i wszystkie ogródki zlewają się w jedną plamę. Dlatego
  // składowe liczymy na renderze, a dopiero obrysy przeliczamy do viewBox.
  const minPx = Math.round(3 * (FRAME.width * FRAME.height) / 10000); // ~0,03% kadru
  const comps = components(gmask, RW, RH, minPx);
  console.log(`\nskładowe zieleni (>=${minPx} px renderu): ${comps.length}`);

  // Przypisanie ogródka do mieszkania: najbliższy środek strefy mieszkania.
  const centers = zones.map((z) => {
    const p = parseD(z.d);
    return { id: z.id, cx: p.reduce((a, q) => a + q[0], 0) / p.length, cy: p.reduce((a, q) => a + q[1], 0) / p.length };
  });
  // Ogródek bywa przecięty tarasem na dwie plamy (tak jest przy M6). Składowe
  // tego samego mieszkania scalamy w jedną strefę - kupujący ma jeden ogródek,
  // a nie dwa kawałki.
  const gardens = comps.map((c) => {
    const [vcx, vcy] = renderToVb([c.cx, c.cy]);
    let best = null, bd = 1e18;
    for (const m of centers) {
      const d2 = (m.cx - vcx) ** 2 + (m.cy - vcy) ** 2;
      if (d2 < bd) { bd = d2; best = m.id; }
    }
    const step = Math.max(2, Math.round(RW / VB.w / 2));
    const poly = simplify(rectilinearOutline(c, gmask, RW, step).map((p) => renderToVb(p)), 1.6);
    return { unit: best, comp: c, cx: vcx, cy: vcy, poly };
  });
  for (const g of gardens) {
    console.log(`  ${g.unit ?? "?"}  px=${String(g.comp.n).padStart(8)}  środek(viewBox)=${g.cx.toFixed(0)},${g.cy.toFixed(0)}  wierzchołków=${g.poly.length}`);
  }

  // ── 8. Wynik do wklejenia ───────────────────────────────────────────────
  const annotations = OLD_ANNOTATIONS.map((a) => {
    const [x, y] = project([a.x, a.y]);
    return { ...a, x: +x.toFixed(0), y: +y.toFixed(0) };
  });
  const result = {
    image: "/investments/zamyslow/floorplans/floor-ground-plan-ogrody.webp",
    viewBox: { width: VB.w, height: VB.h },
    zones: zones.map((z) => ({ id: z.id, d: z.d, label: z.label })),
    annotations,
    gardens: Object.values(
      gardens
        .filter((g) => g.unit && g.poly.length > 3)
        .reduce((acc, g) => {
          const cur = acc[g.unit];
          // Etykieta siada w największym kawałku - w wąskim pasku nie byłoby jej gdzie postawić.
          if (!cur) acc[g.unit] = { unit: g.unit, parts: [g], main: g };
          else {
            cur.parts.push(g);
            if (g.comp.n > cur.main.comp.n) cur.main = g;
          }
          return acc;
        }, {}),
    )
      .sort((a, b) => a.unit.localeCompare(b.unit, "pl", { numeric: true }))
      .map((g) => ({
        unit: g.unit,
        areaM2: GARDEN_AREA[g.unit] ?? null,
        // Wiele rozłącznych kawałków = jedna ścieżka z kilkoma podścieżkami.
        d: g.parts.map((p) => toD(p.poly)).join(" "),
        parts: g.parts.length,
        label: { x: +g.main.cx.toFixed(1), y: +g.main.cy.toFixed(1) },
      })),
  };
  const jsonPath = path.join("scripts", "out-parter-ogrody.json");
  if (write) {
    writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    console.log("\nzapisano", jsonPath);
  } else {
    console.log("\n(bez --write nie zapisuję JSON-a; obraz i tak powstał)");
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
