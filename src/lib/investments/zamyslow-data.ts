export type UnitStatus = "Dostępne" | "Rezerwacja" | "Sprzedane";

export type ZamyslowUnit = {
  id: string;
  areaM2: number;
  rooms: number;
  status: UnitStatus;
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
  status: UnitStatus;
  roomsList: FloorPlanRoom[];
  label: { x: number; y: number };
};

/**
 * Interaktywny rzut piętra: lekki obraz (webp) + nałożone klikalne strefy mieszkań.
 * Współrzędne stref żyją w `viewBox` (naturalny układ obrazu 1x), a SVG siada na
 * obrazie 1:1 (oba object-contain / xMidYMid meet o tym samym aspekcie).
 */
export type FloorPlan = {
  image: string;
  viewBox: { width: number; height: number };
  units: FloorPlanUnit[];
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

export type ZamyslowData = {
  name: string;
  images: {
    building: string;
    unitLayout3d: string;
  };
  // Wizualizacja 3D mieszkania ("2 animacja model 3d.mp4") - Cloudflare Stream.
  // embedSrc = URL iframe Stream z parametrami ambient (autoplay/muted/loop/bez kontrolek).
  // Pusty string => sekcja pokazuje sam poster (bez odtwarzacza).
  tour3d: {
    embedSrc: string;
    poster: string;
  };
  floors: ZamyslowFloor[];
};

// --- Rzuty pozostałych pięter (parter, 2-5) na tej samej KOLOROWEJ bazie co 1. piętro ---
// Budynek jest powtarzalny: te same 6 stref (geometria 1:1 z floor-1), a numer mieszkania
// i dane (metraż/pokoje/rozkład) per piętro z architektonicznych PDF (13.07.2026).
// Numeracja ZWERYFIKOWANA względem PDF/DWG: rozmiar pikselowy każdej kolorowej strefy na
// rzucie z Figmy pokrywa się z metrażem z PDF. Pozycja→offset (rzut z Figmy = PDF obrócony
// o 180°): dół-środek-L=1, LEWO=2, góra-środek-L=3, góra-środek-P=4, PRAWO=5, dół-środek-P=6.
// Numer mieszkania = 6*index piętra + offset. Obraz = kolorowy rzut floor-1 (współdzielony,
// bo układ pięter jest identyczny). Floor-1 zostaje nietknięty (osobny literał niżej).
const liv = (a: number): FloorPlanRoom => ({ name: "Pokój dzienny z aneksem", areaM2: a });
const rm = (a: number): FloorPlanRoom => ({ name: "Pokój", areaM2: a });
const bd = (a: number): FloorPlanRoom => ({ name: "Sypialnia", areaM2: a });
const ba = (a: number): FloorPlanRoom => ({ name: "Łazienka", areaM2: a });

const COLORED_PLAN_IMAGE =
  "/investments/zamyslow/floorplans/floor-1-plan-775x370.webp";

// Geometria 6 stref w kolejności offsetów 1..6 (identyczna jak M7-M12 na floor-1).
const PLAN_SLOTS: { d: string; label: { x: number; y: number } }[] = [
  { d: "M336 346L336 261L282 261L282 235L282 205L139 205L139 346Z", label: { x: 229, y: 281 } },
  { d: "M220 195L220 110L116 110L116 25L24 25L24 342L130 342L130 195Z", label: { x: 94, y: 181 } },
  { d: "M335 154L335 24L127 24L127 102L228 102L228 154Z", label: { x: 244, y: 80 } },
  { d: "M615 144L615 25L430 25L431 154L521 154L521 144Z", label: { x: 521, y: 87 } },
  { d: "M751 346L751 25L625 25L625 153L530 153L530 197L625 197L625 346Z", label: { x: 678, y: 185 } },
  { d: "M615 345L615 205L429 205L429 262L347 262L347 345Z", label: { x: 494, y: 281 } },
];

type PlanSlot = { area: number; rooms: number; roomsList: FloorPlanRoom[] };
function buildFloorData(floorIndex: number, slots: PlanSlot[]) {
  const base = floorIndex * 6;
  const planUnits: FloorPlanUnit[] = slots.map((s, i) => ({
    id: `M${base + i + 1}`,
    d: PLAN_SLOTS[i].d,
    label: PLAN_SLOTS[i].label,
    areaM2: s.area,
    rooms: s.rooms,
    status: "Dostępne",
    roomsList: s.roomsList,
  }));
  const units: ZamyslowUnit[] = planUnits.map((u) => ({
    id: u.id,
    areaM2: u.areaM2,
    rooms: u.rooms,
    status: u.status,
  }));
  const floorPlan: FloorPlan = {
    image: COLORED_PLAN_IMAGE,
    viewBox: { width: 775, height: 370 },
    units: planUnits,
  };
  return { units, floorPlan };
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
      floorPlan: GROUND_DATA.floorPlan,
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
        { id: "M7", areaM2: 31.21, rooms: 2, status: "Dostępne" },
        { id: "M8", areaM2: 49.58, rooms: 3, status: "Dostępne" },
        { id: "M9", areaM2: 27.7, rooms: 2, status: "Dostępne" },
        { id: "M10", areaM2: 28.95, rooms: 2, status: "Dostępne" },
        { id: "M11", areaM2: 55.52, rooms: 3, status: "Dostępne" },
        { id: "M12", areaM2: 40.83, rooms: 3, status: "Dostępne" },
      ],
      // Interaktywny rzut 1. piętra - jedyne piętro z gotowym rzutem (prototyp).
      // Obraz transparentny, w orientacji jak w Figmie (artboard obrócony -90°).
      // Kontury stref to CZYSTE kształty z Figmy (proste linie), obrócone o 180°
      // (artboard -90° + obrót obrazu -90° = 180°) i dopasowane do pozycji mieszkań
      // w układzie viewBox 775x370. Przypisanie etykiet M7-M12 wg rozmiaru kształtów
      // z Figmy - tymczasowe, podmienimy razem z linkami do ofert.
      floorPlan: {
        image: "/investments/zamyslow/floorplans/floor-1-plan-775x370.webp",
        viewBox: { width: 775, height: 370 },
        units: [
          {
            id: "M7",
            href: "/oferty/nowe-garaz-podziemny-ogrod-urzadzone-pod-klucz-FIB-MW-4173",
            d: "M336 346L336 261L282 261L282 235L282 205L139 205L139 346Z",
            areaM2: 31.21,
            rooms: 2,
            status: "Dostępne",
            label: { x: 229, y: 281 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 20.43 },
              { name: "Sypialnia", areaM2: 7.08 },
              { name: "Łazienka", areaM2: 3.7 },
            ],
          },
          {
            id: "M8",
            href: "/oferty/nowa-kawalerka-premium-klimatyzacja-winda-FIB-MW-4172",
            d: "M220 195L220 110L116 110L116 25L24 25L24 342L130 342L130 195Z",
            areaM2: 49.58,
            rooms: 3,
            status: "Dostępne",
            label: { x: 94, y: 181 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.04 },
              { name: "Pokój", areaM2: 7.28 },
              { name: "Sypialnia", areaM2: 10.53 },
              { name: "Łazienka", areaM2: 4.73 },
            ],
          },
          {
            id: "M9",
            href: "/oferty/nowy-apartamentowiec-wyposazone-pod-klucz-FIB-MW-4171",
            d: "M335 154L335 24L127 24L127 102L228 102L228 154Z",
            areaM2: 27.7,
            rooms: 2,
            status: "Dostępne",
            label: { x: 244, y: 80 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 16.66 },
              { name: "Sypialnia", areaM2: 7.48 },
              { name: "Łazienka", areaM2: 3.56 },
            ],
          },
          {
            id: "M10",
            href: "/oferty/tylko-185-000-zl-2-pokoje-balkon-1-pietro-FIB-MS-4168",
            d: "M615 144L615 25L430 25L431 154L521 154L521 144Z",
            areaM2: 28.95,
            rooms: 2,
            status: "Dostępne",
            label: { x: 521, y: 87 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 17.66 },
              { name: "Sypialnia", areaM2: 7.16 },
              { name: "Łazienka", areaM2: 4.13 },
            ],
          },
          {
            id: "M11",
            href: "/oferty/tu-chce-sie-wracac-apartament-z-balkonem-FIB-MW-4164",
            d: "M751 346L751 25L625 25L625 153L530 153L530 197L625 197L625 346Z",
            areaM2: 55.52,
            rooms: 3,
            status: "Dostępne",
            label: { x: 678, y: 185 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 27.94 },
              { name: "Pokój", areaM2: 10.24 },
              { name: "Sypialnia", areaM2: 12.38 },
              { name: "Łazienka", areaM2: 4.96 },
            ],
          },
          {
            id: "M12",
            href: "/oferty/premium-3-pokoje-2-miejsca-parkingowe-nowe-budown-FIB-MS-4158",
            d: "M615 345L615 205L429 205L429 262L347 262L347 345Z",
            areaM2: 40.83,
            rooms: 3,
            status: "Dostępne",
            label: { x: 494, y: 281 },
            roomsList: [
              { name: "Pokój dzienny z aneksem", areaM2: 19.14 },
              { name: "Pokój", areaM2: 8.61 },
              { name: "Sypialnia", areaM2: 8.13 },
              { name: "Łazienka", areaM2: 4.95 },
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
      floorPlan: FLOOR2_DATA.floorPlan,
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
      floorPlan: FLOOR3_DATA.floorPlan,
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
      floorPlan: FLOOR4_DATA.floorPlan,
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
      floorPlan: FLOOR5_DATA.floorPlan,
    },
  ],
};
