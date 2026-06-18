"use client";

import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AgentAvatar } from "@/components/offers/AgentAvatar";
import {
  cloudflareStreamThumbnailViaDeliveryNet,
  sanitizeCloudflareVideoId,
} from "@/lib/cloudflare-stream";
import { useModalHistoryClose } from "@/lib/use-modal-history-close";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  /** Cloudflare Stream ID autoprezentacji agenta. Gdy brak - zwykły awatar bez Play. */
  videoId?: string;
  photoUrl?: string;
  name?: string;
  /**
   * `avatar` (domyślny) - okrągły awatar z kropką Play (sekcja kontaktu pod hero).
   * `card` - duży, rzucający się w oczy kafelek z plakatem wideo + dużym Play
   *   (dolna sekcja „Kontakt w sprawie oferty"). Bez wideo `card` nic nie renderuje.
   * `banner` - poziomy klikalny pasek z miniaturą + tekstem zachęty, do wstawienia
   *   wysoko na stronie oferty (przy parametrach). Bez wideo `banner` nic nie renderuje.
   */
  variant?: "avatar" | "card" | "banner";
};

/**
 * „Human first" - na stronie oferty agent jako wideo-autoprezentacja.
 * Klik → popup z pionowym (9:16) filmem (HLS, ten sam mechanizm co reels).
 *
 * Wariant `avatar`: okrągły przycisk z ikoną Play; bez wideo → zwykły `AgentAvatar`.
 * Wariant `card`: duży kafelek z plakatem; bez wideo → null (nie zajmuje miejsca).
 */
export function OfferAgentPresentation({ videoId, photoUrl, name, variant = "avatar" }: Props) {
  const streamId = videoId ? sanitizeCloudflareVideoId(videoId) : null;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => setMounted(true), []);

  const hlsSrc = useMemo(
    () => (streamId ? `https://videodelivery.net/${streamId}/manifest/video.m3u8` : null),
    [streamId],
  );
  const posterUrl = streamId
    ? cloudflareStreamThumbnailViaDeliveryNet(streamId, { time: "1.5s", height: 1600 })
    : null;

  // HLS + odtwarzanie dopiero po otwarciu popupu.
  useEffect(() => {
    if (!open || !hlsSrc) return;
    const video = videoRef.current;
    if (!video) return;

    video.playsInline = true;
    const canNativeHls = !!video.canPlayType("application/vnd.apple.mpegurl");
    if (canNativeHls) {
      video.src = hlsSrc;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, abrEwmaDefaultEstimate: 6_000_000 });
      hls.loadSource(hlsSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hls.levels.length > 0) hls.currentLevel = hls.levels.length - 1;
      });
      hlsRef.current = hls;
    }
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
    };
  }, [open, hlsSrc]);

  // ESC + blokada scrolla tła.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useModalHistoryClose(open, () => setOpen(false));

  // Brak wideo - `card`/`banner` nie zajmują miejsca; `avatar` pokazuje zwykły awatar.
  if (!streamId) {
    return variant === "avatar" ? <AgentAvatar photoUrl={photoUrl} name={name} size="md" /> : null;
  }

  const modal =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                key="agent-presentation-modal"
                role="dialog"
                aria-modal="true"
                aria-label={name ? `Autoprezentacja: ${name}` : "Autoprezentacja agenta"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease }}
                className="fixed inset-0 z-[280] flex items-center justify-center p-3 sm:p-6"
              >
                <motion.button
                  type="button"
                  aria-label="Zamknij"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 12 }}
                  transition={{ duration: 0.32, ease }}
                  className="relative z-[1] flex h-[min(88dvh,820px)] aspect-[9/16] max-w-[94vw] flex-col overflow-hidden rounded-[var(--radius-xl)] bg-black shadow-[var(--shadow-cinematic)] ring-1 ring-white/10"
                >
                  <video
                    ref={videoRef}
                    className="h-full w-full object-contain bg-black"
                    controls
                    autoPlay
                    playsInline
                    controlsList="nodownload"
                    poster={posterUrl ?? undefined}
                    aria-label={name ? `Autoprezentacja: ${name}` : "Autoprezentacja agenta"}
                  />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Zamknij"
                    className="absolute right-3 top-3 z-[2] inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-950/60 text-white backdrop-blur-sm ring-1 ring-white/20 transition-colors hover:bg-ink-950/80"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  {name ? (
                    <span className="pointer-events-none absolute bottom-3 left-3 right-3 z-[2] rounded-full bg-ink-950/55 px-3 py-1.5 text-center text-[12px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                      {name}
                    </span>
                  ) : null}
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null;

  // Wariant `banner`: poziomy, klikalny pasek z miniaturą wideo + tekstem zachęty.
  // Wstawiany wysoko na stronie oferty (przy parametrach), żeby autoprezentacja była
  // widoczna bez scrollowania do dolnej sekcji kontaktu.
  if (variant === "banner") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={name ? `Odtwórz autoprezentację: ${name}` : "Odtwórz autoprezentację agenta"}
          className="group flex w-full items-center gap-3 overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/70 bg-paper p-2 pr-3 text-left shadow-[var(--shadow-soft)] transition-all duration-300 hover:border-brand-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          {/* Kompaktowa miniatura z plakatem wideo. Play to mały badge w rogu - NIE
              zakrywa kadru, żeby było widać twarz agenta (uwaga Romana: wcześniej
              duże kółko Play na środku zasłaniało całą miniaturę). */}
          <span className="relative block h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-ink-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl ?? photoUrl ?? undefined}
              alt={name ? `Autoprezentacja: ${name}` : "Autoprezentacja agenta"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Delikatny gradient u dołu - badge czytelny, twarz odsłonięta. */}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/55 to-transparent" />
            <span className="absolute bottom-1 right-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/95 text-ink-950 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110">
              <svg width="9" height="9" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
                <path d="M2.5 1.5l7 4-7 4v-8z" />
              </svg>
            </span>
          </span>
          {/* Tekst zachęty - jeden wiersz, zwarcie. */}
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-600">
              Autoprezentacja{name ? ` · ${name}` : ""}
            </span>
            <span className="mt-0.5 block truncate text-[13px] leading-snug text-ink-600">
              Zobacz, kim jestem - krótki film agenta.
            </span>
          </span>
          <span className="ml-1 inline-flex shrink-0 items-center gap-1.5 self-center text-[12.5px] font-medium text-brand-600">
            <span className="hidden sm:inline">Zobacz</span>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        {modal}
      </>
    );
  }

  // Wariant `card`: duży, rzucający się w oczy kafelek z plakatem wideo (pionowy 4:5)
  // + dużym Play. Wypełnia puste miejsce po prawej w dolnej sekcji „Kontakt w sprawie oferty".
  if (variant === "card") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={name ? `Odtwórz autoprezentację: ${name}` : "Odtwórz autoprezentację agenta"}
          className="group relative block w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-900 ring-1 ring-ink-200/70 shadow-[var(--shadow-soft)] transition-all duration-300 hover:ring-brand-300 hover:shadow-[0_18px_48px_-24px_rgba(11,15,20,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl ?? photoUrl ?? undefined}
              alt={name ? `Autoprezentacja: ${name}` : "Autoprezentacja agenta"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/15 to-ink-950/10" />
            {/* Duży Play na środku - jasny sygnał, że to wideo. */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-ink-950 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-110">
                <svg width="22" height="22" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
                  <path d="M2.5 1.5l7 4-7 4v-8z" />
                </svg>
              </span>
            </span>
            {/* Etykieta - rola materiału + nazwisko. */}
            <span className="absolute left-4 right-4 top-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-ink-950/55 px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              <svg width="10" height="10" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
                <path d="M2.5 1.5l7 4-7 4v-8z" />
              </svg>
              Autoprezentacja
            </span>
            <span className="absolute bottom-4 left-4 right-4 text-white">
              {name ? (
                <span className="block font-display text-[18px] leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                  {name}
                </span>
              ) : null}
              <span className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-white/90">
                Zobacz wideo
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </div>
        </button>
        {modal}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={name ? `Odtwórz autoprezentację: ${name}` : "Odtwórz autoprezentację agenta"}
        className="group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        {/* Brak zdjęcia profilowego, ale jest wideo → pokaż kadr z autoprezentacji
            zamiast inicjałów (uwaga Romana). photoUrl ma pierwszeństwo. */}
        <AgentAvatar photoUrl={photoUrl ?? posterUrl ?? undefined} name={name} size="md" />
        {/* Przyciemnienie + duża ikona Play na hover - sygnał, że to klikalne wideo. */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-950/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink-950 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
            <svg width="12" height="12" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
              <path d="M2.5 1.5l7 4-7 4v-8z" />
            </svg>
          </span>
        </span>
        {/* Stały mały „badge" Play w rogu - widoczny zawsze, żeby wideo było odkrywalne bez hovera. */}
        <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white ring-2 ring-paper shadow-[0_4px_12px_-4px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110">
          <svg width="10" height="10" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
            <path d="M2.5 1.5l7 4-7 4v-8z" />
          </svg>
        </span>
      </button>
      {modal}
    </>
  );
}
