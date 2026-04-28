"use client";

import * as React from "react";
import { OfferVideo } from "@/components/media/OfferVideo";

/** Zapas, gdy w DOM jeszcze nie ma `[data-offer-sticky]` (SSR / pierwszy frame). */
const STICKY_FALLBACK_RESERVE_PX = 120;

type Props = {
  title: string;
  poster: string;
  streamId: string;
  videoSrc?: string;
  /** Status / nowość — pozycjonowane absolutnie względem kadru */
  children?: React.ReactNode;
};

/**
 * Kadruje pionowy stream Cloudflare tak, by **cały klip był widoczny od razu**
 * (bez ucinania przez fixed CTA na dole i bez „wypychania” poza viewport).
 * Szerokość / wysokość liczone z dostępnej przestrzeni i proporcji 9:16.
 */
export function OfferStreamHeroShell({ title, poster, streamId, videoSrc, children }: Props) {
  const shellRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number>(0);
  const [dim, setDim] = React.useState<{ w: number; h: number } | null>(null);

  const layout = React.useCallback(() => {
    const el = shellRef.current;
    if (!el) return;

    const run = () => {
      const shell = shellRef.current;
      if (!shell) return;

      const vv = window.visualViewport;
      const vh = vv?.height ?? window.innerHeight;
      const offsetTop = vv?.offsetTop ?? 0;
      const top = shell.getBoundingClientRect().top;
      const stickyEl = document.querySelector<HTMLElement>("[data-offer-sticky]");
      const stickyH = stickyEl?.getBoundingClientRect().height ?? STICKY_FALLBACK_RESERVE_PX;
      const maxH = Math.max(200, vh + offsetTop - top - stickyH - 12);

      const parentW = shell.parentElement?.getBoundingClientRect().width ?? window.innerWidth;
      const maxW = Math.min(520, parentW);
      const w = Math.min(maxW, (maxH * 9) / 16);
      const h = (w * 16) / 9;

      setDim((prev) =>
        prev && Math.abs(prev.w - w) < 1.5 && Math.abs(prev.h - h) < 1.5 ? prev : { w, h },
      );
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      run();
    });
  }, []);

  React.useLayoutEffect(() => {
    layout();
    const ro = new ResizeObserver(() => layout());
    const p = shellRef.current?.parentElement;
    if (p) ro.observe(p);
    window.addEventListener("resize", layout);
    window.visualViewport?.addEventListener("resize", layout);
    window.visualViewport?.addEventListener("scroll", layout);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", layout);
      window.visualViewport?.removeEventListener("resize", layout);
      window.visualViewport?.removeEventListener("scroll", layout);
    };
  }, [layout]);

  return (
    <div
      ref={shellRef}
      className={[
        "relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[var(--radius-lg)] bg-ink-900 shadow-[var(--shadow-cinematic)] ring-1 ring-ink-200/60",
        dim
          ? null
          : "aspect-[9/16] max-h-[min(calc(100svh-18rem),calc(100vw*16/9))] max-md:max-h-[min(calc(100svh-22rem),calc(100vw*16/9))]",
      ]
        .filter(Boolean)
        .join(" ")}
      style={dim ? { width: dim.w, height: dim.h, maxWidth: "100%" } : undefined}
    >
      <OfferVideo
        title={title}
        poster={poster}
        streamId={streamId}
        videoSrc={videoSrc}
        priority
        objectFit="contain"
      />
      {children}
    </div>
  );
}
