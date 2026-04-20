"use client";

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
 * kliknięcie miniaturki otwiera pełny podgląd natychmiast — bez przewijania do sekcji galerii.
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
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);

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

  const portal =
    mounted && images.length > 0 ? (
      <AnimatePresence>
        {open !== null && (
          <motion.div
            key="offer-lightbox"
            role="presentation"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 md:p-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease }}
          >
            <motion.button
              type="button"
              aria-label="Zamknij podgląd - kliknij w tło"
              className="absolute inset-0 bg-ink-950/90 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              onClick={close}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Powiększona galeria: ${title}`}
              className="pointer-events-none relative z-10 flex max-h-[min(92vh,920px)] w-full max-w-[min(1240px,calc(100vw-2rem))] flex-col items-center"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.34, ease }}
            >
              <div
                className="pointer-events-auto relative flex w-full max-w-full flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute -top-1 right-0 z-20 flex items-center gap-2">
                  <p className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-white/50 tabular-nums pr-2">
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
                      className="absolute left-0 top-1/2 z-20 -translate-x-1 sm:-translate-x-2 md:-translate-x-3 -translate-y-1/2 inline-flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/30 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      aria-label="Poprzednie zdjęcie"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      className="absolute right-0 top-1/2 z-20 translate-x-1 sm:translate-x-2 md:translate-x-3 -translate-y-1/2 inline-flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/30 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      aria-label="Następne zdjęcie"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </>
                )}

                <div
                  className="mt-12 w-full flex min-h-0 flex-1 items-center justify-center"
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={open}
                      className="relative flex max-h-[min(78vh,760px)] w-full items-center justify-center"
                      initial={{ opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.995 }}
                      transition={{ duration: 0.2, ease }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={images[open]}
                        alt={`${title} - zdjęcie ${open + 1} z ${images.length}`}
                        className="max-h-[min(78vh,760px)] w-auto max-w-full object-contain rounded-[var(--radius-md)] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
                        draggable={false}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <p className="mt-4 text-center text-[11px] uppercase tracking-[0.22em] text-white/45 sm:hidden tabular-nums">
                  {open + 1} / {images.length}
                </p>

                {images.length > 1 && (
                  <div className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:thin]">
                    {images.map((src, i) => (
                      <button
                        key={`thumb-${i}`}
                        type="button"
                        onClick={() => setOpen(i)}
                        aria-label={`Miniatura ${i + 1}`}
                        aria-current={i === open ? "true" : undefined}
                        className={[
                          "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
                          i === open ? "ring-white opacity-100" : "ring-transparent opacity-55 hover:opacity-90",
                        ].join(" ")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
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
