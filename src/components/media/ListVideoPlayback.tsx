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

export type ListVideoMobileMode = "horizontal-scroll" | "viewport-center";

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
  children,
}: {
  orderedSlugs: readonly string[];
  mobileMode: ListVideoMobileMode;
  mobileRootRef?: RefObject<HTMLElement | null> | null;
  children: ReactNode;
}) {
  const isDesktop = useIsDesktopMd();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [mobilePick, setMobilePick] = useState<string | null>(() => orderedSlugs[0] ?? null);
  const ratiosRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number | null>(null);

  const slugOrderKey = orderedSlugs.join("|");
  useEffect(() => {
    setMobilePick(orderedSlugs[0] ?? null);
    ratiosRef.current.clear();
  }, [slugOrderKey, orderedSlugs]);

  useEffect(() => {
    setHoveredSlug(null);
  }, [isDesktop]);

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
    setHoveredSlug(slug);
  }, []);

  const onCardLeave = useCallback(() => {
    setHoveredSlug(null);
  }, []);

  const activeSlug = useMemo(() => {
    const first = orderedSlugs[0] ?? null;
    if (isDesktop) {
      return hoveredSlug ?? first;
    }
    return mobilePick ?? first;
  }, [hoveredSlug, isDesktop, mobilePick, orderedSlugs]);

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
