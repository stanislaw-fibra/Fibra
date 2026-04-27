"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";

export type ListVideoMobileMode = "horizontal-scroll" | "viewport-center" | "grid-first";

type ListVideoPlaybackContextValue = {
  orderedSlugs: readonly string[];
  activeSlug: string | null;
  isDesktop: boolean;
  mobileMode: ListVideoMobileMode;
  mobileRootRef: RefObject<HTMLElement | null> | null;
  onCardEnter: (slug: string) => void;
  onCardLeave: () => void;
  reportVisibility: (slug: string, ratio: number) => void;
};

const ListVideoPlaybackContext = createContext<ListVideoPlaybackContextValue | null>(null);

function subscribeMediaMd(cb: () => void) {
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getMediaMdSnapshot() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function getMediaMdServerSnapshot() {
  return false;
}

function useIsDesktopMd() {
  return useSyncExternalStore(subscribeMediaMd, getMediaMdSnapshot, getMediaMdServerSnapshot);
}

export function useOptionalListVideoPlayback() {
  return useContext(ListVideoPlaybackContext);
}

export function ListVideoPlaybackProvider({
  orderedSlugs,
  mobileMode,
  mobileRootRef = null,
  enabled = true,
  desktopRequireHover = false,
  children,
}: {
  orderedSlugs: readonly string[];
  mobileMode: ListVideoMobileMode;
  mobileRootRef?: RefObject<HTMLElement | null> | null;
  /** Gdy false — `activeSlug` = null i nic nie gra (np. sekcja poza viewportem). */
  enabled?: boolean;
  /**
   * Desktop: gdy true, karta zaczyna grać dopiero po hoverze (brak fallbacku
   * do pierwszej). Dobre dla sekcji typu „Inne oferty" — żeby film nie
   * leciał automatycznie, gdy użytkownik do sekcji nie doszedł albo stoi obok.
   */
  desktopRequireHover?: boolean;
  children: ReactNode;
}) {
  const isDesktop = useIsDesktopMd();
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);
  const [debouncedHoverSlug, setDebouncedHoverSlug] = useState<string | null>(null);
  const [mobilePick, setMobilePick] = useState<string | null>(() => orderedSlugs[0] ?? null);
  // Gate mountu wideo: zanim plakat pierwszego kafelka nie wygra wyścigu LCP,
  // nie inicjalizujemy HLS/manifestów. Odpalamy `ready` po rAF + krótkim idle,
  // czyli praktycznie po pierwszym malowaniu strony. To zwalnia sieć pod LCP.
  const [ready, setReady] = useState(false);
  const ratiosRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number | null>(null);

  const slugOrderKey = orderedSlugs.join("|");
  useEffect(() => {
    setMobilePick(orderedSlugs[0] ?? null);
    ratiosRef.current.clear();
  }, [slugOrderKey, orderedSlugs]);

  useEffect(() => {
    let raf = 0;
    let timeoutId = 0;
    raf = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => setReady(true), 250);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    setHoverSlug(null);
    setDebouncedHoverSlug(null);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) {
      setDebouncedHoverSlug(null);
      return;
    }
    if (!hoverSlug) {
      setDebouncedHoverSlug(null);
      return;
    }
    const t = window.setTimeout(() => setDebouncedHoverSlug(hoverSlug), 100);
    return () => window.clearTimeout(t);
  }, [hoverSlug, isDesktop]);

  const schedulePick = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      let best: string | null = null;
      let bestR = -1;
      for (const slug of orderedSlugs) {
        const r = ratiosRef.current.get(slug) ?? 0;
        if (r > bestR) {
          bestR = r;
          best = slug;
        }
      }
      const fallback = orderedSlugs[0] ?? null;
      const next = bestR >= 0.06 ? best : fallback;
      setMobilePick((prev) => (prev === next ? prev : next));
    });
  }, [orderedSlugs]);

  const reportVisibility = useCallback(
    (slug: string, ratio: number) => {
      ratiosRef.current.set(slug, ratio);
      schedulePick();
    },
    [schedulePick],
  );

  const onCardEnter = useCallback((slug: string) => {
    setHoverSlug(slug);
  }, []);

  const onCardLeave = useCallback(() => {
    setHoverSlug(null);
  }, []);

  const activeSlug = useMemo(() => {
    if (!enabled) return null;
    if (!ready) return null;
    const first = orderedSlugs[0] ?? null;
    if (isDesktop) {
      if (desktopRequireHover) return debouncedHoverSlug ?? null;
      return debouncedHoverSlug ?? first;
    }
    // grid-first: na mobile zawsze gra pierwsza widoczna karta (Reels-style 2x2),
    // pozostałe są deterministycznie podglądem - nie szukamy „najlepiej widocznej",
    // bo wszystkie 4 są w viewport jednocześnie.
    if (mobileMode === "grid-first") return first;
    return mobilePick ?? first;
  }, [enabled, ready, desktopRequireHover, debouncedHoverSlug, isDesktop, mobileMode, mobilePick, orderedSlugs]);

  const value = useMemo(
    (): ListVideoPlaybackContextValue => ({
      orderedSlugs,
      activeSlug,
      isDesktop,
      mobileMode,
      mobileRootRef: mobileRootRef ?? null,
      onCardEnter,
      onCardLeave,
      reportVisibility,
    }),
    [orderedSlugs, activeSlug, isDesktop, mobileMode, mobileRootRef, onCardEnter, onCardLeave, reportVisibility],
  );

  return <ListVideoPlaybackContext.Provider value={value}>{children}</ListVideoPlaybackContext.Provider>;
}
