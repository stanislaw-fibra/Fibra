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
 * Klip na karcie listy: poster zawsze pod wideo; wideo z fade dopiero po `onPlaying`.
 * Przy `mounted` i `!playing` - pauza zamiast niszczenia HLS (sąsiednie karty preloadują segmenty).
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

  const hlsSrc = useMemo(() => {
    if (!streamId) return null;
    return `https://videodelivery.net/${streamId}/manifest/video.m3u8`;
  }, [streamId]);

  useEffect(() => {
    if (!playing) setRevealVideo(false);
  }, [playing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!mounted) {
      destroyHls(hlsRef, videoRef.current);
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
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
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
      setRevealVideo(false);
    };
  }, [mounted, hlsSrc, videoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!mounted || !v) return;
    if (playing) {
      void v.play().catch(() => void 0);
    } else {
      try {
        v.pause();
      } catch {
        // ignore
      }
    }
  }, [playing, mounted]);

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
            "absolute inset-0 z-[1] pointer-events-none transition-opacity duration-200 ease-out",
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
            onPlaying={() => setRevealVideo(true)}
          />
        </div>
      ) : null}
    </div>
  );
}
