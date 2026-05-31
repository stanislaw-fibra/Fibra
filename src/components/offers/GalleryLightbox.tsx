"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useModalHistoryClose } from "@/lib/use-modal-history-close";

type LightboxApi = {
  images: string[];
  title: string;
  open: number | null;
  openAt: (index: number, trigger?: HTMLElement | null) => void;
  close: () => void;
  go: (dir: -1 | 1) => void;
};

const LightboxContext = createContext<LightboxApi | null>(null);

export function useGalleryLightbox() {
  return useContext(LightboxContext);
}

const ease = [0.22, 1, 0.36, 1] as const;
const SWIPE_PX = 56;

/**
 * Provider pokazujący wspólny lightbox dla wszystkich miniaturek galerii na stronie oferty
 * (mini-strip pod hero + pełna siatka w sekcji #galeria). Dzięki jednemu źródłu stanu
 * kliknięcie miniaturki otwiera pełny podgląd natychmiast - bez przewijania do sekcji galerii.
 *
 * Obrazy są serwowane przez `next/image` (AVIF/WebP + responsywność), a sąsiedzi
 * (open−1, open+1) są preloadowani w tle, żeby strzałki/swipe działały natychmiast.
 */
export function GalleryLightboxProvider({
  images,
  title,
  children,
}: {
  images: string[];
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  // Bump na zmianę orientacji urządzenia - wymusza przeliczenie wymiarów obrazu
  // (next/image trzyma proporcje + max-h, ale po obrocie telefonu chcemy mieć
  // pewność, że layout się zaktualizuje natychmiast, a nie czeka na resize).
  const [orientationKey, setOrientationKey] = useState(0);
  // Czy lightbox aktualnie jest w trybie „mobile landscape fullscreen" - to wpływa na
  // padding, max-h obrazu oraz wielkość typografii. Klient prosił wielokrotnie, żeby po
  // obróceniu telefonu w poziom zdjęcia rozpychały się na cały ekran.
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  // Track which images already finished loading - pozwala pokazać spinner tylko
  // dla tych, które user otworzył pierwszy raz. Kolejne wejścia w to samo
  // zdjęcie są natychmiastowe (HTTP cache + browser image cache).
  const [loadedSet, setLoadedSet] = useState<Set<number>>(() => new Set());
  const markLoaded = useCallback((idx: number) => {
    setLoadedSet((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }, []);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(null);
    queueMicrotask(() => {
      lastTriggerRef.current?.focus({ preventScroll: true });
      lastTriggerRef.current = null;
    });
  }, []);

  const go = useCallback(
    (dir: -1 | 1) => {
      setOpen((i) => {
        if (i === null) return null;
        const n = images.length;
        if (n === 0) return null;
        return (i + dir + n) % n;
      });
    },
    [images.length],
  );

  const openAt = useCallback(
    (index: number, trigger?: HTMLElement | null) => {
      lastTriggerRef.current = trigger ?? null;
      if (index < 0 || index >= images.length) return;
      setOpen(index);
    },
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, go]);

  useEffect(() => {
    if (open === null) return;
    closeBtnRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Integracja z historią przeglądarki: swipe-back / przycisk Wstecz na mobile zamyka
  // lightbox zamiast nawigować do poprzedniej strony. Klient prosił to wprost - wcześniej
  // user zawsze tracił kontekst oferty po geście „back".
  useModalHistoryClose(open !== null, close);

  // Mobile: po obrocie telefonu zdjęcie powinno natychmiast wypełnić nowy
  // viewport (poziomo / pionowo). `orientationchange` strzela na iOS / Androidzie,
  // a `screen.orientation` daje też zmianę przy obracaniu w tabletach.
  useEffect(() => {
    if (open === null) return;
    const bump = () => setOrientationKey((k) => k + 1);
    window.addEventListener("orientationchange", bump);
    const so = (typeof screen !== "undefined" && screen.orientation) || null;
    so?.addEventListener?.("change", bump);
    return () => {
      window.removeEventListener("orientationchange", bump);
      so?.removeEventListener?.("change", bump);
    };
  }, [open]);

  // Auto-fullscreen przy obrocie telefonu w poziom - klient prosił wielokrotnie:
  // „W wersji mobile zdjęcia w galerii oferty mogłyby mieć możliwość po przestawieniu
  //  telefonu w poziom powiększenie na cały ekran".
  //
  // Effect 1: nasłuchuje orientation, ustawia tylko `isMobileLandscape` state.
  // Effect 2: reaguje na przejście portrait→landscape - otwiera lightbox.
  //
  // Świadomie NIE zamykamy automatycznie przy powrocie do portretu: tracking „kto otworzył"
  // przez ref ma race condition'y w Strict Mode + przy serii resize'ów w trakcie jednej
  // rotacji. Pragmatyczna decyzja: w landscape lightbox staje się fullscreen (większy obraz),
  // w portrait wraca do normalnego layoutu okna lightboxa. User klika X (lub tap w tło),
  // żeby wyjść - zachowanie znane z każdej innej galerii.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 600px)");
    const update = () => setIsMobileLandscape(mq.matches);
    update();
    mq.addEventListener("change", update);
    // Fallback dla środowisk, które nie firują media-query change consistently
    // (Chrome DevTools emulation, wirtualne klawiatury). update jest idempotentne
    // bo czyta mq.matches i React kolapsuje równoległe setState bez efektu.
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  useEffect(() => {
    if (images.length === 0) return;
    if (!isMobileLandscape) return;
    // Otwieramy galerię tylko gdy jest zamknięta - nie ruszamy nic, jeśli user
    // już patrzy na konkretne zdjęcie (np. otworzył przez klik w miniaturę).
    setOpen((prev) => (prev === null ? 0 : prev));
  }, [isMobileLandscape, images.length]);

  // Przewiń aktywną miniaturkę do widoku w pasku (żeby user widział kontekst).
  useEffect(() => {
    if (open === null) return;
    const container = thumbsRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLButtonElement>(`[data-thumb-idx="${open}"]`);
    if (!active) return;
    active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [open]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null || images.length < 2) return;
    const end = e.changedTouches[0]?.clientX;
    if (end == null) return;
    const dx = end - start;
    if (dx > SWIPE_PX) go(-1);
    else if (dx < -SWIPE_PX) go(1);
  };

  const api = useMemo<LightboxApi>(
    () => ({ images, title, open, openAt, close, go }),
    [images, title, open, openAt, close, go],
  );

  // Pozycje, które trzymamy zamontowane w DOM-ie (obok aktywnej - preload).
  // Dzięki temu next-/prev- obraz jest już pobrany zanim user machnie palcem.
  const mountedIdxs = useMemo(() => {
    if (open === null || images.length === 0) return new Set<number>();
    const n = images.length;
    const set = new Set<number>([open]);
    if (n > 1) {
      set.add((open + 1) % n);
      set.add((open - 1 + n) % n);
    }
    return set;
  }, [open, images.length]);

  const portal =
    mounted && images.length > 0 ? (
      <AnimatePresence>
        {open !== null && (
          <motion.div
            key="offer-lightbox"
            role="presentation"
            className={[
              "fixed inset-0 z-[200] flex items-center justify-center",
              // Mobile-landscape: zero padding, czyste fullscreen - klient prosił o pełnoekranowy
              // tryb po obrocie telefonu w poziom. Reszta urządzeń: normalny padding.
              isMobileLandscape ? "p-0" : "p-4 sm:p-8 md:p-12",
            ].join(" ")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
          >
            <motion.button
              type="button"
              aria-label="Zamknij podgląd - kliknij w tło"
              className="absolute inset-0 bg-ink-950/90 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease }}
              onClick={close}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Powiększona galeria: ${title}`}
              className={[
                "pointer-events-none relative z-10 flex flex-col items-center",
                // Mobile landscape: używamy `100svh` (small viewport - gwarantowanie widoczny obszar
                // bez Safari URL bara / Chrome bottom bara). Wcześniej `100dvh` powodował, że obraz
                // sięgał POD wysuwany Safari UI - góra zdjęcia była przykryta zakładkami i niedostępna.
                isMobileLandscape
                  ? "h-[100svh] w-screen max-w-none"
                  : "max-h-[min(92dvh,920px)] w-full max-w-[min(1240px,calc(100vw-2rem))]",
              ].join(" ")}
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: 4 }}
              transition={{ duration: 0.22, ease }}
            >
              <div
                className="pointer-events-auto relative flex w-full max-w-full flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Górny pasek w landscape: cienka strefa „glassmorphism" z gradientem czerni,
                    żeby X i licznik były zawsze dobrze widoczne nad zdjęciem (object-cover ucina
                    fragment obrazu, więc kontrolki muszą mieć własny kontrast). Plus respektujemy
                    safe-area żeby X nie zachodził za notch'a iPhone'a. */}
                {isMobileLandscape ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-ink-950/65 via-ink-950/30 to-transparent"
                  />
                ) : null}

                <div
                  className={[
                    "absolute z-20 flex items-center gap-2",
                    isMobileLandscape
                      ? "top-3 right-3 pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)]"
                      : "-top-1 right-0",
                  ].join(" ")}
                >
                  <p className={[
                    "text-[11px] uppercase tracking-[0.2em] tabular-nums pr-2",
                    isMobileLandscape ? "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] font-semibold" : "hidden sm:block text-white/50",
                  ].join(" ")}>
                    {open + 1} / {images.length}
                  </p>
                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={close}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-950 shadow-lg hover:bg-accent-400 hover:text-ink-950 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                    aria-label="Zamknij podgląd"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      className={[
                        "absolute top-1/2 z-20 -translate-y-1/2 inline-flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/30 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                        // Landscape: trochę dalej od krawędzi i z safe-area żeby uniknąć notch'a.
                        isMobileLandscape ? "left-3" : "left-0 -translate-x-1 sm:-translate-x-2 md:-translate-x-3",
                      ].join(" ")}
                      style={isMobileLandscape ? { marginLeft: "env(safe-area-inset-left, 0px)" } : undefined}
                      aria-label="Poprzednie zdjęcie"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      className={[
                        "absolute top-1/2 z-20 -translate-y-1/2 inline-flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/30 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                        isMobileLandscape ? "right-3" : "right-0 translate-x-1 sm:translate-x-2 md:translate-x-3",
                      ].join(" ")}
                      style={isMobileLandscape ? { marginRight: "env(safe-area-inset-right, 0px)" } : undefined}
                      aria-label="Następne zdjęcie"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </>
                )}

                <div
                  key={`slides-${orientationKey}`}
                  className={[
                    "relative w-full flex items-center justify-center select-none",
                    isMobileLandscape
                      ? "mt-0 h-[100svh]"
                      : "mt-12 min-h-[min(78dvh,760px)]",
                  ].join(" ")}
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                >
                  {/* Warstwa preloadowanych sąsiadów: wszystkie są w DOM,
                      widoczny jest tylko `open`. Przejścia strzałka/swipe są natychmiastowe. */}
                  {images.map((src, i) => {
                    if (!mountedIdxs.has(i)) return null;
                    const isActive = i === open;
                    const isLoaded = loadedSet.has(i);
                    return (
                      <div
                        key={`slide-${i}`}
                        className={[
                          "absolute inset-0 flex items-center justify-center",
                          "transition-opacity duration-150 ease-out",
                          isActive ? "opacity-100 z-[2]" : "opacity-0 z-0 pointer-events-none",
                        ].join(" ")}
                        aria-hidden={!isActive}
                      >
                        {/* Skeleton/spinner do czasu, aż obraz się zdekoduje. */}
                        {isActive && !isLoaded && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div
                              className="h-12 w-12 rounded-full border-2 border-white/25 border-t-white/85 animate-spin"
                              aria-label="Wczytywanie zdjęcia"
                              role="status"
                            />
                          </div>
                        )}
                        <Image
                          src={src}
                          alt={isActive ? `${title} - zdjęcie ${i + 1} z ${images.length}` : ""}
                          width={1600}
                          height={1200}
                          sizes={isMobileLandscape ? "100vw" : "(min-width: 1280px) 1240px, 95vw"}
                          quality={78}
                          priority={isActive}
                          fetchPriority={isActive ? "high" : "auto"}
                          onLoad={() => markLoaded(i)}
                          onError={() => markLoaded(i)}
                          unoptimized={false}
                          className={[
                            isMobileLandscape
                              // Landscape mobile: obraz wypełnia widoczny obszar przez `object-cover`.
                              // `100svh` zamiast `100dvh` - Safari URL bar / Chrome bottom bar nie
                              // przykrywają już górnej części zdjęcia (klient: „u góry pokazują się
                              // zakładki Safari, częściowo ucięte zdjęcia"). Premium UX: obraz
                              // dominuje ekran, ale zostaje w widocznej, dotykalnej strefie.
                              ? "h-[100svh] w-screen object-cover rounded-none"
                              : "w-auto max-h-[min(78dvh,760px)] max-w-full object-contain rounded-[var(--radius-md)] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/10",
                            isLoaded ? "opacity-100" : "opacity-0",
                            "transition-opacity duration-200 ease-out",
                          ].join(" ")}
                          draggable={false}
                        />
                      </div>
                    );
                  })}
                </div>

                {!isMobileLandscape && (
                  <p className="mt-4 text-center text-[11px] uppercase tracking-[0.22em] text-white/45 sm:hidden tabular-nums">
                    {open + 1} / {images.length}
                  </p>
                )}

                {images.length > 1 && !isMobileLandscape && (
                  <div
                    ref={thumbsRef}
                    className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:thin]"
                  >
                    {images.map((src, i) => (
                      <button
                        key={`thumb-${i}`}
                        type="button"
                        data-thumb-idx={i}
                        onClick={() => setOpen(i)}
                        aria-label={`Miniatura ${i + 1}`}
                        aria-current={i === open ? "true" : undefined}
                        className={[
                          "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
                          i === open ? "ring-white opacity-100" : "ring-transparent opacity-55 hover:opacity-90",
                        ].join(" ")}
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          sizes="56px"
                          quality={60}
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <p className="sr-only">
                  Zamknięcie: Escape, przycisk X, klik w przyciemnione tło. Zmiana zdjęcia: strzałki lub gest
                  w poziomie.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    ) : null;

  return (
    <LightboxContext.Provider value={api}>
      {children}
      {portal ? createPortal(portal, document.body) : null}
    </LightboxContext.Provider>
  );
}
