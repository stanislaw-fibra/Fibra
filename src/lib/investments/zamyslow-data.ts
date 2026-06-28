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
  href: string;
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
      units: [
        { id: "M1", areaM2: 54.2, rooms: 3, status: "Dostępne" },
        { id: "M2", areaM2: 49.8, rooms: 2, status: "Dostępne" },
        { id: "M3", areaM2: 61.1, rooms: 3, status: "Dostępne" },
        { id: "M4", areaM2: 45.6, rooms: 2, status: "Dostępne" },
        { id: "M5", areaM2: 58.7, rooms: 3, status: "Dostępne" },
        { id: "M6", areaM2: 67.4, rooms: 4, status: "Dostępne" },
      ],
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
      units: [
        { id: "M13", areaM2: 53.6, rooms: 3, status: "Dostępne" },
        { id: "M14", areaM2: 46.8, rooms: 2, status: "Dostępne" },
        { id: "M15", areaM2: 62.2, rooms: 3, status: "Dostępne" },
        { id: "M16", areaM2: 43.7, rooms: 2, status: "Dostępne" },
        { id: "M17", areaM2: 59.4, rooms: 3, status: "Dostępne" },
        { id: "M18", areaM2: 71.2, rooms: 4, status: "Dostępne" },
      ],
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
      units: [
        { id: "M19", areaM2: 54.9, rooms: 3, status: "Dostępne" },
        { id: "M20", areaM2: 48.1, rooms: 2, status: "Dostępne" },
        { id: "M21", areaM2: 64.4, rooms: 3, status: "Dostępne" },
        { id: "M22", areaM2: 45.2, rooms: 2, status: "Dostępne" },
        { id: "M23", areaM2: 58.6, rooms: 3, status: "Dostępne" },
        { id: "M24", areaM2: 70.3, rooms: 4, status: "Dostępne" },
      ],
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
      units: [
        { id: "M25", areaM2: 53.1, rooms: 3, status: "Dostępne" },
        { id: "M26", areaM2: 46.7, rooms: 2, status: "Dostępne" },
        { id: "M27", areaM2: 62.9, rooms: 3, status: "Dostępne" },
        { id: "M28", areaM2: 44.6, rooms: 2, status: "Dostępne" },
        { id: "M29", areaM2: 57.2, rooms: 3, status: "Dostępne" },
        { id: "M30", areaM2: 68.8, rooms: 4, status: "Dostępne" },
      ],
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
      units: [
        { id: "M31", areaM2: 55.8, rooms: 3, status: "Dostępne" },
        { id: "M32", areaM2: 49.2, rooms: 2, status: "Dostępne" },
        { id: "M33", areaM2: 65.1, rooms: 3, status: "Dostępne" },
        { id: "M34", areaM2: 46.1, rooms: 2, status: "Dostępne" },
        { id: "M35", areaM2: 59.7, rooms: 3, status: "Dostępne" },
        { id: "M36", areaM2: 72.4, rooms: 4, status: "Dostępne" },
      ],
    },
  ],
};
