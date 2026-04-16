"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { Offer } from "@/lib/offers";
import { priceShort } from "@/lib/offers";
import { VideoSoundIconButton } from "@/components/media/VideoSoundIconButton";
import { GridClipSurface } from "@/components/media/GridClipSurface";
import { useOptionalListVideoPlayback } from "@/components/media/ListVideoPlayback";
import { cloudflareStreamThumbnailUrl } from "@/lib/cloudflare-stream";

interface VideoCardProps {
  offer: Offer;
  index?: number;
  variant?: "primary" | "compact";
  /** Pierwszy plakat na liście (szybsze ładowanie miniatury) */
  priority?: boolean;
  showCardFooter?: boolean;
  showPrice?: boolean;
  visualOnly?: boolean;
  /** Hero strony głównej — typografia i obramowanie jak w sekcji „Aktualne oferty” */
  surfaceTheme?: "default" | "hero";
}

export function VideoCard({
  offer,
  index = 0,
  variant = "primary",
  priority = false,
  showCardFooter = true,
  showPrice = true,
  visualOnly = false,
  surfaceTheme = "default",
}: VideoCardProps) {
  const mediaShellRef = useRef<HTMLDivElement>(null);
  const playback = useOptionalListVideoPlayback();
  const [muted, setMuted] = useState(true);
  const [legacyInView, setLegacyInView] = useState(false);

  const hasVideo = !!offer.videoSrc || !!offer.streamId;
  const showFooter = showCardFooter && variant === "primary";
  const canToggleSound = !visualOnly && hasVideo;

  const clipPosterUrl = useMemo(() => {
    if (offer.streamId) {
      const u = cloudflareStreamThumbnailUrl(offer.streamId);
      if (u) return u;
    }
    return offer.poster;
  }, [offer.streamId, offer.poster]);

  const listPlaying = Boolean(playback && hasVideo && playback.activeSlug === offer.slug);
  const playing = hasVideo && (playback ? listPlaying : legacyInView);

  useEffect(() => {
    if (visualOnly || playback) return;
    const el = mediaShellRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const ok = e.isIntersecting && e.intersectionRatio > (priority ? 0.04 : 0.12);
          setLegacyInView(ok);
        });
      },
      { threshold: [0, 0.04, 0.08, 0.15, 0.35, 0.6, 1], rootMargin: priority ? "40px 0px 40px 0px" : "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [priority, visualOnly, playback]);

  useEffect(() => {
    if (visualOnly || !playback || playback.isDesktop) return;
    const target = mediaShellRef.current;
    if (!target) return;

    let io: IntersectionObserver | undefined;
    let raf1 = 0;
    let raf2 = 0;
    let attempts = 0;
    const maxAttempts = 80;

    const trySetup = () => {
      attempts += 1;
      if (attempts > maxAttempts) return;
      const rootEl =
        playback.mobileMode === "horizontal-scroll" ? playback.mobileRootRef?.current ?? null : null;
      if (playback.mobileMode === "horizontal-scroll" && !rootEl) {
        raf2 = window.requestAnimationFrame(trySetup);
        return;
      }
      const rootMargin =
        playback.mobileMode === "horizontal-scroll"
          ? "-10% -28% -10% -28%"
          : "-38% 0px -38% 0px";

      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            playback.reportVisibility(offer.slug, e.isIntersecting ? e.intersectionRatio : 0);
          }
        },
        {
          root: playback.mobileMode === "horizontal-scroll" ? rootEl : null,
          rootMargin,
          threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.35, 0.5, 0.65, 0.85, 1],
        },
      );
      io.observe(target);
    };

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(trySetup);
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      io?.disconnect();
    };
  }, [playback, offer.slug, visualOnly]);

  const onShellEnter = useCallback(() => {
    if (playback?.isDesktop) playback.onCardEnter(offer.slug);
  }, [playback, offer.slug]);

  const onShellLeave = useCallback(() => {
    if (playback?.isDesktop) playback.onCardLeave();
  }, [playback]);

  const shellClass =
    surfaceTheme === "hero"
      ? [
          "relative aspect-[9/16] w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-900 shadow-[var(--shadow-cinematic)]",
          "transition-[box-shadow,transform] duration-300",
          "ring-1 ring-white/10 hover:ring-white/25 hover:shadow-[0_0_0_1px_rgba(242,101,34,0.2),var(--shadow-cinematic)]",
        ].join(" ")
      : "relative aspect-[9/16] w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-800";

  const topRowClass =
    surfaceTheme === "hero"
      ? [
          "absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 flex items-start justify-between z-[2]",
          canToggleSound ? "pr-11 sm:pr-12" : "",
        ].join(" ")
      : [
          "absolute top-4 left-4 right-4 flex items-start justify-between z-[2]",
          canToggleSound ? "pr-11 sm:pr-12" : "",
        ].join(" ");

  const idxClass =
    surfaceTheme === "hero"
      ? "font-display text-[12px] md:text-[13px] text-white/50 leading-none tabular-nums"
      : "font-display text-[13px] text-white/50 leading-none tabular-nums";

  const bottomWrapClass =
    surfaceTheme === "hero"
      ? "absolute inset-x-0 bottom-0 p-4 md:p-5 lg:p-6 text-white z-[2]"
      : "absolute inset-x-0 bottom-0 p-5 md:p-6 text-white z-[2]";

  const cityClass =
    surfaceTheme === "hero"
      ? "text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1.5 md:mb-2"
      : "text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2";

  const titleClass =
    surfaceTheme === "hero"
      ? "font-display text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] leading-[1.05] mb-1.5 md:mb-2 line-clamp-2"
      : "font-display text-[22px] md:text-[26px] leading-[1.05] mb-2 line-clamp-2";

  const metaRowClass =
    surfaceTheme === "hero"
      ? "flex items-center justify-between text-[10px] md:text-[11px] text-white/50"
      : "flex items-center justify-between text-[11px] text-white/50";

  const showTaglineInOverlay = variant === "primary" && surfaceTheme !== "hero" && offer.tagline;

  return (
    <div className="video-card group relative">
      <div
        ref={mediaShellRef}
        className={shellClass}
        onMouseEnter={onShellEnter}
        onMouseLeave={onShellLeave}
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="video-card__glow absolute -inset-px rounded-[var(--radius-lg)] z-10"
            style={{
              background: "linear-gradient(135deg, rgba(0,90,148,0.3) 0%, rgba(242,101,34,0.2) 100%)",
              filter: "blur(1px)",
            }}
          />

          <div className="video-card__media absolute inset-0 h-full w-full">
            {visualOnly ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={offer.poster}
                alt={offer.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading={priority ? "eager" : "lazy"}
              />
            ) : hasVideo ? (
              <GridClipSurface
                title={offer.title}
                streamId={offer.streamId}
                videoSrc={offer.videoSrc}
                posterUrl={clipPosterUrl}
                playing={playing}
                muted={muted}
                posterPriority={index === 0}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={offer.poster}
                alt={offer.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading={priority ? "eager" : "lazy"}
              />
            )}
          </div>

          <div className="absolute inset-0 grad-btm-strong z-[1]" />

          <div className={topRowClass}>
            <span className={idxClass}>{String(index + 1).padStart(2, "0")}</span>
            <div className="flex flex-col items-end gap-1.5">
              {offer.isNew && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-400 text-ink-950 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]">
                  Nowość
                </span>
              )}
              {offer.isExclusive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md text-white px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]">
                  Exclusive
                </span>
              )}
            </div>
          </div>

          <div className={bottomWrapClass}>
            <p className={cityClass}>
              {offer.city}
              {offer.district ? ` · ${offer.district}` : ""} · {offer.kindLabel}
            </p>
            <h3 className={titleClass}>{offer.title}</h3>
            {showTaglineInOverlay && (
              <p className="text-[13px] text-white/60 leading-snug line-clamp-2 mb-4">{offer.tagline}</p>
            )}
            <div className={metaRowClass}>
              <span className="flex items-center gap-2">
                {offer.area} m²{offer.rooms ? ` · ${offer.rooms} pok.` : ""}
              </span>
              {showPrice ? (
                <span
                  className={
                    surfaceTheme === "hero"
                      ? "text-white font-medium text-[11px] md:text-[12px]"
                      : "text-white font-medium text-[12px]"
                  }
                >
                  {priceShort(offer.priceFrom)}
                </span>
              ) : (
                <span
                  className={
                    surfaceTheme === "hero"
                      ? "text-white/80 text-[11px] md:text-[12px] font-medium"
                      : "text-white/80 text-[12px] font-medium"
                  }
                >
                  Zobacz ofertę
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/oferty/${offer.slug}`}
          className="absolute inset-0 z-[10]"
          aria-label={`Zobacz ofertę: ${offer.title}`}
        >
          <span className="sr-only">{offer.title}</span>
        </Link>

        {canToggleSound && (
          <div className="pointer-events-auto absolute top-2.5 right-2.5 z-[50] md:top-3 md:right-3">
            <VideoSoundIconButton
              muted={muted}
              onToggle={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMuted((m) => !m);
              }}
            />
          </div>
        )}
      </div>

      {showFooter && (
        <div className="pt-5 px-0.5">
          <p className="text-[13.5px] text-ink-600 leading-[1.55] line-clamp-2">{offer.excerpt}</p>
          <Link
            href={`/oferty/${offer.slug}`}
            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-900 hover:text-brand-500 transition-colors"
          >
            Zobacz ofertę
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
