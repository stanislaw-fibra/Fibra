"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type {
  FloorPlanUnit,
  UnitStatus,
  ZamyslowFloor,
} from "@/lib/investments/zamyslow-data";

const statusDot: Record<UnitStatus, string> = {
  Dostępne: "bg-emerald-400",
  Rezerwacja: "bg-amber-400",
  Sprzedane: "bg-white/40",
};

const fmt = (v: number, dec: number) => v.toFixed(dec).replace(".", ",");
const roomsWord = (n: number) => (n === 1 ? "pokój" : n >= 2 && n <= 4 ? "pokoje" : "pokoi");

const shortLabel = (index: number) => (index === 0 ? "P" : String(index));

type Props = {
  floors: ZamyslowFloor[];
  selectedId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  building: string;
};

export function FloorPlanView({ floors, selectedId, onSelect, onBack, building }: Props) {
  const router = useRouter();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [planW, setPlanW] = useState(0);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const planRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Realny dotyk/pen => UI w tryb dotykowy (instrukcja „Kliknij", CTA pełnego ekranu).
    const update = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") setIsTouch(true);
    };
    window.addEventListener("pointerdown", update, true);
    window.addEventListener("pointerover", update, true);
    return () => {
      window.removeEventListener("pointerdown", update, true);
      window.removeEventListener("pointerover", update, true);
    };
  }, []);

  // Orientacja - w pełnym ekranie zachęcamy do obrócenia telefonu na poziom.
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const u = () => setPortrait(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  // Pełny ekran: blokada scrolla strony + wyjście Esc + sprzątanie podświetlenia.
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);
  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  // Szerokość renderowanego rzutu - skalujemy do niej etykiety (ResizeObserver
  // łapie też koniec animacji wejścia/załadowanie obrazu; contentRect = bez transformu).
  useEffect(() => {
    const el = planRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setPlanW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedId]);

  useEffect(() => {
    // „Dotyk" = telefon/tablet (brak hovera) ALBO wąski ekran. Na takich urządzeniach
    // 1. tap pokazuje kartę, 2. tap / przycisk otwiera ofertę; na desktopie działa hover.
    const compute = () =>
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 768;
    const update = () => setIsTouch(compute());
    update();
    const mq = window.matchMedia("(pointer: coarse)");
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Zmiana piętra czyści aktywne mieszkanie i stan ładowania.
  useEffect(() => {
    setActiveId(null);
    setNavigatingId(null);
  }, [selectedId]);

  const floor = floors.find((f) => f.id === selectedId) ?? floors[0];
  const plan = floor.floorPlan;

  // Kotwica karty szczegółów liczona w układzie OKNA (karta jest w portalu na
  // <body>, więc nic jej nie przycina). Przeliczamy przy zmianie mieszkania,
  // scrollu i resize, żeby trzymała się mieszkania.
  useEffect(() => {
    const unit = plan?.units.find((u) => u.id === activeId);
    if (!unit) {
      setAnchor(null);
      return;
    }
    const recalc = () => {
      const r = planRef.current?.getBoundingClientRect();
      if (!r) return;
      setAnchor({
        x: r.left + (unit.label.x / plan!.viewBox.width) * r.width,
        y: r.top + (unit.label.y / plan!.viewBox.height) * r.height,
      });
    };
    recalc();
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [activeId, plan]);
  const floorsTopDown = floors.map((f, i) => ({ floor: f, index: i })).reverse();

  const vbW = plan?.viewBox.width ?? 1;
  const vbH = plan?.viewBox.height ?? 1;
  const active = plan?.units.find((u) => u.id === activeId) ?? null;

  // Rozmiary etykiet proporcjonalne do szerokości rzutu (px), z sensownymi widełkami.
  const clamp = (min: number, v: number, max: number) => Math.max(min, Math.min(max, v));
  const lbl = {
    num: clamp(8, planW * 0.0172, 13),
    det: clamp(6, planW * 0.0126, 9.5),
    py: clamp(1, planW * 0.005, 3),
    px: clamp(2.5, planW * 0.0105, 7),
  };

  // Kotwica karty liczona od razu (synchronicznie), żeby karta nie „doganiała".
  const anchorFor = (unit: FloorPlanUnit) => {
    const r = planRef.current?.getBoundingClientRect();
    if (!r) return null;
    return {
      x: r.left + (unit.label.x / vbW) * r.width,
      y: r.top + (unit.label.y / vbH) * r.height,
    };
  };

  const cancelHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  // Krótka zwłoka przy chowaniu = „mostek" między mieszkaniem a kartą (można dojechać
  // myszką do przycisku „Zobacz ofertę" bez znikania boxa).
  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = setTimeout(() => setActiveId(null), 220);
  };
  const showUnit = (unit: FloorPlanUnit) => {
    cancelHide();
    setActiveId(unit.id);
    const a = anchorFor(unit);
    if (a) setAnchor(a);
  };

  const navigate = (unit: FloorPlanUnit) => {
    setNavigatingId(unit.id);
    router.push(unit.href);
  };

  // Klucz: decyduje STAN boxa, nie typ urządzenia. Box otwarty dla tego mieszkania
  // => oferta; box zamknięty => najpierw go pokaż. Na desktopie hover otwiera box
  // PRZED klikiem (więc 1 klik = oferta); na dotyku 1. tap otwiera, 2. tap => oferta.
  const onUnitClick = (unit: FloorPlanUnit) => {
    if (activeId === unit.id) navigate(unit);
    else showUnit(unit);
  };

  const view = (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[130] overflow-hidden"
          : "absolute inset-0 z-30 overflow-hidden"
      }
    >
      {/* Ambientowe tło - rozmyty, przyciemniony budynek = głębia „lightboxa" */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center"
        style={{ backgroundImage: `url(${building})`, filter: "blur(28px) brightness(0.42)" }}
      />
      <div className="absolute inset-0 bg-ink-950/55" />

      {/* Układ kolumnowy: pasek górny / rzut / pasek dolny - chrome NIGDY nie zasłania rzutu */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Górny pasek: powrót + nazwa piętra */}
        <div className="flex shrink-0 items-center gap-4 px-5 pb-3 pt-6 md:px-8 md:pt-7">
        <button
          type="button"
          onClick={onBack}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white hover:text-ink-900"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Budynek
        </button>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Rzut piętra</p>
          <p className="truncate font-display text-lg text-white md:text-xl">{floor.label}</p>
        </div>

        {plan && (
          <div className="pointer-events-auto ml-auto flex items-center gap-2">
            {/* Przełącznik stałych etykiet (domyślnie włączone) */}
            <button
              type="button"
              onClick={() => setShowLabels((v) => !v)}
              aria-pressed={showLabels}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium backdrop-blur-md transition-colors",
                showLabels
                  ? "border-white/30 bg-white/15 text-white hover:bg-white/25"
                  : "border-white/15 bg-white/5 text-white/55 hover:bg-white/10",
              ].join(" ")}
            >
              {showLabels ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M1 8s2.6-4.5 7-4.5S15 8 15 8s-2.6 4.5-7 4.5S1 8 1 8Z" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="8" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M6.3 3.3A6.8 6.8 0 0 1 8 3.5C12.4 3.5 15 8 15 8a12 12 0 0 1-2 2.4M4.3 4.3A12 12 0 0 0 1 8s2.6 4.5 7 4.5a6.6 6.6 0 0 0 2.6-.5M2 2l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              )}
              <span className="hidden sm:inline">Etykiety</span>
            </button>

            {/* Pełny ekran (zamknięcie pełnego ekranu) */}
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "Zamknij pełny ekran" : "Pełny ekran"}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white hover:text-ink-900"
            >
              {fullscreen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span className="hidden sm:inline">{fullscreen ? "Zamknij" : "Pełny ekran"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Środek: obszar rzutu (flex-1) - winda po lewej (desktop), rzut wyśrodkowany */}
      <div className="relative min-h-0 flex-1">
      {/* „Winda" - przełącznik wszystkich pięter (desktop: lewa kolumna) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden items-center md:flex">
        <div className="pointer-events-auto ml-4 flex flex-col gap-1.5 rounded-full border border-white/12 bg-black/40 p-1.5 backdrop-blur-md lg:ml-6">
          {floorsTopDown.map(({ floor: f, index }) => {
            const isActive = f.id === selectedId;
            return (
              <button
                key={f.id}
                type="button"
                aria-label={f.label}
                aria-current={isActive}
                onClick={() => onSelect(f.id)}
                className={[
                  "relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isActive ? "bg-white text-ink-900" : "text-white/70 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {shortLabel(index)}
                {f.floorPlan && !isActive && (
                  <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-brand-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scena rzutu - wypełnia tylko środek, więc nie wchodzi pod paski */}
      <div className="absolute inset-0 flex items-center justify-center px-4 py-2 md:pl-24 lg:pl-28">
        <AnimatePresence mode="wait">
          {plan ? (
            <motion.div
              key={`plan-${selectedId}`}
              ref={planRef}
              onClick={() => setActiveId(null)}
              className="relative max-h-full max-w-full rounded-[var(--radius-xl)] bg-paper shadow-2xl shadow-black/40 ring-1 ring-black/5"
              style={{ aspectRatio: `${vbW} / ${vbH}` }}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={plan.image}
                alt={`${floor.label} - rzut piętra`}
                className="h-full w-full select-none object-contain"
                draggable={false}
              />

              <svg
                viewBox={`0 0 ${vbW} ${vbH}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 h-full w-full"
              >
                {plan.units.map((unit) => {
                  const isActive = activeId === unit.id;
                  return (
                    <g
                      key={unit.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Mieszkanie ${unit.id}, ${fmt(unit.areaM2, 2)} m², ${unit.rooms} ${roomsWord(unit.rooms)}`}
                      onPointerEnter={(e) => e.pointerType === "mouse" && showUnit(unit)}
                      onPointerLeave={(e) => e.pointerType === "mouse" && scheduleHide()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnitClick(unit);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(unit);
                        }
                      }}
                      className="cursor-pointer outline-none"
                    >
                      <path
                        d={unit.d}
                        className="transition-[fill,stroke] duration-150"
                        style={{
                          fill: isActive ? "rgba(0,221,214,0.28)" : "rgba(255,255,255,0.001)",
                          stroke: isActive ? "rgba(0,221,214,0.95)" : "rgba(255,255,255,0)",
                          strokeWidth: 2,
                          pointerEvents: "all",
                        }}
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Stałe etykiety: małe, półprzezroczyste plakietki skalujące się z
                  rzutem (jednostki cqw → proporcjonalne na desktopie i mobile).
                  Można je ukryć przełącznikiem „Etykiety". */}
              {showLabels &&
                plan.units.map((unit) => {
                  if (activeId === unit.id) return null;
                  return (
                    <div
                      key={`label-${unit.id}`}
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-[5px] bg-white/65 text-center leading-[1.12] ring-1 ring-black/[0.04] backdrop-blur-[1.5px]"
                      style={{
                        left: `${(unit.label.x / vbW) * 100}%`,
                        top: `${(unit.label.y / vbH) * 100}%`,
                        padding: `${lbl.py}px ${lbl.px}px`,
                      }}
                    >
                      <span
                        className="block font-display font-semibold text-ink-950"
                        style={{ fontSize: `${lbl.num}px` }}
                      >
                        {unit.id}
                      </span>
                      <span
                        className="block tabular-nums text-ink-600"
                        style={{ fontSize: `${lbl.det}px` }}
                      >
                        {fmt(unit.areaM2, 1)} m² · {unit.rooms} pok.
                      </span>
                    </div>
                  );
                })}

              {/* Wskaźnik ładowania na klikniętym mieszkaniu */}
              {plan.units
                .filter((u) => u.id === navigatingId)
                .map((u) => (
                  <div
                    key={`load-${u.id}`}
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-950/90 p-2 text-white shadow-lg ring-1 ring-white/10"
                    style={{ left: `${(u.label.x / vbW) * 100}%`, top: `${(u.label.y / vbH) * 100}%` }}
                  >
                    <Spinner className="text-white" />
                  </div>
                ))}
            </motion.div>
          ) : (
            <motion.div
              key={`soon-${selectedId}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex max-w-sm flex-col items-center rounded-[var(--radius-xl)] border border-white/12 bg-white/[0.06] px-8 py-12 text-center backdrop-blur-md"
            >
              <p className="font-display text-2xl text-white md:text-3xl">{floor.label}</p>
              <p className="mt-3 text-sm text-white/65">
                Interaktywny rzut tego piętra przygotowujemy. Wybierz inne piętro z windy
                obok - rzut pierwszego piętra jest już gotowy.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
      {/* /Środek */}

      {/* Dolny pasek: winda (mobile) + instrukcja - POD rzutem, nic nie zasłania */}
      <div className="flex shrink-0 flex-col items-center gap-2.5 px-4 pb-5 pt-2">
      {/* Mobile: pozioma „winda" */}
      <div className="flex justify-center md:hidden">
        <div className="flex gap-1.5 rounded-full border border-white/12 bg-black/40 p-1.5 backdrop-blur-md">
          {floorsTopDown.map(({ floor: f, index }) => {
            const isActive = f.id === selectedId;
            return (
              <button
                key={f.id}
                type="button"
                aria-label={f.label}
                aria-current={isActive}
                onClick={() => onSelect(f.id)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isActive ? "bg-white text-ink-900" : "text-white/70 active:bg-white/10",
                ].join(" ")}
              >
                {shortLabel(index)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instrukcja kontekstowa: zachęta do pełnego ekranu / „obróć telefon" / podpowiedź */}
      <div className="flex justify-center">
        {plan && isTouch && !fullscreen ? (
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-lg shadow-black/30 transition-transform active:scale-95"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Otwórz na pełnym ekranie
          </button>
        ) : fullscreen && portrait ? (
          <div className="pointer-events-none inline-flex items-center gap-2.5 rounded-full bg-black/60 px-4 py-2 text-white backdrop-blur-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-pulse">
              <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3 14a9 9 0 0 0 4 4M21 10a9 9 0 0 0-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium">Obróć telefon, aby wygodniej wybrać</span>
          </div>
        ) : (
          <div className="pointer-events-none inline-flex items-center gap-2.5 rounded-full bg-black/55 px-4 py-2 text-white backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <span className="text-sm font-medium">
              {!plan
                ? "Wybierz piętro z windy obok"
                : isTouch
                  ? "Kliknij mieszkanie, aby zobaczyć szczegóły"
                  : "Najedź na mieszkanie, aby zobaczyć szczegóły"}
            </span>
          </div>
        )}
      </div>
      </div>
      {/* /Dolny pasek */}
      </div>
      {/* /Układ kolumnowy */}

      {/* Karta szczegółów w PORTALU na <body> - zawsze NAD wszystkim, nigdy ucięta */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {active && anchor && (
              <DetailCard
                unit={active}
                anchor={anchor}
                loading={navigatingId === active.id}
                onOpen={() => navigate(active)}
                onPointerEnter={() => !isTouch && cancelHide()}
                onPointerLeave={() => !isTouch && scheduleHide()}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );

  // W pełnym ekranie wynosimy widok do portalu na <body> (fixed inset-0),
  // żeby wypełnił cały ekran telefonu, a nie tylko kadr hero.
  return fullscreen && mounted ? createPortal(view, document.body) : view;
}

function DetailCard({
  unit,
  anchor,
  loading,
  onOpen,
  onPointerEnter,
  onPointerLeave,
}: {
  unit: FloorPlanUnit;
  anchor: { x: number; y: number };
  loading: boolean;
  onOpen: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const openRight = anchor.x < vw * 0.5;
  const yReg = anchor.y < vh * 0.3 ? "top" : anchor.y > vh * 0.7 ? "bottom" : "mid";
  const xT = openRight ? "translateX(16px)" : "translateX(calc(-100% - 16px))";
  const yT = yReg === "top" ? "translateY(-12px)" : yReg === "bottom" ? "translateY(calc(-100% + 12px))" : "translateY(-50%)";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
      className="fixed z-[200] w-[230px] max-w-[82vw] overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-ink-950/95 text-white shadow-2xl shadow-black/60 backdrop-blur-md"
      style={{ left: anchor.x, top: anchor.y, transform: `${xT} ${yT}` }}
    >
      <div className="px-4 pt-3.5">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg">{unit.id}</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot[unit.status]}`} />
            {unit.status}
          </span>
        </div>
        <p className="mt-0.5 text-[13px] text-white/75">
          {fmt(unit.areaM2, 2)} m² · {unit.rooms} {roomsWord(unit.rooms)}
        </p>
      </div>

      <div className="mt-3 border-t border-white/10 px-4 py-2.5">
        <ul className="space-y-1">
          {unit.roomsList.map((r) => (
            <li key={r.name} className="flex items-baseline justify-between gap-3 text-[11.5px]">
              <span className="text-white/65">{r.name}</span>
              <span className="shrink-0 tabular-nums text-white/85">{fmt(r.areaM2, 2)} m²</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-3 pb-3 pt-1">
        <button
          type="button"
          disabled={loading}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-white px-3 py-2 text-[13px] font-semibold text-ink-900 transition-colors hover:bg-brand-50 disabled:opacity-90"
        >
          {loading ? (
            <>
              <Spinner className="text-ink-900" />
              Ładowanie…
            </>
          ) : (
            <>
              Zobacz ofertę
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
