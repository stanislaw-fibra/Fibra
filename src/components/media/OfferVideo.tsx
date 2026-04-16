"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { VideoSoundIconButton } from "@/components/media/VideoSoundIconButton";

type Props = {
  title: string;
  poster: string;
  /** Identyfikator klipu wideo (odtwarzanie przez sieć CDN) */
  streamId?: string;
  /** MP4 fallback */
  videoSrc?: string;
  /** Hint for first card (szybszy start) */
  priority?: boolean;
  /** Każde zwiększenie = ponowny start od 0 (mouseEnter / focus na karcie) */
  playRequest?: number;
  /** Tryb kontrolowany: wyciszenie z zewnątrz (np. przycisk nad linkiem na karcie) */
  muted?: boolean;
  /** Początkowe wyciszenie, gdy `muted` nie jest przekazywane */
  defaultMuted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  /** Ukrywa ikonę w komponencie — rodzic pokazuje własną kontrolkę zsynchronizowaną przez `muted` / `onMutedChange` */
  hideSoundButton?: boolean;
};

export function OfferVideo({
  title,
  poster,
  streamId,
  videoSrc,
  priority = false,
  playRequest = 0,
  muted: mutedProp,
  defaultMuted = true,
  onMutedChange,
  hideSoundButton = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [started, setStarted] = useState(false);
  const [internalMuted, setInternalMuted] = useState(defaultMuted);

  const controlled = mutedProp !== undefined;
  const muted = controlled ? mutedProp : internalMuted;

  const hlsSrc = useMemo(() => {
    if (!streamId) return null;
    return `https://videodelivery.net/${streamId}/manifest/video.m3u8`;
  }, [streamId]);

  const canToggleSound = Boolean(hlsSrc || videoSrc);

  const setMuted = (next: boolean) => {
    if (!controlled) setInternalMuted(next);
    onMutedChange?.(next);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (!muted) {
      void video.play().catch(() => void 0);
    }
  }, [muted]);

  // Attach HLS only when needed. This gives us full control (pause/only one playing).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const shouldInit = true;

    video.loop = true;
    video.playsInline = true;

    if (!shouldInit) {
      try {
        video.pause();
      } catch {
        // ignore
      }
      setStarted(false);
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

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

    video.preload = "auto";
    video.play().catch(() => void 0);

    return () => {
      try {
        video.pause();
      } catch {
        // ignore
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [priority, hlsSrc, videoSrc]);

  /** Każde kolejne najechanie (inkrement playRequest) odpala clip od nowa */
  useEffect(() => {
    if (playRequest < 1) return;
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = 0;
    } catch {
      // ignore
    }
    void v.play().catch(() => void 0);
    setStarted(true);
  }, [playRequest]);

  const handleEnded = () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = 0;
    } catch {
      // ignore
    }
    void v.play().catch(() => void 0);
    setStarted(true);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <video
        ref={videoRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        muted={muted}
        loop
        playsInline
        preload={priority ? "auto" : "metadata"}
        poster={poster}
        aria-label={title}
        onPlaying={() => setStarted(true)}
        onEnded={handleEnded}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={title}
        className={[
          "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          started ? "opacity-0" : "opacity-100",
        ].join(" ")}
        loading={priority ? "eager" : "lazy"}
        draggable={false}
      />
      {canToggleSound && !hideSoundButton && (
        <div className="pointer-events-auto absolute top-2.5 right-2.5 z-[40] md:top-3 md:right-3">
          <VideoSoundIconButton
            muted={muted}
            onToggle={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMuted(!muted);
            }}
          />
        </div>
      )}
    </div>
  );
}
