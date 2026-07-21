"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from "framer-motion";
import {
  buildingViewBox,
  zamyslowData,
  type UnitStatus,
  type ZamyslowFloor,
} from "@/lib/investments/zamyslow-data";
import { FloorPlanView } from "./FloorPlanView";

const statusStyles: Record<UnitStatus, string> = {
  Dostępne: "bg-emerald-50 text-emerald-700",
  Rezerwacja: "bg-amber-50 text-amber-700",
  Sprzedane: "bg-ink-100 text-ink-500",
};

const statusDot: Record<UnitStatus, string> = {
  Dostępne: "bg-emerald-500",
  Rezerwacja: "bg-amber-500",
  Sprzedane: "bg-ink-400",
};

const formatArea = (value: number) => `${String(value).replace(".", ",")} m²`;

// Wyłuskuje pary (x,y) z atrybutu d (M/L/Z) - wystarcza dla naszych polygonów.
function pathPoints(d: string): Array<[number, number]> {
  const nums = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
  const points: Array<[number, number]> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) points.push([nums[i], nums[i + 1]]);
  return points;
}

function floorCenter(floor: ZamyslowFloor) {
  const pts = [
    ...pathPoints(floor.polygons.left),
    ...pathPoints(floor.polygons.right),
  ];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return {
    x: (cx / buildingViewBox.width) * 100,
    y: (cy / buildingViewBox.height) * 100,
  };
}

const titleGroup: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.55 } },
};
const titleItem: Variants = {
  hidden: { y: 26, opacity: 0, clipPath: "inset(0 0 100% 0)" },
  show: {
    y: 0,
    opacity: 1,
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

export function ZamyslowBuilding() {
  const floors = zamyslowData.floors;
  const floorsTopDown = useMemo(() => [...floors].reverse(), [floors]);
  const centers = useMemo(
    () => Object.fromEntries(floors.map((f) => [f.id, floorCenter(f)])),
    [floors],
  );

  const reduceMotion = useReducedMotion();

  // Kompaktowy layout (telefony) - mniejszy push-in, by nie ścinać piętra.
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const selected = floors.find((floor) => floor.id === selectedId) ?? null;
  const focusId = hoveredId ?? selectedId;
  const focusFloor = floors.find((floor) => floor.id === focusId) ?? null;

  // Parallax za kursorem
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 70, damping: 20, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 70, damping: 20, mass: 0.4 });

  const handleMouseMove = (event: React.MouseEvent) => {
    if (reduceMotion || selectedId || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    px.set(((event.clientX - rect.left) / rect.width - 0.5) * -22);
    py.set(((event.clientY - rect.top) / rect.height - 0.5) * -16);
  };
  const resetParallax = () => {
    px.set(0);
    py.set(0);
  };

  // Klik w piętro NIE przerzuca już strony niżej - zostajemy w scenie i otwieramy
  // interaktywny rzut piętra w tym samym kadrze (premium experience).
  const selectFloor = (id: string) => {
    setSelectedId(id);
    setExpandedUnit(null);
    resetParallax();
  };

  const clearSelection = () => {
    setSelectedId(null);
    setExpandedUnit(null);
  };

  const zoomOrigin = selected
    ? `${centers[selected.id].x}% ${centers[selected.id].y}%`
    : "50% 50%";

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-paper">
        {/* Full-bleed scena */}
        <div
          ref={heroRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetParallax}
          className="relative w-full overflow-hidden bg-ink-950 aspect-[4/5] sm:aspect-[3/2] md:aspect-[3309/1847]"
        >
          {/* Warstwa parallax (overscan tylko na desktopie) */}
          <motion.div
            className="absolute inset-0 md:scale-[1.05]"
            style={{ x: sx, y: sy }}
          >
            {/* Warstwa push-in (intro + dojazd do piętra) */}
            <motion.div
              className="absolute inset-0"
              style={{ transformOrigin: zoomOrigin }}
              initial={{ scale: 1.08 }}
              animate={{ scale: selectedId ? (isCompact ? 1.22 : 1.55) : 1 }}
              transition={{ duration: selectedId ? 0.9 : 1.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={zamyslowData.images.building}
                alt={`${zamyslowData.name} - wizualizacja budynku`}
                className="absolute inset-0 h-full w-full object-cover object-center"
                draggable={false}
              />

              <svg
                viewBox={`0 0 ${buildingViewBox.width} ${buildingViewBox.height}`}
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 h-full w-full"
              >
                <defs>
                  <mask id="zamyslow-spotlight">
                    <rect
                      x="0"
                      y="0"
                      width={buildingViewBox.width}
                      height={buildingViewBox.height}
                      fill="white"
                    />
                    {focusFloor && (
                      <>
                        <path d={focusFloor.polygons.left} fill="black" />
                        <path d={focusFloor.polygons.right} fill="black" />
                      </>
                    )}
                  </mask>
                </defs>

                {/* Przyciemnienie reszty budynku = spotlight na wybranej kondygnacji */}
                <rect
                  x="0"
                  y="0"
                  width={buildingViewBox.width}
                  height={buildingViewBox.height}
                  fill="#05070a"
                  mask="url(#zamyslow-spotlight)"
                  pointerEvents="none"
                  style={{
                    opacity: focusFloor ? 0.55 : 0,
                    transition: "opacity 350ms ease",
                  }}
                />

                {/* Strefy klikalne */}
                {floors.map((floor) => (
                  <g
                    key={floor.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${floor.label}, ${floor.units.length} mieszkań`}
                    onMouseEnter={() => setHoveredId(floor.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(floor.id)}
                    onBlur={() => setHoveredId(null)}
                    onClick={() => selectFloor(floor.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectFloor(floor.id);
                      }
                    }}
                    className="cursor-pointer outline-none"
                    style={{ fill: "rgba(0,0,0,0)" }}
                  >
                    <path d={floor.polygons.left} />
                    <path d={floor.polygons.right} />
                  </g>
                ))}

                {/* Elegancki obrys wyróżnionej kondygnacji */}
                {focusFloor && (
                  <g
                    pointerEvents="none"
                    style={{ fill: "rgba(255,255,255,0.06)" }}
                  >
                    <path
                      d={focusFloor.polygons.left}
                      stroke="rgba(255,255,255,0.95)"
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d={focusFloor.polygons.right}
                      stroke="rgba(255,255,255,0.95)"
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                )}
              </svg>
            </motion.div>
          </motion.div>

          {/* Interaktywny rzut wybranego piętra - otwiera się w tym samym kadrze.
              Winda w środku pozwala przełączać WSZYSTKIE piętra bez wychodzenia. */}
          <AnimatePresence>
            {selected && (
              <FloorPlanView
                key="floorplan"
                floors={floors}
                selectedId={selected.id}
                onSelect={selectFloor}
                building={zamyslowData.images.building}
                onBack={clearSelection}
              />
            )}
          </AnimatePresence>

          {/* Kurtyny - reżyserowane wejście */}
          {!reduceMotion && (
            <>
              <motion.div
                className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-ink-950"
                initial={{ height: "50%" }}
                animate={{ height: "0%" }}
                transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
              />
              <motion.div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-ink-950"
                initial={{ height: "50%" }}
                animate={{ height: "0%" }}
                transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
              />
            </>
          )}

          {/* Gradienty czytelności */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-2/5 bg-gradient-to-b from-ink-950/65 via-ink-950/15 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/3 bg-gradient-to-t from-ink-950/70 via-ink-950/15 to-transparent" />

          {/* Tytuł / nawigacja powrotna */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
            <div className="container-xl pt-8 md:pt-12">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.button
                    key="back"
                    type="button"
                    onClick={clearSelection}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white hover:text-ink-900"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Wszystkie piętra
                  </motion.button>
                ) : (
                  <motion.div
                    key="title"
                    variants={titleGroup}
                    initial="hidden"
                    animate="show"
                  >
                    <motion.h1 variants={titleItem} className="font-display fluid-h2 text-white">
                      {zamyslowData.name}
                    </motion.h1>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Podpowiedź / dostępność */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
            <div className="container-xl pb-6 md:pb-8">
              <div className="inline-flex items-center gap-2.5 rounded-full bg-black/55 px-4 py-2 text-white backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                <span className="text-sm font-medium">
                  {focusFloor ? focusFloor.label : "Wybierz piętro budynku"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Eksplorator pięter */}
        <div className="container-xl py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-12">
            {/* Selektor - kolejność z góry na dół, jak w budynku */}
            <div className="lg:sticky lg:top-24">
              <p className="eyebrow mb-4">Piętra</p>
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/70 bg-white">
                {floorsTopDown.map((floor, index) => {
                  const isActive = selectedId === floor.id;
                  return (
                    <button
                      key={floor.id}
                      type="button"
                      onClick={() => selectFloor(floor.id)}
                      onMouseEnter={() => setHoveredId(floor.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={[
                        "group flex min-h-[56px] w-full items-center justify-between gap-3 px-5 text-left transition-colors duration-200",
                        index > 0 ? "border-t border-ink-200/60" : "",
                        isActive
                          ? "bg-ink-900 text-white"
                          : "text-ink-700 hover:bg-ink-50 active:bg-ink-100",
                      ].join(" ")}
                    >
                      <span className="text-[15px] font-medium tracking-tight">
                        {floor.label}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden
                        className={[
                          "shrink-0 transition-transform duration-200",
                          isActive
                            ? "translate-x-0 text-white"
                            : "-translate-x-1 text-ink-300 group-hover:translate-x-0 group-hover:text-ink-500",
                        ].join(" ")}
                      >
                        <path
                          d="M6 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Szczegóły wybranego piętra */}
            <div ref={detailRef} className="scroll-mt-24">
              {selected ? (
                <div>
                    <div className="flex items-baseline justify-between gap-3 border-b border-ink-200/70 pb-5">
                      <h2 className="font-display text-2xl text-ink-950 md:text-3xl">
                        {selected.label}
                      </h2>
                      <span className="shrink-0 text-sm text-ink-500">
                        {selected.units.length} mieszkań
                      </span>
                    </div>

                    <div className="mt-6">
                      <p className="eyebrow mb-4">Mieszkania na tym piętrze</p>
                      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/80 bg-white shadow-[var(--shadow-card)]">
                        <ul className="divide-y divide-ink-200/70">
                          {selected.units.map((unit) => {
                            const plan = selected.floorPlan?.units.find(
                              (u) => u.id === unit.id,
                            );
                            const expandable = Boolean(plan?.roomsList?.length);
                            const isOpen = expandedUnit === unit.id;
                            return (
                              <li key={unit.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    expandable &&
                                    setExpandedUnit(isOpen ? null : unit.id)
                                  }
                                  aria-expanded={expandable ? isOpen : undefined}
                                  className={[
                                    "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors sm:gap-4",
                                    expandable
                                      ? "hover:bg-paper-warm/50"
                                      : "cursor-default",
                                  ].join(" ")}
                                >
                                  <span className="w-11 shrink-0 font-sans text-[16px] font-bold tabular-nums tracking-tight text-ink-950">
                                    {unit.id}
                                  </span>
                                  <span className="min-w-0 flex-1 text-[14px] text-ink-500">
                                    <span className="font-medium text-ink-900">
                                      {formatArea(unit.areaM2)}
                                    </span>
                                    <span className="text-ink-400">
                                      {" "}
                                      · {unit.rooms}{" "}
                                      {unit.rooms === 1 ? "pokój" : "pokoje"}
                                    </span>
                                  </span>
                                  <span
                                    className={[
                                      "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                      statusStyles[unit.status],
                                    ].join(" ")}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${statusDot[unit.status]}`}
                                    />
                                    {unit.status}
                                  </span>
                                  {expandable && (
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 16 16"
                                      fill="none"
                                      aria-hidden
                                      className={[
                                        "shrink-0 text-ink-400 transition-transform duration-300",
                                        isOpen ? "rotate-180" : "",
                                      ].join(" ")}
                                    >
                                      <path
                                        d="M4 6l4 4 4-4"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  )}
                                </button>

                                <AnimatePresence initial={false}>
                                  {isOpen && plan?.roomsList && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                      className="overflow-hidden"
                                    >
                                      <div className="bg-paper-warm/40 px-5 pb-5 pt-1">
                                        <p className="eyebrow mb-3 text-ink-400">
                                          Rozkład pomieszczeń
                                        </p>
                                        <ul className="space-y-2">
                                          {plan.roomsList.map((room) => (
                                            <li
                                              key={room.name}
                                              className="flex items-baseline justify-between gap-3 text-[14px]"
                                            >
                                              <span className="text-ink-600">
                                                {room.name}
                                              </span>
                                              <span className="shrink-0 tabular-nums font-medium text-ink-900">
                                                {formatArea(room.areaM2)}
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                        {plan.href ? (
                                          <Link
                                            href={plan.href}
                                            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-brand-600"
                                          >
                                            Zobacz ofertę
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                                              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                          </Link>
                                        ) : (
                                          <p className="mt-4 text-[13px] text-ink-400">
                                            Oferta wkrótce
                                          </p>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                </div>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-ink-200 bg-white/40 px-6 py-12 text-center">
                  <p className="font-display text-xl text-ink-800">Wybierz piętro</p>
                  <p className="mt-2 max-w-xs text-sm text-ink-500">
                    Kliknij kondygnację na wizualizacji lub wybierz z listy obok, aby
                    zobaczyć dostępne mieszkania.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wizualizacja 3D mieszkania */}
        <section className="bg-ink-950 text-white">
          <div className="container-xl py-16 md:py-24">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14">
              <div>
                <p className="eyebrow eyebrow-on-dark mb-4">Wizualizacja 3D</p>
                <h2 className="font-display text-3xl text-white md:text-4xl">
                  Zobacz układ mieszkania
                </h2>
                <p className="mt-4 max-w-md text-white/70">
                  Obejrzyj przykładowe mieszkanie w trójwymiarze: rozkład pomieszczeń,
                  proporcje i przestrzeń, zanim wejdziesz do środka.
                </p>
              </div>

              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-xl)] bg-ink-900 ring-1 ring-white/10">
                {zamyslowData.tour3d.embedSrc ? (
                  <iframe
                    src={zamyslowData.tour3d.embedSrc}
                    title="Wizualizacja 3D mieszkania"
                    loading="lazy"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : (
                  <>
                    <Image
                      src={zamyslowData.tour3d.poster}
                      alt="Wizualizacja 3D mieszkania"
                      fill
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-ink-950/45">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-ink-900">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                          <path d="M4 3l7 4-7 4V3z" fill="currentColor" />
                        </svg>
                        Film 3D już wkrótce
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </MotionConfig>
  );
}
