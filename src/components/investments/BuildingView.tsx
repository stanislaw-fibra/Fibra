"use client";

import { useState } from "react";

export type BuildingHotspot = {
  id: string;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type BuildingFloorAvailability = {
  available: number;
  total: number;
};

type BuildingViewProps = {
  imageSrc: string;
  imageAlt?: string;
  hotspots: BuildingHotspot[];
  onFloorClick?: (floorId: string) => void;
  floorData?: Record<string, BuildingFloorAvailability>;
};

export function BuildingView({
  imageSrc,
  imageAlt = "Wizualizacja budynku",
  hotspots,
  onFloorClick,
  floorData,
}: BuildingViewProps) {
  const [hoveredFloor, setHoveredFloor] = useState<string | null>(null);

  return (
    <div className="relative w-full select-none">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="block h-auto w-full"
        draggable={false}
      />

      {hotspots.map((spot) => {
        const isHovered = hoveredFloor === spot.id;
        const availability = floorData?.[spot.id];

        return (
          <button
            key={spot.id}
            type="button"
            onClick={() => onFloorClick?.(spot.id)}
            onMouseEnter={() => setHoveredFloor(spot.id)}
            onMouseLeave={() => setHoveredFloor(null)}
            onFocus={() => setHoveredFloor(spot.id)}
            onBlur={() => setHoveredFloor(null)}
            aria-label={spot.label}
            className={[
              "absolute cursor-pointer rounded-sm border-2 transition-all duration-200",
              isHovered
                ? "border-white/60 bg-white/25"
                : "border-transparent bg-transparent hover:bg-white/15",
            ].join(" ")}
            style={{
              left: `${spot.left}%`,
              top: `${spot.top}%`,
              width: `${spot.width}%`,
              height: `${spot.height}%`,
            }}
          >
            {isHovered && (
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded bg-black/80 px-3 py-1.5 text-sm font-medium text-white shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
              >
                <span>{spot.label}</span>
                {availability && (
                  <span className="text-xs text-white/80">
                    {availability.available} / {availability.total} dostępnych
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
