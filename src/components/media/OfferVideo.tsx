"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { cloudflareStreamThumbnailUrl } from "@/lib/cloudflare-stream";

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
  /** Ukrywa ikonę w komponencie - rodzic pokazuje własną kontrolkę zsynchronizowaną przez `muted` / `onMutedChange` */
  hideSoundButton?: boolean;
  /** Na stronie oferty: pełna klatka pionowa bez przycinania (letterbox po bokach przy potrzebie). */
  objectFit?: "cover" | "contain";
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
  objectFit = "cover",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [revealVideo, setRevealVideo] = useState(false);
  const [internalMuted, setInternalMuted] = useState(defaultMuted);

  const controlled = mutedProp !== undefined;
  const muted = controlled ? mutedProp : internalMuted;

  const hlsSrc = useMemo(() => {
    if (!streamId) return null;
    return `https://videodelivery.net/${streamId}/manifest/video.m3u8`;
  }, [streamId]);

  const posterLayerUrl = useMemo(() => {
    if (streamId) {
      const u = cloudflareStreamThumbnailUrl(streamId, { time: "1s", height: 600 });
      if (u) return u;
    }
    return poster;
  }, [streamId, poster]);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.loop = true;
    video.playsInline = true;
    setRevealVideo(false);

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

    video.preload = priority ? "auto" : "metadata";
    void video.play().catch(() => void 0);

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
      setRevealVideo(false);
    };
  }, [priority, hlsSrc, videoSrc]);

  /** Każde kolejne najechanie (inkrement playRequest) odpala clip od nowa */
  useEffect(() => {
    if (playRequest < 1) return;
    const v = videoRef.current;
    if (!v) return;
    setRevealVideo(false);
    try {
      v.currentTime = 0;
    } catch {
      // ignore
    }
    void v.play().catch(() => void 0);
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
  };

  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  return (
    <div className="absolute inset-0 bg-ink-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterLayerUrl}
        alt=""
        className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${fitClass}`}
        loading={priority ? "eager" : "lazy"}
        draggable={false}
        aria-hidden
      />
      <div
        className={[
          "absolute inset-0 z-[1] transition-opacity duration-150 ease-out",
          revealVideo ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {/* Na stronie oferty pokazujemy natywne controls — play/pause, seek, głośność,
            fullscreen (na mobile krytyczne, bo natywny fullscreen iPhone'owy działa
            tylko z kontrolkami HTML5 video). Autoplay muted loop działa jak dotąd,
            ale user może przejąć kontrolę w każdej chwili. */}
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full ${fitClass}`}
          muted={muted}
          loop
          playsInline
          controls
          controlsList="nodownload"
          preload={priority ? "auto" : "metadata"}
          aria-label={title}
          onLoadedData={() => setRevealVideo(true)}
          onPlaying={() => setRevealVideo(true)}
          onVolumeChange={(e) => {
            const v = e.currentTarget;
            setMuted(v.muted);
          }}
          onEnded={handleEnded}
        />
      </div>
    </div>
  );
}
