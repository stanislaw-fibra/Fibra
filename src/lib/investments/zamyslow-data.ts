export type UnitStatus = "Dostępne" | "Rezerwacja" | "Sprzedane";

export type ZamyslowUnit = {
  id: string;
  areaM2: number;
  rooms: number;
  status: UnitStatus;
};

export type ZamyslowFloor = {
  id: string;
  label: string;
  plan: string;
  architecturePlan?: string;
  units: ZamyslowUnit[];
};

export type ZamyslowBuildingHotspot = {
  id: ZamyslowFloor["id"];
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ZamyslowData = {
  name: string;
  images: {
    entry: string;
    overview: string;
    unitLayout3d: string;
    gallery: string[];
  };
  floors: ZamyslowFloor[];
};

export const buildingHotspots: ZamyslowBuildingHotspot[] = [
  {
    id: "floor-5",
    label: "5 piętro",
    left: 8.02,
    top: 22.03,
    width: 85.44,
    height: 7.4,
  },
  {
    id: "floor-4",
    label: "4 piętro",
    left: 8.02,
    top: 34.77,
    width: 85.44,
    height: 7.88,
  },
  {
    id: "floor-3",
    label: "3 piętro",
    left: 8.02,
    top: 47.62,
    width: 85.44,
    height: 8.48,
  },
  {
    id: "floor-2",
    label: "2 piętro",
    left: 8.02,
    top: 60.31,
    width: 85.44,
    height: 9.07,
  },
  {
    id: "floor-1",
    label: "1 piętro",
    left: 8.02,
    top: 73.06,
    width: 85.44,
    height: 9.45,
  },
  {
    id: "ground",
    label: "Parter",
    left: 8.02,
    top: 84.83,
    width: 85.44,
    height: 7.07,
  },
];

export const zamyslowData: ZamyslowData = {
  name: "Osiedle Zamysłów",
  images: {
    entry: "/investments/zamyslow/images/11.webp",
    overview: "/investments/zamyslow/images/ELEWACJA1.webp",
    unitLayout3d: "/investments/zamyslow/images/10.webp",
    gallery: [
      "/investments/zamyslow/images/6.webp",
      "/investments/zamyslow/images/7.webp",
      "/investments/zamyslow/images/9.webp",
      "/investments/zamyslow/images/ELEWACJA2.webp",
      "/investments/zamyslow/images/ELEWACJA3.webp",
      "/investments/zamyslow/images/ELEWACJA4.webp",
    ],
  },
  floors: [
    {
      id: "ground",
      label: "Parter",
      plan: "/investments/zamyslow/floorplans/floor-ground.pdf",
      units: [
        { id: "M1", areaM2: 54.2, rooms: 3, status: "Dostępne" },
        { id: "M2", areaM2: 49.8, rooms: 2, status: "Rezerwacja" },
        { id: "M3", areaM2: 61.1, rooms: 3, status: "Dostępne" },
        { id: "M4", areaM2: 45.6, rooms: 2, status: "Sprzedane" },
        { id: "M5", areaM2: 58.7, rooms: 3, status: "Dostępne" },
        { id: "M6", areaM2: 67.4, rooms: 4, status: "Rezerwacja" },
      ],
    },
    {
      id: "floor-1",
      label: "1 piętro",
      plan: "/investments/zamyslow/floorplans/rzut 1 piętra wymiary.pdf",
      units: [
        { id: "M7", areaM2: 52.9, rooms: 3, status: "Dostępne" },
        { id: "M8", areaM2: 47.3, rooms: 2, status: "Dostępne" },
        { id: "M9", areaM2: 63.5, rooms: 3, status: "Rezerwacja" },
        { id: "M10", areaM2: 44.9, rooms: 2, status: "Sprzedane" },
        { id: "M11", areaM2: 57.8, rooms: 3, status: "Dostępne" },
        { id: "M12", areaM2: 69.1, rooms: 4, status: "Dostępne" },
      ],
    },
    {
      id: "floor-2",
      label: "2 piętro",
      plan: "/investments/zamyslow/floorplans/rzut 2 piętra wymiary.pdf",
      units: [
        { id: "M13", areaM2: 53.6, rooms: 3, status: "Rezerwacja" },
        { id: "M14", areaM2: 46.8, rooms: 2, status: "Dostępne" },
        { id: "M15", areaM2: 62.2, rooms: 3, status: "Dostępne" },
        { id: "M16", areaM2: 43.7, rooms: 2, status: "Sprzedane" },
        { id: "M17", areaM2: 59.4, rooms: 3, status: "Dostępne" },
        { id: "M18", areaM2: 71.2, rooms: 4, status: "Rezerwacja" },
      ],
    },
    {
      id: "floor-3",
      label: "3 piętro",
      plan: "/investments/zamyslow/floorplans/rzut 3 piętra wymiary.pdf",
      architecturePlan: "/investments/zamyslow/floorplans/rzut 3 piętra architektura.pdf",
      units: [
        { id: "M19", areaM2: 54.9, rooms: 3, status: "Dostępne" },
        { id: "M20", areaM2: 48.1, rooms: 2, status: "Dostępne" },
        { id: "M21", areaM2: 64.4, rooms: 3, status: "Rezerwacja" },
        { id: "M22", areaM2: 45.2, rooms: 2, status: "Sprzedane" },
        { id: "M23", areaM2: 58.6, rooms: 3, status: "Dostępne" },
        { id: "M24", areaM2: 70.3, rooms: 4, status: "Dostępne" },
      ],
    },
    {
      id: "floor-4",
      label: "4 piętro",
      plan: "/investments/zamyslow/floorplans/rzut 4 piętra wymiary.pdf",
      architecturePlan: "/investments/zamyslow/floorplans/rzut 4 piętra architektura.pdf",
      units: [
        { id: "M25", areaM2: 53.1, rooms: 3, status: "Rezerwacja" },
        { id: "M26", areaM2: 46.7, rooms: 2, status: "Dostępne" },
        { id: "M27", areaM2: 62.9, rooms: 3, status: "Dostępne" },
        { id: "M28", areaM2: 44.6, rooms: 2, status: "Sprzedane" },
        { id: "M29", areaM2: 57.2, rooms: 3, status: "Dostępne" },
        { id: "M30", areaM2: 68.8, rooms: 4, status: "Rezerwacja" },
      ],
    },
    {
      id: "floor-5",
      label: "5 piętro",
      plan: "/investments/zamyslow/floorplans/rzut 5 piętra wymiary.pdf",
      architecturePlan: "/investments/zamyslow/floorplans/rzut 5 piętra architektura.pdf",
      units: [
        { id: "M31", areaM2: 55.8, rooms: 3, status: "Dostępne" },
        { id: "M32", areaM2: 49.2, rooms: 2, status: "Rezerwacja" },
        { id: "M33", areaM2: 65.1, rooms: 3, status: "Dostępne" },
        { id: "M34", areaM2: 46.1, rooms: 2, status: "Sprzedane" },
        { id: "M35", areaM2: 59.7, rooms: 3, status: "Dostępne" },
        { id: "M36", areaM2: 72.4, rooms: 4, status: "Rezerwacja" },
      ],
    },
  ],
};
