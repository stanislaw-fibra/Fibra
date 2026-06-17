"use client";

import { useRef, useState } from "react";
import { cloudflareStreamIframeUrl } from "@/lib/cloudflare-stream";
import type { CourseMaterials } from "@/lib/course-materials";

/**
 * Sekcja „Bonusy / Materiały" w portalu kursu: szkolenie VOD (Cloudflare Stream),
 * e-book i sketchnotes (PDF) oraz audiobook jako odtwarzacz z playlistą rozdziałów.
 * Wszystkie pliki PDF/audio idą przez krótko żyjące signed URL-e (prop `materials`),
 * generowane na serwerze tylko dla osoby z dostępem.
 */
export function CourseBonuses({ materials }: { materials: CourseMaterials }) {
  // sketchnotes NIE są tu - to bonus tylko dla zapisanych do newslettera
  // (sekcja newslettera niżej w portalu, dostawa osobno przez GetResponse/Resend).
  const { ebookUrl, audiobook, vodStreamId } = materials;
  const vodSrc = cloudflareStreamIframeUrl(vodStreamId);

  return (
    <section className="mt-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">
        Twój pakiet
      </p>
      <h2 className="mt-3 font-display text-[1.8rem] leading-[1.05] sm:text-[2.2rem]">
        Bonusy i materiały
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-300">
        Wszystko, co dostajesz w pakiecie: szkolenie wideo, e-book i audiobook.
        Materiały są dostępne tylko dla Ciebie po zalogowaniu.
      </p>

      {/* Szkolenie VOD */}
      {vodSrc && (
        <div className="mt-8">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-200">
            Szkolenie wideo (VOD)
          </h3>
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/8 bg-black aspect-video">
            <iframe
              src={vodSrc}
              title="Szkolenie VOD - dodatek do pakietu"
              loading="lazy"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      {/* E-book (sketchnotes są bonusem newsletterowym - nie w pakiecie) */}
      <div className="mt-8">
        <PdfCard
          url={ebookUrl}
          eyebrow="E-book"
          title="Zarabianie Uczciwych Pieniędzy"
          subtitle="Pełna książka w PDF"
        />
      </div>

      {/* Audiobook - odtwarzacz z playlistą */}
      {audiobook.length > 0 && <AudiobookPlayer chapters={audiobook} />}
    </section>
  );
}

function PdfCard({
  url,
  eyebrow,
  title,
  subtitle,
}: {
  url: string | null;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M7 3h7l5 5v13a0 0 0 0 1 0 0H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brand-300">{eyebrow}</p>
        <p className="mt-0.5 truncate font-display text-[1.05rem] text-white">{title}</p>
        <p className="truncate text-[12.5px] text-ink-400">{subtitle}</p>
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-ink-950 transition-colors hover:bg-ink-200"
        >
          Otwórz
        </a>
      ) : (
        <span className="shrink-0 text-[12px] text-ink-500">wkrótce</span>
      )}
    </div>
  );
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function AudiobookPlayer({ chapters }: { chapters: CourseMaterials["audiobook"] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const play = (idx: number) => {
    setCurrent(idx);
    // Po zmianie src React zaktualizuje <audio>; odtwarzamy w następnym ticku.
    requestAnimationFrame(() => {
      const el = audioRef.current;
      if (el) {
        el.load();
        el.play().catch(() => {});
      }
    });
  };

  const next = () => {
    if (current < chapters.length - 1) play(current + 1);
    else setPlaying(false);
  };

  const active = chapters[current];

  return (
    <div className="mt-10">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-200">
        Audiobook · {chapters.length} rozdziałów
      </h3>

      {/* Stały pasek odtwarzacza */}
      <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-[12px] font-semibold tabular-nums text-brand-300">
            {active?.n ?? current + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-white">{active?.title ?? "—"}</p>
            <p className="text-[11.5px] tabular-nums text-ink-400">
              {formatTime(elapsed)} / {formatTime(duration)}
            </p>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={active?.url}
          controls
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={next}
          onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          className="mt-3 w-full"
        />
      </div>

      {/* Lista rozdziałów */}
      <ol className="mt-4 max-h-[420px] space-y-1 overflow-y-auto pr-1">
        {chapters.map((c, idx) => {
          const isActive = idx === current;
          return (
            <li key={c.n}>
              <button
                type="button"
                onClick={() => play(idx)}
                aria-current={isActive}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  isActive ? "bg-white/[0.08]" : "hover:bg-white/[0.04]",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold tabular-nums",
                    isActive ? "bg-brand-500 text-white" : "bg-white/8 text-ink-300",
                  ].join(" ")}
                >
                  {isActive && playing ? "▮▮" : c.n}
                </span>
                <span className={`truncate text-[13.5px] ${isActive ? "text-white" : "text-ink-300"}`}>
                  {c.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
