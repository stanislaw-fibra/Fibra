"use client";

import Image from "next/image";
import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  cloudflareStreamThumbnailUrl,
  cloudflareStreamThumbnailViaDeliveryNet,
  sanitizeCloudflareVideoId,
} from "@/lib/cloudflare-stream";

type Props = {
  /** Cloudflare Stream ID — gdy puste, pokazujemy zdjęcie. */
  videoId?: string;
  /** URL do zdjęcia (fallback / poster). */
  photoUrl?: string;
  /** Imię i nazwisko (alt). */
  name: string;
  /** Wariant — różny aspect i scaling: founder (większe, 3/4) lub member (5/7 wąziej). */
  variant?: "founder" | "member";
  /** Kontrolne tło — np. tonacja brand/accent. */
  className?: string;
};

/**
 * Karta z portretem osoby z zespołu Fibry.
 *
 * Wideo agenta odtwarza się przez natywny `<video>` + HLS (`videodelivery.net`),
 * tak samo jak reels ofert na stronie głównej — autoplay, wyciszone, w pętli.
 * Dzięki temu „podgląd" to żywe wideo w pełnej jakości HLS, a nie statyczny,
 * mocno skompresowany JPEG (poprzednio ~50 KB — wyglądało słabo).
 *
 * Klik w „Zobacz autoprezentację" → włącza dźwięk, restart od początku,
 * pokazuje natywne kontrolki.
 *
 * Fallback: brak wideo → next/image z portretem → inicjały.
 * Wideo montowane dopiero po wejściu w viewport (IntersectionObserver).
 */
export function TeamMemberMedia({ videoId, photoUrl, name, variant = "member", className = "" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [shouldMount, setShouldMount] = useState(false);
  const [revealVideo, setRevealVideo] = useState(false);
  /** Czy user kliknął play z dźwiękiem (wtedy: unmute + kontrolki). */
  const [activated, setActivated] = useState(false);

  const aspectClass = "aspect-[9/16]";
  const streamId = videoId ? sanitizeCloudflareVideoId(videoId) : null;
  const hlsSrc = useMemo(
    () => (streamId ? `https://videodelivery.net/${streamId}/manifest/video.m3u8` : null),
    [streamId],
  );
  // Poster (klatka pod wideo, póki HLS się ładuje) — wysokie 1600 px dla ostrości na retina.
  const posterUrl = streamId
    ? cloudflareStreamThumbnailUrl(streamId, { time: "1.5s", height: 1600 }) ||
      cloudflareStreamThumbnailViaDeliveryNet(streamId, { time: "1.5s", height: 1600 })
    : null;

  // Mount wideo dopiero gdy karta wchodzi w viewport.
  useEffect(() => {
    if (!hlsSrc) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldMount(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hlsSrc]);

  // Setup HLS + autoplay muted loop.
  useEffect(() => {
    if (!shouldMount || !hlsSrc) return;
    const video = videoRef.current;
    if (!video) return;

    video.loop = true;
    video.playsInline = true;
    video.muted = true;
    setRevealVideo(false);

    const canNativeHls = !!video.canPlayType("application/vnd.apple.mpegurl");
    if (canNativeHls) {
      video.src = hlsSrc;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(hlsSrc);
      hls.attachMedia(video);
      hlsRef.current = hls;
    }
    video.preload = "metadata";
    void video.play().catch(() => void 0);

    return () => {
      try {
        video.pause();
      } catch {
        /* ignore */
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setRevealVideo(false);
    };
  }, [shouldMount, hlsSrc]);

  const containerClass = [
    "relative w-full overflow-hidden rounded-[var(--radius-lg)] ring-1 ring-ink-200/70 shadow-[var(--shadow-cinematic)] bg-gradient-to-br from-brand-500/10 to-accent-400/10",
    aspectClass,
    className,
  ].join(" ");

  // ===== 1) Cloudflare Stream — autoplay muted loop, klik = dźwięk =====
  if (hlsSrc) {
    const activate = () => {
      const v = videoRef.current;
      setActivated(true);
      if (v) {
        v.muted = false;
        try {
          v.currentTime = 0;
        } catch {
          /* ignore */
        }
        void v.play().catch(() => void 0);
      }
    };

    return (
      <div ref={wrapRef} className={containerClass}>
        {/* Poster (klatka HLS) — pod wideo, znika gdy wideo gotowe. */}
        {posterUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={posterUrl}
            alt={`${name} — autoprezentacja`}
            className={[
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              revealVideo ? "opacity-0" : "opacity-100",
            ].join(" ")}
            draggable={false}
          />
        ) : photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photoUrl}
            alt={`${name} — portret`}
            className={[
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              revealVideo ? "opacity-0" : "opacity-100",
            ].join(" ")}
            draggable={false}
          />
        ) : null}

        {shouldMount ? (
          <video
            ref={videoRef}
            className={[
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
              revealVideo ? "opacity-100" : "opacity-0",
            ].join(" ")}
            muted
            loop
            playsInline
            controls={activated}
            controlsList="nodownload"
            preload="metadata"
            aria-label={`${name} — autoprezentacja`}
            onLoadedData={() => setRevealVideo(true)}
            onPlaying={() => setRevealVideo(true)}
          />
        ) : null}

        {/* Overlay „Zobacz autoprezentację" — tylko póki user nie włączył dźwięku. */}
        {!activated && (
          <button
            type="button"
            onClick={activate}
            className="group absolute inset-0 z-10 flex items-end justify-center bg-gradient-to-t from-ink-950/55 via-ink-950/5 to-transparent transition-opacity duration-300 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            aria-label={`Odtwórz autoprezentację z dźwiękiem: ${name}`}
          >
            <span className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/95 px-5 py-3 text-[13px] font-semibold text-ink-950 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)] transition-transform group-hover:scale-105">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
                  <path d="M2.5 1.5l7 4-7 4v-8z" />
                </svg>
              </span>
              Zobacz autoprezentację
            </span>
          </button>
        )}
      </div>
    );
  }

  // ===== 2) Zdjęcie =====
  if (photoUrl) {
    return (
      <div className={containerClass}>
        <Image
          src={photoUrl}
          alt={`${name}`}
          fill
          sizes={variant === "founder" ? "(min-width: 1024px) 40vw, (min-width: 768px) 448px, 384px" : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover"
          style={{ objectPosition: variant === "founder" ? "center 28%" : "center top" }}
          quality={85}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950/25 via-transparent to-transparent" />
      </div>
    );
  }

  // ===== 3) Inicjały =====
  const initials = name
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className={containerClass}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-[clamp(3rem,9vw,6rem)] text-white/85 tracking-tight">{initials}</span>
      </div>
    </div>
  );
}
