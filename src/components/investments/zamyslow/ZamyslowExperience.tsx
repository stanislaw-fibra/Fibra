"use client";

import Image from "next/image";
import { BuildingView } from "@/components/investments/BuildingView";
import {
  buildingHotspots,
  zamyslowData,
} from "@/lib/investments/zamyslow-data";

export function ZamyslowExperience() {
  const floorData = Object.fromEntries(
    zamyslowData.floors.map((floor) => [
      floor.id,
      {
        available: floor.units.filter((unit) => unit.status === "Dostępne").length,
        total: floor.units.length,
      },
    ]),
  );

  const handleFloorClick = (floorId: string) => {
    console.log("clicked:", floorId);
  };

  return (
    <>
      <section className="relative isolate min-h-[72svh] overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0">
          <Image
            src={zamyslowData.images.entry}
            alt={`${zamyslowData.name} - wizualizacja budynku`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/55 via-ink-950/40 to-ink-950/90" />
        </div>

        <div className="container-xl relative z-10 flex min-h-[72svh] items-end py-20 md:py-24">
          <div className="max-w-3xl">
            <p className="eyebrow eyebrow-on-dark mb-5">Inwestycja premium</p>
            <h1 className="font-display fluid-display text-white md:fluid-hero">
              {zamyslowData.name}
            </h1>
            <p className="mt-6 max-w-[56ch] text-base text-white/82 md:text-lg">
              Nowe mieszkania w Rybniku — od 43 m² do 72 m². Wybierz piętro,
              przejrzyj rzuty i sprawdź dostępność lokali.
            </p>
            <a
              href="#wybierz-pietro"
              className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white hover:text-ink-900"
            >
              Wybierz piętro
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M7 2v10M3 8l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section
        id="wybierz-pietro"
        className="relative overflow-hidden bg-paper py-16 md:py-24"
      >
        <div className="container-xl space-y-10">
          <div className="max-w-3xl">
            <p className="eyebrow mb-4">Interaktywny podgląd budynku</p>
            <h2 className="font-display fluid-h2 text-ink-950">
              Wybierz piętro
            </h2>
            <p className="mt-4 text-base text-ink-600 md:text-lg">
              Najedź kursorem na kondygnację, aby zobaczyć liczbę dostępnych lokali.
            </p>
          </div>

          <div className="mx-auto max-w-5xl overflow-hidden rounded-[var(--radius-xl)] bg-ink-950 shadow-[var(--shadow-cinematic)]">
            <BuildingView
              imageSrc="/investments/zamyslow/images/building-entry.webp"
              imageAlt={`${zamyslowData.name} - bryła budynku`}
              hotspots={buildingHotspots}
              onFloorClick={handleFloorClick}
              floorData={floorData}
            />
          </div>
        </div>
      </section>

      <section className="relative bg-paper pb-20 md:pb-28">
        <div className="container-xl">
          <div className="mb-7 max-w-3xl">
            <p className="eyebrow mb-3">Dokumentacja wizualna</p>
            <h2 className="font-display fluid-h2 text-ink-950">
              Elewacje i wizualizacje inwestycji
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zamyslowData.images.gallery.map((imageSrc, index) => (
              <div
                key={imageSrc}
                className="group relative overflow-hidden rounded-[var(--radius-lg)] bg-ink-100 shadow-[var(--shadow-soft)] ring-1 ring-ink-200/70"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={imageSrc}
                    alt={`${zamyslowData.name} - elewacja ${index + 1}`}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/35 via-transparent to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
