"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FloorPlanCompass } from "../FloorPlanCompass";
import roomPositions from "@/lib/investments/zamyslow-unit-rooms.json";

/**
 * Rzut pojedynczego mieszkania - karta + tryb pełnoekranowy.
 *
 * Znaczniki pokoi: pozycje wyznaczane offline (scripts/zamyslow-unit-plans.ts,
 * segmentacja obszarów koloru), zapisane jako ułamki szerokości/wysokości
 * WYCINKA. Obraz w karcie jest letterboxowany (object-contain), więc pozycje
 * przeliczamy na realny prostokąt obrazu mierzony z naturalWidth/Height.
 *
 * Numeracja znaczników = kolejność listy pomieszczeń z arkusza; pozycję do
 * pokoju dobieramy po metrażu (unikalnie, najbliższa wartość) - dzięki temu
 * drobna korekta metrażu w arkuszu niczego nie psuje.
 */

type Room = { name: string; areaLabel: string; areaM2: number };
type Pos = { fx: number; fy: number; areaM2: number };

const POSITIONS = roomPositions as Record<string, Pos[]>;

function useContainRect(
  boxRef: React.RefObject<HTMLDivElement | null>,
  natural: { w: number; h: number } | null,
  active = true,
) {
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => {
    // `active` jest w zależnościach celowo: kontener modala montuje się dopiero
    // po otwarciu, a sam ref nie wywoła ponownego uruchomienia efektu.
    const el = boxRef.current;
    if (!el || !natural || !active) return;
    const compute = () => {
      const bw = el.clientWidth, bh = el.clientHeight;
      if (!bw || !bh) return;
      const s = Math.min(bw / natural.w, bh / natural.h);
      const w = natural.w * s, h = natural.h * s;
      setRect({ left: (bw - w) / 2, top: (bh - h) / 2, width: w, height: h });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [boxRef, natural, active]);
  return rect;
}

/** Pokój (index z listy) -> pozycja znacznika, dobierana po metrażu. */
function matchPositions(rooms: Room[], positions: Pos[] | undefined) {
  if (!positions?.length) return new Map<number, Pos>();
  const free = positions.map((p) => ({ ...p, used: false }));
  const order = rooms
    .map((r, idx) => ({ ...r, idx }))
    .sort((a, b) => b.areaM2 - a.areaM2);
  const out = new Map<number, Pos>();
  for (const room of order) {
    let best: (typeof free)[number] | null = null;
    let bestDiff = Infinity;
    for (const p of free) {
      if (p.used) continue;
      const d = Math.abs(p.areaM2 - room.areaM2);
      if (d < bestDiff) { bestDiff = d; best = p; }
    }
    if (best && bestDiff <= 0.6) {
      best.used = true;
      out.set(room.idx, best);
    }
  }
  return out;
}

export function UnitPlanViewer({
  unitId,
  rooms,
  totalLabel,
  outdoor,
}: {
  unitId: string;
  rooms: Room[];
  totalLabel: string;
  outdoor?: { name: string; areaLabel: string } | null;
}) {
  const src = `/investments/zamyslow/floorplans/units/${unitId.toLowerCase()}.webp`;
  const positions = POSITIONS[unitId.toUpperCase()];
  const byRoom = useMemo(() => matchPositions(rooms, positions), [rooms, positions]);

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth) setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);
  // Obraz z cache kończy się ładować PRZED hydracją i onLoad wtedy nie odpala -
  // callback-ref łapie ten przypadek przez img.complete.
  const imgRef = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth) {
      setNatural({ w: el.naturalWidth, h: el.naturalHeight });
    }
  }, []);

  // Pełny ekran: Esc + blokada scrolla strony.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cardBoxRef = useRef<HTMLDivElement | null>(null);
  const modalBoxRef = useRef<HTMLDivElement | null>(null);
  const cardRect = useContainRect(cardBoxRef, natural);
  const modalRect = useContainRect(modalBoxRef, natural, open);

  const chips = (rect: { left: number; top: number; width: number; height: number } | null, size: "sm" | "lg") =>
    rect
      ? rooms.map((room, i) => {
          const pos = byRoom.get(i);
          if (!pos) return null;
          const x = rect.left + pos.fx * rect.width;
          const y = rect.top + pos.fy * rect.height;
          const dim = hovered !== null && hovered !== i;
          return (
            <div
              key={room.name + i}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
              style={{ left: x, top: y, opacity: dim ? 0.25 : 1 }}
            >
              <span
                className={[
                  "flex items-center justify-center rounded-full bg-ink-950 font-sans font-semibold text-white shadow-[0_2px_10px_-2px_rgba(11,15,20,0.4)] ring-2 ring-white/85",
                  size === "sm" ? "h-6 w-6 text-[11.5px]" : "h-8 w-8 text-[14px]",
                ].join(" ")}
              >
                {i + 1}
              </span>
              {size === "lg" ? (
                <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-white/95 px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums text-ink-800 shadow-sm ring-1 ring-ink-950/8">
                  {room.areaLabel.replace(".", ",")}
                </span>
              ) : null}
            </div>
          );
        })
      : null;

  return (
    <>
      {/* ── Karta rzutu ─────────────────────────────────────────────────── */}
      <div className="group overflow-hidden rounded-[var(--radius-xl)] border border-ink-200/60 bg-white shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-4 px-6 pt-5 md:px-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
            Rzut mieszkania
          </p>
          <div className="flex items-center gap-1.5">
            <a
              href={src}
              download={`rzut-${unitId.toLowerCase()}.webp`}
              aria-label="Pobierz rzut"
              title="Pobierz rzut"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-950/5 hover:text-ink-900"
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M7 2v7M3.8 6.2 7 9.4l3.2-3.2M2.5 12h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Otwórz rzut na pełnym ekranie"
              title="Pełny ekran"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-950/5 hover:text-ink-900"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Powiększ rzut mieszkania ${unitId}`}
          className="block w-full cursor-zoom-in px-4 pb-4 pt-2 md:px-6 md:pb-6"
        >
          <div ref={cardBoxRef} className="relative aspect-[16/10] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Rzut mieszkania ${unitId} - ${totalLabel.replace(".", ",")}`}
              ref={imgRef}
              onLoad={onImgLoad}
              className="absolute inset-0 h-full w-full select-none object-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]"
              draggable={false}
            />
            {chips(cardRect, "sm")}
          </div>
        </button>
      </div>

      {/* ── Pełny ekran ─────────────────────────────────────────────────── */}
      {mounted &&
        createPortal(
          open ? (
            <div
              className="fixed inset-0 z-[140] flex items-center justify-center bg-ink-950/92 p-4 backdrop-blur-sm md:p-8"
              onClick={() => setOpen(false)}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Zamknij"
                className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>

              <div
                className="flex max-h-full w-[min(1240px,96vw)] flex-col overflow-hidden rounded-[var(--radius-xl)] bg-white shadow-2xl lg:flex-row"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Rzut */}
                <div className="relative min-h-0 flex-1 bg-white p-4 md:p-8">
                  <div ref={modalBoxRef} className="relative h-[46vh] w-full lg:h-[78vh]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Rzut mieszkania ${unitId}`}
                      ref={imgRef}
              onLoad={onImgLoad}
                      className="absolute inset-0 h-full w-full select-none object-contain"
                      draggable={false}
                    />
                    {chips(modalRect, "lg")}
                  </div>
                  <FloorPlanCompass className="absolute left-5 top-5 h-11 w-11" />
                </div>

                {/* Legenda */}
                <aside className="w-full shrink-0 border-t border-ink-200/60 bg-paper-warm/60 lg:w-[300px] lg:border-l lg:border-t-0">
                  <div className="flex h-full flex-col p-6 md:p-7">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
                      Mieszkanie {unitId}
                    </p>
                    <ul className="mt-5 space-y-1">
                      {rooms.map((room, i) => (
                        <li key={room.name + i}>
                          <div
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-950 text-[11.5px] font-semibold text-white">
                              {i + 1}
                            </span>
                            <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-ink-700">
                              {room.name}
                            </span>
                            <span className="shrink-0 text-[13.5px] font-semibold tabular-nums text-ink-950">
                              {room.areaLabel.replace(".", ",")}
                            </span>
                          </div>
                        </li>
                      ))}
                      {outdoor ? (
                        <li className="flex items-center gap-3 px-2 py-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-300 text-[11px] text-ink-400">
                            +
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-500">
                            {outdoor.name}
                          </span>
                          <span className="shrink-0 text-[13.5px] tabular-nums text-ink-600">
                            {outdoor.areaLabel ? outdoor.areaLabel.replace(".", ",") : ""}
                          </span>
                        </li>
                      ) : null}
                    </ul>
                    <div className="mt-auto border-t border-ink-950/10 pt-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
                          Powierzchnia
                        </span>
                        <span className="font-sans text-[19px] font-bold tabular-nums text-ink-950">
                          {totalLabel.replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          ) : null,
          document.body,
        )}
    </>
  );
}
