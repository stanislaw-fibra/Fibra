"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";

type Props = {
  title: string;
  streamId?: string;
  videoSrc?: string;
  posterUrl: string;
  /** W obrębie „ringu” max 3 slotów - wtedy `<video>` zostaje w DOM (HLS nie niszczony przy pauzie). */
  mounted: boolean;
  /** Odtwarzaj / pauzuj (bez odmontowywania przy `mounted`). */
  playing: boolean;
  muted: boolean;
  posterPriority?: boolean;
};

function destroyHls(hlsRef: { current: Hls | null }, video: HTMLVideoElement | null) {
  if (hlsRef.current) {
    try {
      hlsRef.current.destroy();
    } catch {
      // ignore
    }
    hlsRef.current = null;
  }
  if (video) {
    try {
      video.pause();
    } catch {
      // ignore
    }
    video.removeAttribute("src");
    try {
      video.load();
    } catch {
      // ignore
    }
  }
}

/**
 * Klip na karcie listy: poster zawsze pod wideo; reveal ekspozycją po
 * `onLoadedData` (pierwsza klatka gotowa) — to najszybszy moment, w którym
 * możemy pokazać wideo zamiast miniatury. Po ujawnieniu klatki wideo
 * NIE chowamy go przy pauzie — żeby kolejne scrolle nie „mrugały"
 * w rytmie plakat → film → plakat. Efekt netto: TikTok-owe przewijanie.
 *
 * Sąsiednie, niegrające sloty (w ringu) są „priming" — HLS dopala
 * pierwszy segment, więc przy zmianie aktywnej karty `play()` zachodzi
 * praktycznie natychmiast.
 */
export function GridClipSurface({
  title,
  streamId,
  videoSrc,
  posterUrl,
  mounted,
  playing,
  muted,
  posterPriority = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [revealVideo, setRevealVideo] = useState(false);
  const [firstFrameReady, setFirstFrameReady] = useState(false);

  const hlsSrc = useMemo(() => {
    if (!streamId) return null;
    return `https://videodelivery.net/${streamId}/manifest/video.m3u8`;
  }, [streamId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!mounted) {
      destroyHls(hlsRef, videoRef.current);
      setFirstFrameReady(false);
      setRevealVideo(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";

    destroyHls(hlsRef, video);

    const canNativeHls = !!video.canPlayType("application/vnd.apple.mpegurl");

    if (hlsSrc) {
      if (canNativeHls) {
        video.src = hlsSrc;
      } else if (Hls.isSupported()) {
        // Tuning pod szybki pierwszy frame (Tik-Tok-like):
        //  - startLevel 0 (najniższa jakość najpierw = najszybciej),
        //  - krótki bufor (minimum potrzebne by start był płynny),
        //  - agresywny prefetch + fast ABR.
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          startLevel: 0,
          maxBufferLength: 6,
          maxMaxBufferLength: 20,
          backBufferLength: 0,
          testBandwidth: false,
          progressive: true,
        });
        hls.loadSource(hlsSrc);
        hls.attachMedia(video);
        hlsRef.current = hls;
      }
    } else if (videoSrc) {
      video.src = videoSrc;
    }

    return () => {
      destroyHls(hlsRef, videoRef.current);
    };
  }, [mounted, hlsSrc, videoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!mounted || !v) return;
    if (playing) {
      // Jeśli pierwsza klatka już jest, od razu pokaż wideo (nie czekamy na onPlaying).
      if (firstFrameReady) setRevealVideo(true);
      void v.play().catch(() => void 0);
    } else {
      try {
        v.pause();
      } catch {
        // ignore
      }
    }
  }, [playing, mounted, firstFrameReady]);

  return (
    <div className="absolute inset-0 bg-ink-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterUrl}
        alt=""
        className="absolute inset-0 z-0 h-full w-full object-cover"
        loading={posterPriority ? "eager" : "lazy"}
        draggable={false}
        aria-hidden
      />
      {mounted ? (
        <div
          className={[
            "absolute inset-0 z-[1] pointer-events-none transition-opacity duration-100 ease-out",
            revealVideo ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted={muted}
            loop
            playsInline
            preload="auto"
            aria-label={title}
            onLoadedData={() => {
              setFirstFrameReady(true);
              if (playing) setRevealVideo(true);
            }}
            onCanPlay={() => {
              if (playing) setRevealVideo(true);
            }}
            onPlaying={() => setRevealVideo(true)}
          />
        </div>
      ) : null}
    </div>
  );
}
