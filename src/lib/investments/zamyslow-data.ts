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

export type ZamyslowFloor = {
  id: string;
  label: string;
  plan: string;
  architecturePlan?: string;
  polygons: FloorPolygons;
  units: ZamyslowUnit[];
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
        { id: "M7", areaM2: 52.9, rooms: 3, status: "Dostępne" },
        { id: "M8", areaM2: 47.3, rooms: 2, status: "Dostępne" },
        { id: "M9", areaM2: 63.5, rooms: 3, status: "Dostępne" },
        { id: "M10", areaM2: 44.9, rooms: 2, status: "Dostępne" },
        { id: "M11", areaM2: 57.8, rooms: 3, status: "Dostępne" },
        { id: "M12", areaM2: 69.1, rooms: 4, status: "Dostępne" },
      ],
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
