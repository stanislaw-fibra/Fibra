"use client";

import { useEffect, useMemo, useRef } from "react";
import Hls from "hls.js";

type Props = {
  title: string;
  streamId?: string;
  videoSrc?: string;
  posterUrl: string;
  /** Gdy false — tylko statyczny poster (brak manifestu / play). */
  playing: boolean;
  muted: boolean;
  /** Pierwszy plakat na liście: szybsze ładowanie miniatury */
  posterPriority?: boolean;
};

/**
 * Klip na karcie listy: wideo tylko gdy `playing`; w przeciwnym razie sam poster (oszczędność minut streamu).
 */
export function GridClipSurface({
  title,
  streamId,
  videoSrc,
  posterUrl,
  playing,
  muted,
  posterPriority = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

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
    const video = videoRef.current;
    if (!video || !playing) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        try {
          video.pause();
        } catch {
          // ignore
        }
        video.removeAttribute("src");
        video.load();
      }
      return;
    }

    video.loop = true;
    video.playsInline = true;

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
      video.removeAttribute("src");
      try {
        video.load();
      } catch {
        // ignore
      }
    };
  }, [playing, hlsSrc, videoSrc]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterUrl}
        alt=""
        className={[
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
          playing ? "opacity-0" : "opacity-100",
        ].join(" ")}
        loading={posterPriority ? "eager" : "lazy"}
        draggable={false}
        aria-hidden
      />
      {playing ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted={muted}
          loop
          playsInline
          preload="auto"
          poster={posterUrl}
          aria-label={title}
        />
      ) : null}
    </>
  );
}
