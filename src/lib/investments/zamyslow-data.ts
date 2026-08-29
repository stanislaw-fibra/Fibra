import { AREK_ROLE } from "@/lib/team-roles";

// Statusu lokalu NIE ma w tym pliku - „Dostępne"/„Zarezerwowane"/„Sprzedane"
// leci wyłącznie z arkusza Arka (`getZamyslowUnitStatuses`). Wpisany na sztywno
// status potrafił twierdzić, że zarezerwowane mieszkanie jest wolne.
export type ZamyslowUnit = {
  id: string;
  areaM2: number;
  rooms: number;
};

export type FloorPolygons = {
  left: string;
  right: string;
};

export type FloorPlanRoom = { name: string; areaM2: number };

/**
 * Klikalna strefa mieszkania na interaktywnym rzucie piętra.
 * `d` to ścieżka polygonu (czyste linie z Figmy) w układzie `floorPlan.viewBox`.
 * `label` to środek ciężkości polygonu (układ viewBox) - tam siada stała plakietka
 * z numerem/metrażem/pokojami. `rooms`/`area`/`roomsList` pochodzą z architektonicznego
 * PDF-a (źródło prawdy). `href` na razie kieruje do przykładowej oferty.
 */
export type FloorPlanUnit = {
  id: string;
  d: string;
  /** Link do oferty; brak = mieszkanie bez gotowej oferty (na razie tylko 1. piętro). */
  href?: string;
  areaM2: number;
  rooms: number;
  roomsList: FloorPlanRoom[];
  label: { x: number; y: number };
};

/**
 * Statyczny opis na rzucie (np. „TARAS"). Nie jest klikalny - to podpis części
 * rysunku, która nie należy do żadnego mieszkania. `rotate` w stopniach dla
 * podpisów pionowych (tarasy przy bocznych ścianach).
 */
/**
 * Kierunek północy na rzutach, w stopniach zgodnie z ruchem wskazówek zegara
 * od pionu ekranu (0° = w górę obrazu).
 *
 * Zmierzone z róży wiatrów na rzucie architektonicznym (PDF): oś strzałki
 * „N" przechodzi przez wcięcie ogona i czubek pod kątem 43°. Wartość dotyczy
 * WSZYSTKICH rzutów pięter - wszystkie są w tej samej orientacji co rysunek
 * architekta (north-up), więc jedna stała wystarcza dla parteru i pięter 1-5.
 *
 * Gdyby kiedyś zmieniła się orientacja obrazów rzutów, wystarczy poprawić tę
 * liczbę - kompas na stronie obróci się sam.
 */
export const FLOOR_PLAN_NORTH_DEG = 43;

export type FloorPlanAnnotation = {
  text: string;
  x: number;
  y: number;
  rotate?: number;
};

/**
 * Interaktywny rzut piętra: lekki obraz (webp) + nałożone klikalne strefy mieszkań.
 * Współrzędne stref żyją w `viewBox` (naturalny układ obrazu 1x), a SVG siada na
 * obrazie 1:1 (oba object-contain / xMidYMid meet o tym samym aspekcie).
 */
/**
 * Ogródek przynależny do lokalu na parterze (aranżacja architekta 26.08.2026).
 * `d` bywa ścieżką z KILKU podścieżek - ogródek M6 jest przecięty tarasem na
 * dwa kawałki, a kupujący ma jeden ogródek, nie dwa.
 */
export type FloorPlanGarden = {
  /** Id lokalu, do którego ogródek należy („M5"). */
  unit: string;
  areaM2: number;
  d: string;
  label: { x: number; y: number };
};

export type FloorPlan = {
  image: string;
  viewBox: { width: number; height: number };
  units: FloorPlanUnit[];
  annotations?: FloorPlanAnnotation[];
  /** Tylko parter - pozostałe kondygnacje nie mają ogródków. */
  gardens?: FloorPlanGarden[];
};

export type ZamyslowFloor = {
  id: string;
  label: string;
  plan: string;
  architecturePlan?: string;
  polygons: FloorPolygons;
  units: ZamyslowUnit[];
  floorPlan?: FloorPlan;
};

// Współrzędne polygonów w układzie wizualizacji (viewBox 0 0 3309 1847),
// wprost z eksportu Figma - nakładka SVG siada na obrazie 1:1.
export const buildingViewBox = { width: 3309, height: 1847 } as const;
export const buildingImage = "/investments/zamyslow/images/wizualizacja-6.jpg";

/**
 * Telefon pokazywany w CAŁYM doświadczeniu Zamysłowa: strona inwestycji, eksplorator,
 * strony mieszkań, przewodnik inwestora, zarządzanie najmem, galeria, prospekt i stopka.
 *
 * To numer Arka, nie biura - decyzja klienta (08.2026): telefony z Zamysłowa mają
 * trafiać wprost do osoby, która prowadzi tę inwestycję. Zgadza się z numerem
 * na `/wynajem-zamyslow` (`RENTAL_AGENT` w `src/lib/rentals/zamyslow-rentals.ts`).
 *
 * Jedna stała, bo numer rozjechał się już raz. Zmiana tutaj przenosi się na wszystkie
 * strony Zamysłowa - reszta serwisu (strona główna, /kontakt, /dla-firm, oferty)
 * ma numer biura i jej to nie dotyczy.
 */
export const ZAMYSLOW_PHONE = {
  display: "881 431 800",
  tel: "+48881431800",
} as const;

/**
 * Opiekun inwestycji na stronach Zamysłowa - fallback, gdy Supabase (tabela
 * `agents`) chwilowo nie odpowie. Normalnie zdjęcie/rolę/wideo dociągamy
 * z bazy przez `getPublicTeamMember("Arkadiusz Jezusek")`, więc podmiana
 * zdjęcia albo dogranie autoprezentacji nie wymaga zmian w kodzie.
 */
export const ZAMYSLOW_AGENT_FALLBACK = {
  name: "Arkadiusz Jezusek",
  role: AREK_ROLE,
  photoUrl:
    "https://yrkvochsziertbvzbnol.supabase.co/storage/v1/object/public/agent-photos/Arkadiusz%20Jezusek.png",
} as const;

/**
 * Skrót autoprezentacji Arka do panelu „Twój opiekun inwestycji" - wyciąg
 * z jego bio (pełna wersja żyje w bazie i na /agent/arkadiusz), przycięty
 * do wątków Zamysłowa.
 */
export const ZAMYSLOW_AGENT_BIO =
  "Od 9 lat łączę sprzedaż, najem i inwestycje. Na Osiedlu Zamysłów odpowiadam za cały cykl życia nieruchomości: od doradztwa przy zakupie mieszkania, po jego późniejszy wynajem i pełną obsługę najemców.";

export type ZamyslowData = {
  name: string;
  images: {
    building: string;
    unitLayout3d: string;
  };
  // Wizualizacja 3D mieszkania ("2 animacja model 3d.mp4") - Cloudflare Stream.
  //
  // UWAGA: sekcja „Zobacz układ mieszkania" została zdjęta z eksploratora
  // (decyzja klienta 31.07.2026 - na razie niepotrzebna). Adresy zostawiamy,
  // żeby nie szukać ich ponownie, gdyby film miał wrócić.
  tour3d: {
    embedSrc: string;
    poster: string;
  };
  floors: ZamyslowFloor[];
};

// --- Dane mieszkań per piętro (architektura 13.07.2026) ---
// Numeracja: numer = 6 * index piętra + pozycja. Pozycje na rzucie (orientacja jak
// u architekta, north-up): góra-prawo=1, PRAWO=2, dół-prawo=3, dół-lewo=4, LEWO=5,
// góra-lewo=6. Stąd np. na 1. piętrze M11 jest po lewej, a M8 po prawej.
//
// Poniższe `slots` zasilają listę mieszkań pod hero. Interaktywne rzuty (obrazy +
// klikalne strefy) są osobno, w `floorPlan` każdego piętra - generowane skryptem
// `scripts/zamyslow-floorplan.mjs` z plików SVG eksportowanych z Illustratora.
const liv = (a: number): FloorPlanRoom => ({ name: "Pokój dzienny z aneksem", areaM2: a });
const rm = (a: number): FloorPlanRoom => ({ name: "Pokój", areaM2: a });
const bd = (a: number): FloorPlanRoom => ({ name: "Sypialnia", areaM2: a });
const ba = (a: number): FloorPlanRoom => ({ name: "Łazienka", areaM2: a });

type PlanSlot = { area: number; rooms: number; roomsList: FloorPlanRoom[] };
function buildFloorData(floorIndex: number, slots: PlanSlot[]) {
  const base = floorIndex * 6;
  const units: ZamyslowUnit[] = slots.map((s, i) => ({
    id: `M${base + i + 1}`,
    areaM2: s.area,
    rooms: s.rooms,
  }));
  return { units };
}

const GROUND_DATA = buildFloorData(0, [
  { area: 31.12, rooms: 2, roomsList: [liv(20.23), bd(7.19), ba(3.7)] },
  { area: 49.15, rooms: 3, roomsList: [liv(27.04), rm(7.28), ba(4.48), bd(10.35)] },
  { area: 27.44, rooms: 2, roomsList: [liv(16.4), bd(7.48), ba(3.56)] },
  { area: 28.69, rooms: 2, roomsList: [liv(17.4), ba(4.13), bd(7.16)] },
  { area: 55.42, rooms: 3, roomsList: [liv(27.82), rm(10.24), ba(4.98), bd(12.38)] },
  { area: 32.34, rooms: 2, roomsList: [liv(18.47), bd(8.74), ba(5.13)] },
]);
const FLOOR2_DATA = buildFloorData(2, [
  { area: 31.03, rooms: 2, roomsList: [liv(20.14), bd(7.19), ba(3.7)] },
  { area: 48.97, rooms: 3, roomsList: [liv(27.04), rm(7.28), ba(4.48), bd(10.17)] },
  { area: 27.44, rooms: 2, roomsList: [liv(16.4), bd(7.48), ba(3.56)] },
  { area: 28.43, rooms: 2, roomsList: [liv(17.14), ba(4.13), bd(7.16)] },
  { area: 55.24, rooms: 3, roomsList: [liv(27.82), rm(10.24), ba(4.8), bd(12.38)] },
  { area: 40.6, rooms: 3, roomsList: [liv(19.14), rm(8.25), ba(4.95), bd(8.26)] },
]);
const FLOOR3_DATA = buildFloorData(3, [
  { area: 31.03, rooms: 2, roomsList: [liv(20.14), bd(7.19), ba(3.7)] },
  { area: 48.71, rooms: 3, roomsList: [liv(27.04), rm(7.28), ba(4.22), bd(10.17)] },
  { area: 27.18, rooms: 2, roomsList: [liv(16.14), bd(7.48), ba(3.56)] },
  { area: 28.26, rooms: 2, roomsList: [liv(16.97), ba(4.13), bd(7.16)] },
  { area: 55.15, rooms: 3, roomsList: [liv(27.82), rm(10.24), ba(4.71), bd(12.38)] },
  { area: 40.6, rooms: 3, roomsList: [liv(19.14), rm(8.25), ba(4.95), bd(8.26)] },
]);
const FLOOR4_DATA = buildFloorData(4, [
  { area: 30.94, rooms: 2, roomsList: [liv(20.05), bd(7.19), ba(3.7)] },
  { area: 48.53, rooms: 3, roomsList: [liv(27.04), rm(7.28), ba(4.22), bd(9.99)] },
  { area: 27.18, rooms: 2, roomsList: [liv(16.14), bd(7.48), ba(3.56)] },
  { area: 28.17, rooms: 2, roomsList: [liv(16.88), ba(4.13), bd(7.16)] },
  { area: 55.06, rooms: 3, roomsList: [liv(27.82), rm(10.24), ba(4.62), bd(12.38)] },
  { area: 40.42, rooms: 3, roomsList: [liv(19.14), rm(8.07), ba(4.95), bd(8.26)] },
]);
const FLOOR5_DATA = buildFloorData(5, [
  { area: 30.94, rooms: 2, roomsList: [liv(20.05), bd(7.19), ba(3.7)] },
  { area: 48.53, rooms: 3, roomsList: [liv(27.04), rm(7.28), ba(4.22), bd(9.99)] },
  { area: 27.18, rooms: 2, roomsList: [liv(16.14), bd(7.48), ba(3.56)] },
  { area: 28.17, rooms: 2, roomsList: [liv(16.88), ba(4.13), bd(7.16)] },
  { area: 54.97, rooms: 3, roomsList: [liv(27.82), rm(10.24), ba(4.53), bd(12.38)] },
  { area: 32.16, rooms: 2, roomsList: [liv(19.14), rm(8.07), ba(4.95)] },
]);

export const zamyslowData: ZamyslowData = {
  name: "Osiedle Zamysłów",
  images: {
    building: buildingImage,
    unitLayout3d: "/investments/zamyslow/images/unit-layout-3d.webp",
  },
  tour3d: {
    embedSrc:
      "https://customer-kyw4a39hhmgt80ol.cloudflarestream.com/6b68e4a33e394c2e599961cd8fd045b2/iframe?autoplay=true&muted=true&loop=true&controls=false&preload=auto",
    poster:
      "https://customer-kyw4a39hhmgt80ol.cloudflarestream.com/6b68e4a33e394c2e599961cd8fd045b2/thumbnails/thumbnail.jpg?time=&height=600",
  },
  floors: [
    {
      id: "ground",
      label: "Parter",
      plan: "/investments/zamyslow/floorplans/floor-ground.pdf",
      polygons: {
        left: "M1031 1178.5L1519.5 1261L1519.5 1320L1519.5 1418.5L1031 1304.5L1031 1178.5Z",
        right:
          "M1519.5 1261L1650 1223L1737 1202.5L1850 1174L2234.5 1061.5L2234.5 1151.5L1934 1254.5L1723 1334L1519.5 1418.5L1519.5 1261Z",
      },
      units: GROUND_DATA.units,
      // Parter ma WŁASNY kadr - tarasy wychodzą dalej niż balkony na piętrach,
      // więc wspólne okno by je ucięło. Strefy przeliczone ze wspólnego układu
      // (z kompensacją przesunięcia arkusza) i dociągnięte do granic kolorów.
      // M6 jest mniejsze niż M12 na piętrach (wejście + wózkownia).
      floorPlan: {
        image: "/investments/zamyslow/floorplans/floor-ground-plan-ogrody.webp",
        viewBox: { width: 1166.5, height: 600 },
        // Podpisy tarasów - na rzucie architekta są opisane, a same prostokąty
        // bez opisu wyglądałyby jak przypadkowe ramki. Boczne obrócone o -90°.
        annotations: [
          { text: "Taras", x: 394, y: 45 },
          { text: "Taras", x: 765, y: 45 },
          { text: "Taras", x: 411, y: 461 },
          { text: "Taras", x: 657, y: 461 },
          { text: "Taras", x: 115, y: 354, rotate: -90 },
          { text: "Taras", x: 940, y: 356, rotate: -90 },
        ],
        // Ogródki przynależne do lokali parteru (aranżacja z 26.08.2026).
        // Powierzchnie z opisów architekta, obrysy wytrasowane z rysunku -
        // patrz `scripts/zamyslow-parter-ogrody.mjs`.
        gardens: [
          {
            unit: "M1",
            areaM2: 22.6,
            d: "M577.0 9.8L691.7 9.8L691.7 79.7L577.0 79.7Z",
            label: { x: 634.4, y: 44.8 },
          },
          {
            unit: "M2",
            areaM2: 153.1,
            d: "M826.5 422.4L862.4 422.4L862.9 428.3L898.2 428.3L898.7 243.1L903.2 243.1L903.8 428.3L904.3 151.3L1156.1 151.3L1156.1 593.3L826.5 586.0Z",
            label: { x: 1020.6, y: 387.1 },
          },
          {
            unit: "M3",
            areaM2: 60.5,
            d: "M513.7 428.0L584.2 428.3L584.8 499.0L725.8 499.0L726.4 428.3L825.4 428.3L825.4 586.0L513.7 579.3Z",
            label: { x: 675, y: 516.6 },
          },
          {
            unit: "M4",
            areaM2: 52.7,
            d: "M229.2 428.3L340.5 428.3L341.1 499.0L482.1 499.0L482.7 428.3L512.3 428.3L512.3 579.3L229.2 572.9Z",
            label: { x: 359.4, y: 514.4 },
          },
          {
            unit: "M5",
            areaM2: 81.4,
            d: "M9.8 182.4L150.3 182.4L150.8 428.3L151.4 198.3L155.9 198.3L156.4 428.3L191.7 428.3L192.2 422.7L228.0 422.4L228.0 573.1L9.8 568.4Z",
            label: { x: 95.6, y: 407.1 },
          },
          {
            unit: "M6",
            areaM2: 19.1,
            d: "M248.5 9.8L319.0 9.8L319.0 74.1L255.7 74.1L255.2 79.7L248.5 79.7Z M467.6 9.8L486.0 9.8L486.0 79.7L468.1 79.7L467.6 76.6Z",
            label: { x: 283.6, y: 42.2 },
          },
        ],
        units: [
          {
            id: "M1",
            href: "/zamyslow/mieszkania/m1",
            d: "M577.5 92.1L577.5 179.9L634.5 179.9L634.5 204.8L634.5 234.7L778.5 234.7L778.5 92.1Z",
            areaM2: 31.12,
            rooms: 2,
            label: { x: 659.4, y: 174 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 20.23 },
              { name: "Sypialnia", areaM2: 7.19 },
              { name: "Łazienka", areaM2: 3.7 },
            ],
          },
          {
            id: "M2",
            href: "/zamyslow/mieszkania/m2",
            d: "M695.5 241.7L695.5 329.5L798.5 329.5L798.5 414.2L891.5 414.2L891.5 92.1L785.5 92.1L785.5 241.7Z",
            areaM2: 49.15,
            rooms: 3,
            label: { x: 792.7, y: 269.3 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.04 },
              { name: "Pokój", areaM2: 7.28 },
              { name: "Łazienka", areaM2: 4.48 },
              { name: "Sypialnia", areaM2: 10.35 },
            ],
          },
          {
            id: "M3",
            href: "/zamyslow/mieszkania/m3",
            d: "M576.5 282.6L576.5 415.2L792.5 415.2L792.5 335.5L688.5 335.5L688.5 282.6Z",
            areaM2: 27.44,
            rooms: 2,
            label: { x: 685.8, y: 344.4 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 16.4 },
              { name: "Sypialnia", areaM2: 7.48 },
              { name: "Łazienka", areaM2: 3.56 },
            ],
          },
          {
            id: "M4",
            href: "/zamyslow/mieszkania/m4",
            d: "M298.5 292.6L298.5 415.2L488.5 415.2L488.5 283.6L393.5 283.6L393.5 292.6Z",
            areaM2: 28.69,
            rooms: 2,
            label: { x: 393.5, y: 330.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 17.4 },
              { name: "Łazienka", areaM2: 4.13 },
              { name: "Sypialnia", areaM2: 7.16 },
            ],
          },
          {
            id: "M5",
            href: "/zamyslow/mieszkania/m5",
            d: "M163.5 92.1L163.5 415.2L293.5 415.2L293.5 287.6L388.5 287.6L388.5 240.7L293.5 240.7L293.5 92.1Z",
            areaM2: 55.42,
            rooms: 3,
            label: { x: 284.8, y: 259 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.82 },
              { name: "Pokój", areaM2: 10.24 },
              { name: "Łazienka", areaM2: 4.98 },
              { name: "Sypialnia", areaM2: 12.38 },
            ],
          },
          {
            id: "M6",
            href: "/zamyslow/mieszkania/m6",
            d: "M299.5 92.1L299.5 235.7L487.5 235.7L487.5 104.1L488.5 104.1L488.5 92.1Z",
            areaM2: 32.34,
            rooms: 2,
            label: { x: 425.2, y: 144 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 18.47 },
              { name: "Sypialnia", areaM2: 8.74 },
              { name: "Łazienka", areaM2: 5.13 },
            ],
          },
        ],
      },
    },
    {
      id: "floor-1",
      label: "Pierwsze piętro",
      plan: "/investments/zamyslow/floorplans/rzut 1 piętra wymiary.pdf",
      polygons: {
        left: "M1031.5 1062.5L1517.5 1115.5L1517.5 1160.5L1517.5 1259.5L1031.5 1178.5L1031.5 1062.5Z",
        right:
          "M1519 1116.5L2236 978L2234.5 1061.5L2083 1106L1800 1187.5L1659.5 1220L1519 1259.5L1519 1116.5Z",
      },
      units: [
        { id: "M7", areaM2: 31.12, rooms: 2 },
        { id: "M8", areaM2: 49.15, rooms: 3 },
        { id: "M9", areaM2: 27.44, rooms: 2 },
        { id: "M10", areaM2: 28.52, rooms: 2 },
        { id: "M11", areaM2: 55.33, rooms: 3 },
        { id: "M12", areaM2: 40.8, rooms: 3 },
      ],
      // Interaktywny rzut 1. piętra. Obraz: eksport z Illustratora nowej architektury
      // (13.07.2026, bez numerów/tekstów), obrócony -90° i wpasowany w ramkę z zapasem,
      // więc NIC nie jest ucięte (balkony/tarasy mieszczą się w kadrze).
      // Dopasowanie liczone automatycznie (bbox masek kolorowych + maksymalizacja IoU
      // względem poprzedniego rzutu, IoU 0.80), a strefy przesunięte o tę samą wartość -
      // dzięki temu każdy obrys nadal siedzi dokładnie w ścianach swojego mieszkania.
      // Numeracja zgodna z etykietami z DWG/PDF (żółte=M8, pomarańczowe=M11 itd.).
      floorPlan: {
        image: "/investments/zamyslow/floorplans/floor-1-plan-v3-north.webp",
        viewBox: { width: 822.53, height: 418.5 },
        units: [
          {
            id: "M7",
            href: "/zamyslow/mieszkania/m7",
            d: "M460.2 47.2L460.2 135.2L517.2 135.2L517.2 159.2L517.2 190.2L662.2 190.2L662.2 47.2Z",
            areaM2: 31.12,
            rooms: 2,
            label: { x: 570.2, y: 113.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 20.23 },
              { name: "Sypialnia", areaM2: 7.19 },
              { name: "Łazienka", areaM2: 3.7 },
            ],
          },
          {
            id: "M8",
            href: "/zamyslow/mieszkania/m8",
            d: "M578.2 196.2L578.2 284.2L682.2 284.2L682.2 370.2L774.2 370.2L774.2 47.2L669.2 47.2L669.2 196.2Z",
            areaM2: 49.15,
            rooms: 3,
            label: { x: 705.2, y: 213.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.04 },
              { name: "Pokój", areaM2: 7.28 },
              { name: "Łazienka", areaM2: 4.48 },
              { name: "Sypialnia", areaM2: 10.35 },
            ],
          },
          {
            id: "M9",
            href: "/zamyslow/mieszkania/m9",
            d: "M459.2 237.2L459.2 370.2L674.2 370.2L674.2 290.2L571.2 290.2L571.2 237.2Z",
            areaM2: 27.44,
            rooms: 2,
            label: { x: 555.2, y: 314.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 16.4 },
              { name: "Sypialnia", areaM2: 7.48 },
              { name: "Łazienka", areaM2: 3.56 },
            ],
          },
          {
            id: "M10",
            href: "/zamyslow/mieszkania/m10",
            d: "M181.2 247.2L181.2 370.2L368.2 370.2L371.2 238.2L277.2 238.2L277.2 247.2Z",
            areaM2: 28.52,
            rooms: 2,
            label: { x: 278.2, y: 307.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 17.23 },
              { name: "Łazienka", areaM2: 4.13 },
              { name: "Sypialnia", areaM2: 7.16 },
            ],
          },
          {
            id: "M11",
            href: "/zamyslow/mieszkania/m11",
            d: "M46.2 46.2L46.2 371.2L176.2 371.2L176.2 242.2L271.2 242.2L271.2 196.2L176.2 196.2L176.2 46.2Z",
            areaM2: 55.33,
            rooms: 3,
            label: { x: 121.2, y: 209.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.82 },
              { name: "Pokój", areaM2: 10.24 },
              { name: "Łazienka", areaM2: 4.89 },
              { name: "Sypialnia", areaM2: 12.38 },
            ],
          },
          {
            id: "M12",
            href: "/zamyslow/mieszkania/m12",
            d: "M181.2 46.2L181.2 191.2L371.2 191.2L371.2 134.2L454.2 134.2L454.2 46.2Z",
            areaM2: 40.8,
            rooms: 3,
            label: { x: 305.2, y: 113.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 19.14 },
              { name: "Pokój", areaM2: 8.45 },
              { name: "Łazienka", areaM2: 4.95 },
              { name: "Sypialnia", areaM2: 8.26 },
            ],
          },
        ],
      },
    },
    {
      id: "floor-2",
      label: "Drugie piętro",
      plan: "/investments/zamyslow/floorplans/rzut 2 piętra wymiary.pdf",
      polygons: {
        left: "M1029 915.5L1517.5 935.5L1517.5 1016.5L1517.5 1115.5L1031.5 1062.5L1029 915.5Z",
        right:
          "M1519 937.001L1807 915.5L2236 868.5L2236 978L2098.5 1004L1859 1051L1680 1085.5L1519 1115.5L1519 937.001Z",
      },
      units: FLOOR2_DATA.units,
      floorPlan: {
        image: "/investments/zamyslow/floorplans/floor-2-plan.webp",
        viewBox: { width: 822.53, height: 418.5 },
        units: [
          {
            id: "M13",
            href: "/zamyslow/mieszkania/m13",
            d: "M460.2 47.2L460.2 134.2L516.2 134.2L516.2 159.2L516.2 189.2L662.2 189.2L662.2 47.2Z",
            areaM2: 31.03,
            rooms: 2,
            label: { x: 541.9, y: 128.6 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 20.14 },
              { name: "Sypialnia", areaM2: 7.19 },
              { name: "Łazienka", areaM2: 3.7 },
            ],
          },
          {
            id: "M14",
            href: "/zamyslow/mieszkania/m14",
            d: "M577.2 196.2L577.2 284.2L682.2 284.2L682.2 370.2L774.2 370.2L774.2 47.2L668.2 47.2L668.2 196.2Z",
            areaM2: 48.97,
            rooms: 3,
            label: { x: 675.4, y: 224.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.04 },
              { name: "Pokój", areaM2: 7.28 },
              { name: "Łazienka", areaM2: 4.48 },
              { name: "Sypialnia", areaM2: 10.17 },
            ],
          },
          {
            id: "M15",
            href: "/zamyslow/mieszkania/m15",
            d: "M460.2 238.2L460.2 370.2L675.2 370.2L675.2 291.2L571.2 291.2L571.2 238.2Z",
            areaM2: 27.44,
            rooms: 2,
            label: { x: 568.9, y: 299.9 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 16.4 },
              { name: "Sypialnia", areaM2: 7.48 },
              { name: "Łazienka", areaM2: 3.56 },
            ],
          },
          {
            id: "M16",
            href: "/zamyslow/mieszkania/m16",
            d: "M182.2 247.2L182.2 370.2L368.2 370.2L371.2 238.2L312.2 238.2L312.2 247.2Z",
            areaM2: 28.43,
            rooms: 2,
            label: { x: 288, y: 285.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 17.14 },
              { name: "Łazienka", areaM2: 4.13 },
              { name: "Sypialnia", areaM2: 7.16 },
            ],
          },
          {
            id: "M17",
            href: "/zamyslow/mieszkania/m17",
            d: "M46.2 47.2L46.2 371.2L176.2 371.2L176.2 242.2L271.2 242.2L271.2 196.2L176.2 196.2L176.2 47.2Z",
            areaM2: 55.24,
            rooms: 3,
            label: { x: 167.5, y: 214.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.82 },
              { name: "Pokój", areaM2: 10.24 },
              { name: "Łazienka", areaM2: 4.8 },
              { name: "Sypialnia", areaM2: 12.38 },
            ],
          },
          {
            id: "M18",
            href: "/zamyslow/mieszkania/m18",
            d: "M181.2 47.2L181.2 190.2L371.2 190.2L371.2 134.2L454.2 134.2L454.2 47.2Z",
            areaM2: 40.6,
            rooms: 3,
            label: { x: 335.5, y: 123.9 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 19.14 },
              { name: "Pokój", areaM2: 8.25 },
              { name: "Łazienka", areaM2: 4.95 },
              { name: "Sypialnia", areaM2: 8.26 },
            ],
          },
        ],
      },
    },
    {
      id: "floor-3",
      label: "Trzecie piętro",
      plan: "/investments/zamyslow/floorplans/rzut 3 piętra wymiary.pdf",
      architecturePlan: "/investments/zamyslow/floorplans/rzut 3 piętra architektura.pdf",
      polygons: {
        left: "M1029 767L1517.5 767L1517.5 836.501L1517.5 935.5L1029 915L1029 767Z",
        right:
          "M1519 767.5L1740 767.5L2238 754.5L2236.5 868.5L2112.5 882L1806 916L1680.5 925.5L1519 936.5L1519 767.5Z",
      },
      units: FLOOR3_DATA.units,
      floorPlan: {
        image: "/investments/zamyslow/floorplans/floor-3-plan.webp",
        viewBox: { width: 822.53, height: 418.5 },
        units: [
          {
            id: "M19",
            href: "/zamyslow/mieszkania/m19",
            d: "M460.0 47.2L460.0 135.2L516.0 135.2L516.0 159.2L516.0 190.2L661.0 190.2L661.0 47.2Z",
            areaM2: 31.03,
            rooms: 2,
            label: { x: 541.4, y: 129.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 20.14 },
              { name: "Sypialnia", areaM2: 7.19 },
              { name: "Łazienka", areaM2: 3.7 },
            ],
          },
          {
            id: "M20",
            href: "/zamyslow/mieszkania/m20",
            d: "M577.0 196.2L577.0 284.2L682.0 284.2L682.0 369.2L774.0 369.2L774.0 47.2L668.0 47.2L668.0 196.2Z",
            areaM2: 48.71,
            rooms: 3,
            label: { x: 675.3, y: 224.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.04 },
              { name: "Pokój", areaM2: 7.28 },
              { name: "Łazienka", areaM2: 4.22 },
              { name: "Sypialnia", areaM2: 10.17 },
            ],
          },
          {
            id: "M21",
            href: "/zamyslow/mieszkania/m21",
            d: "M459.0 238.2L459.0 370.2L675.0 370.2L675.0 290.2L571.0 290.2L571.0 238.2Z",
            areaM2: 27.18,
            rooms: 2,
            label: { x: 568.3, y: 299.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 16.14 },
              { name: "Sypialnia", areaM2: 7.48 },
              { name: "Łazienka", areaM2: 3.56 },
            ],
          },
          {
            id: "M22",
            href: "/zamyslow/mieszkania/m22",
            d: "M182.0 248.2L182.0 370.2L368.0 370.2L372.0 238.2L319.0 238.2L319.0 248.2Z",
            areaM2: 28.26,
            rooms: 2,
            label: { x: 290.3, y: 285.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 16.97 },
              { name: "Łazienka", areaM2: 4.13 },
              { name: "Sypialnia", areaM2: 7.16 },
            ],
          },
          {
            id: "M23",
            href: "/zamyslow/mieszkania/m23",
            d: "M46.0 46.2L46.0 370.2L176.0 370.2L176.0 242.2L271.0 242.2L271.0 196.2L176.0 196.2L176.0 46.2Z",
            areaM2: 55.15,
            rooms: 3,
            label: { x: 167.3, y: 213.7 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.82 },
              { name: "Pokój", areaM2: 10.24 },
              { name: "Łazienka", areaM2: 4.71 },
              { name: "Sypialnia", areaM2: 12.38 },
            ],
          },
          {
            id: "M24",
            href: "/zamyslow/mieszkania/m24",
            d: "M182.0 46.2L182.0 190.2L370.0 190.2L370.0 134.2L454.0 134.2L454.0 46.2Z",
            areaM2: 40.6,
            rooms: 3,
            label: { x: 335.3, y: 123.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 19.14 },
              { name: "Pokój", areaM2: 8.25 },
              { name: "Łazienka", areaM2: 4.95 },
              { name: "Sypialnia", areaM2: 8.26 },
            ],
          },
        ],
      },
    },
    {
      id: "floor-4",
      label: "Czwarte piętro",
      plan: "/investments/zamyslow/floorplans/rzut 4 piętra wymiary.pdf",
      architecturePlan: "/investments/zamyslow/floorplans/rzut 4 piętra architektura.pdf",
      polygons: {
        left: "M1028 617L1517.5 598L1517.5 667.501L1517.5 767.5L1029 766.5L1028 617Z",
        right:
          "M1519 598.5L1735 606.5L1859 611L2059 637.5L2142.5 637.5L2238 648L2238 754.5L2113 758L1808.5 765.5L1680 767.5L1519 767.5L1519 598.5Z",
      },
      units: FLOOR4_DATA.units,
      floorPlan: {
        image: "/investments/zamyslow/floorplans/floor-4-plan.webp",
        viewBox: { width: 822.53, height: 418.5 },
        units: [
          {
            id: "M25",
            href: "/zamyslow/mieszkania/m25",
            d: "M460.0 47.2L460.0 135.2L516.0 135.2L516.0 159.2L516.0 190.2L662.0 190.2L662.0 47.2Z",
            areaM2: 30.94,
            rooms: 2,
            label: { x: 541.7, y: 129.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 20.05 },
              { name: "Sypialnia", areaM2: 7.19 },
              { name: "Łazienka", areaM2: 3.7 },
            ],
          },
          {
            id: "M26",
            href: "/zamyslow/mieszkania/m26",
            d: "M577.0 196.2L577.0 284.2L682.0 284.2L682.0 370.2L774.0 370.2L774.0 47.2L668.0 47.2L668.0 196.2Z",
            areaM2: 48.53,
            rooms: 3,
            label: { x: 675.3, y: 224.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.04 },
              { name: "Pokój", areaM2: 7.28 },
              { name: "Łazienka", areaM2: 4.22 },
              { name: "Sypialnia", areaM2: 9.99 },
            ],
          },
          {
            id: "M27",
            href: "/zamyslow/mieszkania/m27",
            d: "M460.0 238.2L460.0 370.2L675.0 370.2L675.0 290.2L571.0 290.2L571.0 238.2Z",
            areaM2: 27.18,
            rooms: 2,
            label: { x: 568.7, y: 299.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 16.14 },
              { name: "Sypialnia", areaM2: 7.48 },
              { name: "Łazienka", areaM2: 3.56 },
            ],
          },
          {
            id: "M28",
            href: "/zamyslow/mieszkania/m28",
            d: "M182.0 247.2L182.0 370.2L368.0 370.2L372.0 238.2L319.0 238.2L319.0 247.2Z",
            areaM2: 28.17,
            rooms: 2,
            label: { x: 290.3, y: 285.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 16.88 },
              { name: "Łazienka", areaM2: 4.13 },
              { name: "Sypialnia", areaM2: 7.16 },
            ],
          },
          {
            id: "M29",
            href: "/zamyslow/mieszkania/m29",
            d: "M46.0 46.2L46.0 370.2L176.0 370.2L176.0 242.2L271.0 242.2L271.0 196.2L176.0 196.2L176.0 46.2Z",
            areaM2: 55.06,
            rooms: 3,
            label: { x: 167.3, y: 213.7 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.82 },
              { name: "Pokój", areaM2: 10.24 },
              { name: "Łazienka", areaM2: 4.62 },
              { name: "Sypialnia", areaM2: 12.38 },
            ],
          },
          {
            id: "M30",
            href: "/zamyslow/mieszkania/m30",
            d: "M181.0 46.2L181.0 190.2L370.0 190.2L370.0 134.2L453.0 134.2L453.0 46.2Z",
            areaM2: 40.42,
            rooms: 3,
            label: { x: 334.7, y: 123.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 19.14 },
              { name: "Pokój", areaM2: 8.07 },
              { name: "Łazienka", areaM2: 4.95 },
              { name: "Sypialnia", areaM2: 8.26 },
            ],
          },
        ],
      },
    },
    {
      id: "floor-5",
      label: "Piąte piętro",
      plan: "/investments/zamyslow/floorplans/rzut 5 piętra wymiary.pdf",
      architecturePlan: "/investments/zamyslow/floorplans/rzut 5 piętra architektura.pdf",
      polygons: {
        left: "M1028 472L1517.5 409L1517.5 498.501L1517.5 598.5L1028 617L1028 472Z",
        right:
          "M1519 409.5L1740 441.5L2238 529L2238 647.5L2142.5 637.5L2058.5 636.5L1807 608.5L1680.5 604.5L1519 598.5L1519 409.5Z",
      },
      units: FLOOR5_DATA.units,
      floorPlan: {
        image: "/investments/zamyslow/floorplans/floor-5-plan.webp",
        viewBox: { width: 822.53, height: 418.5 },
        units: [
          {
            id: "M31",
            href: "/zamyslow/mieszkania/m31",
            d: "M460.0 47.2L460.0 134.2L516.0 134.2L516.0 159.2L516.0 190.2L661.0 190.2L661.0 47.2Z",
            areaM2: 30.94,
            rooms: 2,
            label: { x: 541.4, y: 128.9 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 20.05 },
              { name: "Sypialnia", areaM2: 7.19 },
              { name: "Łazienka", areaM2: 3.7 },
            ],
          },
          {
            id: "M32",
            href: "/zamyslow/mieszkania/m32",
            d: "M577.0 196.2L577.0 284.2L682.0 284.2L682.0 369.2L774.0 369.2L774.0 47.2L668.0 47.2L668.0 196.2Z",
            areaM2: 48.53,
            rooms: 3,
            label: { x: 675.3, y: 224.2 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.04 },
              { name: "Pokój", areaM2: 7.28 },
              { name: "Łazienka", areaM2: 4.22 },
              { name: "Sypialnia", areaM2: 9.99 },
            ],
          },
          {
            id: "M33",
            href: "/zamyslow/mieszkania/m33",
            d: "M459.0 238.2L459.0 370.2L675.0 370.2L675.0 290.2L571.0 290.2L571.0 238.2Z",
            areaM2: 27.18,
            rooms: 2,
            label: { x: 568.3, y: 299.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 16.14 },
              { name: "Sypialnia", areaM2: 7.48 },
              { name: "Łazienka", areaM2: 3.56 },
            ],
          },
          {
            id: "M34",
            href: "/zamyslow/mieszkania/m34",
            d: "M181.0 248.2L181.0 370.2L368.0 370.2L372.0 238.2L319.0 238.2L319.0 248.2Z",
            areaM2: 28.17,
            rooms: 2,
            label: { x: 290, y: 285.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 16.88 },
              { name: "Łazienka", areaM2: 4.13 },
              { name: "Sypialnia", areaM2: 7.16 },
            ],
          },
          {
            id: "M35",
            href: "/zamyslow/mieszkania/m35",
            d: "M46.0 46.2L46.0 370.2L176.0 370.2L176.0 242.2L271.0 242.2L271.0 196.2L176.0 196.2L176.0 46.2Z",
            areaM2: 54.97,
            rooms: 3,
            label: { x: 167.3, y: 213.7 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.82 },
              { name: "Pokój", areaM2: 10.24 },
              { name: "Łazienka", areaM2: 4.53 },
              { name: "Sypialnia", areaM2: 12.38 },
            ],
          },
          {
            id: "M36",
            href: "/zamyslow/mieszkania/m36",
            d: "M182.0 46.2L182.0 190.2L371.0 190.2L371.0 56.2L371.0 56.2L371.0 46.2Z",
            areaM2: 32.16,
            rooms: 2,
            label: { x: 308, y: 97.5 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 19.14 },
              { name: "Pokój", areaM2: 8.07 },
              { name: "Łazienka", areaM2: 4.95 },
            ],
          },
        ],
      },
    },
  ],
};

/**
 * Ogródek przynależny do lokalu (tylko parter). Jedno źródło dla rzutu piętra
 * i strony oferty, żeby metraż ogródka nie rozjechał się między nimi.
 */
export function zamyslowGardenFor(unitId: string): FloorPlanGarden | null {
  for (const floor of zamyslowData.floors) {
    const g = floor.floorPlan?.gardens?.find((x) => x.unit === unitId.toUpperCase());
    if (g) return g;
  }
  return null;
}
