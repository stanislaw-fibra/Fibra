"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  cloudflareStreamIframeUrl,
  cloudflareStreamThumbnailUrl,
} from "@/lib/cloudflare-stream";
import { Logo } from "@/components/site/Logo";
import type { Lesson } from "./lessons";
import {
  MODULES,
  TOTAL_LESSONS,
  formatLessonLength,
  formatTotalLength,
} from "./lessons";

/**
 * Okładka lekcji. Gdy lekcja ma własną, przygotowaną miniaturę (`lesson.poster`,
 * plik w /public), używamy jej przez next/image. W przeciwnym razie fallback do
 * klatki z Cloudflare Stream. Dzięki temu możemy stopniowo podmieniać surowe
 * klatki na zaprojektowane okładki bez zmian w logice portalu.
 */
function PosterImage({
  lesson,
  sizes,
  priority = false,
}: {
  lesson: Lesson;
  sizes: string;
  priority?: boolean;
}) {
  if (lesson.poster) {
    return (
      <Image
        src={lesson.poster}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    );
  }
  // Lekcja z YouTube: bez własnej okładki bierzemy miniaturę z YT.
  // hqdefault.jpg istnieje zawsze (480x360, 4:3) - kadrujemy do 16:9.
  if (lesson.youtubeId) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={`https://i.ytimg.com/vi/${lesson.youtubeId}/hqdefault.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading={priority ? "eager" : "lazy"}
      />
    );
  }
  const thumb = cloudflareStreamThumbnailUrl(lesson.videoId, {
    time: "2s",
    height: 720,
  });
  if (!thumb) return null;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={thumb}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      loading={priority ? "eager" : "lazy"}
    />
  );
}

type Props = {
  lessons: Lesson[];
  /** Sekcja dodatkowa (np. newsletter) renderowana pod programem. */
  children?: React.ReactNode;
};

const WATCHED_KEY = "fibra-kurs-watched-v1";
const POSITIONS_KEY = "fibra-kurs-pos-v1";
const AUTOPLAY_KEY = "fibra-kurs-autoplay-v1";
const LAST_KEY = "fibra-kurs-last-v1";
const STREAM_SDK_SRC = "https://embed.cloudflarestream.com/embed/sdk.latest.js";

/** Lekcję uznajemy za „w trakcie", jeśli zapisana pozycja jest dalej niż
    kilkanaście sekund od końca - wtedy wznawiamy od tego miejsca. */
const RESUME_TAIL_GUARD = 15;

/** Portal kursu w stylu panelu: stały sidebar (logo, postęp, „Kontynuuj",
    nawigacja po modułach) + główna kolumna ze sceną wideo, sterowaniem lekcjami
    i programem podzielonym na zwijane moduły. Player Cloudflare Stream daje
    kontrolę prędkości i pełny ekran; przez SDK dokładamy wznawianie od miejsca
    przerwania i automatyczne „obejrzane" po dojrzeniu do końca. */
export function CoursePortal({ lessons, children }: Props) {
  const [activeId, setActiveId] = useState(lessons[0]?.videoId ?? "");
  const [started, setStarted] = useState(false);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [autoplayNext, setAutoplayNext] = useState(false);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  const [resumeStart, setResumeStart] = useState(0);
  const [sdkReady, setSdkReady] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const positionsRef = useRef<Record<string, number>>({});
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Najświeższe handlery dla SDK (bez re-bindowania na każdą zmianę stanu).
  const handlersRef = useRef<{ onTime: () => void; onEnded: () => void }>({
    onTime: () => {},
    onEnded: () => {},
  });

  // ---- Wczytanie zapisanego stanu ----
  useEffect(() => {
    try {
      const w = localStorage.getItem(WATCHED_KEY);
      if (w) setWatched(new Set(JSON.parse(w) as string[]));
      const p = localStorage.getItem(POSITIONS_KEY);
      if (p) positionsRef.current = JSON.parse(p) as Record<string, number>;
      const a = localStorage.getItem(AUTOPLAY_KEY);
      if (a) setAutoplayNext(a === "1");
      const last = localStorage.getItem(LAST_KEY);
      if (last) setLastPlayedId(last);
    } catch {
      /* brak / uszkodzony zapis - ignorujemy */
    }
  }, []);

  // ---- Ładowanie Stream Player SDK (wznawianie + zdarzenie „ended") ----
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { Stream?: unknown };
    if (w.Stream) {
      setSdkReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-cf-stream-sdk]",
    );
    if (existing) {
      existing.addEventListener("load", () => setSdkReady(true));
      return;
    }
    const s = document.createElement("script");
    s.src = STREAM_SDK_SRC;
    s.async = true;
    s.dataset.cfStreamSdk = "1";
    s.onload = () => setSdkReady(true);
    document.body.appendChild(s);
  }, []);

  const persistPositions = useCallback(() => {
    try {
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(positionsRef.current));
    } catch {
      /* ignore */
    }
  }, []);

  const schedulePersistPositions = useCallback(() => {
    if (persistTimer.current) return;
    persistTimer.current = setTimeout(() => {
      persistTimer.current = null;
      persistPositions();
    }, 2000);
  }, [persistPositions]);

  const active = useMemo(
    () => lessons.find((l) => l.videoId === activeId) ?? lessons[0],
    [lessons, activeId],
  );

  const activeIndex = useMemo(
    () => lessons.findIndex((l) => l.videoId === active?.videoId),
    [lessons, active],
  );
  const prevLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson =
    activeIndex >= 0 && activeIndex < lessons.length - 1
      ? lessons[activeIndex + 1]
      : null;

  // Lekcje pogrupowane w moduły (tylko moduły, które mają lekcje).
  const modules = useMemo(
    () =>
      MODULES.map((m) => {
        const items = lessons.filter((l) => l.module === m.id);
        return {
          ...m,
          items,
          seconds: items.reduce((s, l) => s + l.durationSec, 0),
        };
      }).filter((m) => m.items.length > 0),
    [lessons],
  );

  const markWatched = useCallback(
    (videoId: string) => {
      setWatched((prev) => {
        if (prev.has(videoId)) return prev;
        const next = new Set(prev);
        next.add(videoId);
        try {
          localStorage.setItem(WATCHED_KEY, JSON.stringify([...next]));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const play = useCallback(
    (lesson: Lesson, scroll = false) => {
      const pos = positionsRef.current[lesson.videoId] ?? 0;
      const resumable =
        pos > 0 && pos < lesson.durationSec - RESUME_TAIL_GUARD ? pos : 0;
      setResumeStart(Math.floor(resumable));
      setActiveId(lesson.videoId);
      setStarted(true);
      setLastPlayedId(lesson.videoId);
      try {
        localStorage.setItem(LAST_KEY, lesson.videoId);
      } catch {
        /* ignore */
      }
      if (scroll) {
        stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [],
  );

  const toggleWatched = useCallback(() => {
    if (!active) return;
    setWatched((prev) => {
      const next = new Set(prev);
      if (next.has(active.videoId)) next.delete(active.videoId);
      else next.add(active.videoId);
      try {
        localStorage.setItem(WATCHED_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [active]);

  const toggleAutoplay = useCallback(() => {
    setAutoplayNext((v) => {
      const next = !v;
      try {
        localStorage.setItem(AUTOPLAY_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleModule = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Domyślny widok (jak po zalogowaniu): pierwsza lekcja na plakacie.
  const resetToDefaultView = useCallback(() => {
    setActiveId(lessons[0]?.videoId ?? "");
    setStarted(false);
  }, [lessons]);

  // Reset całego postępu: czyści obejrzane, zapisane pozycje i ostatnią lekcję.
  // Potwierdzenie idzie przez własny modal (poniżej), nie systemowy confirm().
  const doResetProgress = useCallback(() => {
    setWatched(new Set());
    setLastPlayedId(null);
    positionsRef.current = {};
    setResumeStart(0);
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
      persistTimer.current = null;
    }
    try {
      localStorage.removeItem(WATCHED_KEY);
      localStorage.removeItem(POSITIONS_KEY);
      localStorage.removeItem(LAST_KEY);
    } catch {
      /* ignore */
    }
    setConfirmResetOpen(false);
  }, []);

  // Aktualne handlery dla SDK - czytają najświeższy stan przez domknięcia.
  handlersRef.current.onTime = () => {
    const p = iframeRef.current as unknown as { __cfPlayer?: { currentTime?: number } };
    const t = p?.__cfPlayer?.currentTime;
    if (typeof t === "number" && t > 0 && active) {
      positionsRef.current[active.videoId] = t;
      schedulePersistPositions();
    }
  };
  handlersRef.current.onEnded = () => {
    if (!active) return;
    markWatched(active.videoId);
    delete positionsRef.current[active.videoId];
    persistPositions();
    if (autoplayNext && nextLesson) play(nextLesson, false);
  };

  // ---- Podpięcie Stream playera do iframe aktywnej lekcji ----
  useEffect(() => {
    if (!started || !sdkReady || !iframeRef.current) return;
    // SDK Cloudflare działa tylko na iframe Stream - dla lekcji z YouTube nie
    // podpinamy go (brak wznawiania i auto-„obejrzane", zostaje ręczne).
    if (active?.youtubeId) return;
    const StreamCtor = (window as unknown as { Stream?: (el: HTMLIFrameElement) => unknown })
      .Stream;
    if (!StreamCtor) return;

    let player: {
      currentTime?: number;
      addEventListener: (e: string, cb: () => void) => void;
      removeEventListener: (e: string, cb: () => void) => void;
    };
    try {
      player = StreamCtor(iframeRef.current) as typeof player;
    } catch {
      return;
    }
    // Udostępniamy currentTime handlerowi onTime bez domknięcia na player.
    (iframeRef.current as unknown as { __cfPlayer?: unknown }).__cfPlayer = player;

    const onTime = () => handlersRef.current.onTime();
    const onEnded = () => handlersRef.current.onEnded();
    player.addEventListener("timeupdate", onTime);
    player.addEventListener("ended", onEnded);

    return () => {
      try {
        player.removeEventListener("timeupdate", onTime);
        player.removeEventListener("ended", onEnded);
      } catch {
        /* ignore */
      }
    };
  }, [started, sdkReady, activeId]);

  // Zapis pozycji przy wyjściu / chowaniu karty.
  useEffect(() => {
    const flush = () => {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
        persistTimer.current = null;
      }
      persistPositions();
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [persistPositions]);

  // Modal potwierdzenia resetu: zamykanie klawiszem Escape + blokada scrolla tła.
  useEffect(() => {
    if (!confirmResetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmResetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [confirmResetOpen]);

  const isYouTube = !!active?.youtubeId;
  const iframeUrl =
    active && !isYouTube ? cloudflareStreamIframeUrl(active.videoId) : null;
  const watchedCount = lessons.filter((l) => watched.has(l.videoId)).length;
  const progressPct = Math.round((watchedCount / lessons.length) * 100);
  const totalSeconds = lessons.reduce((s, l) => s + l.durationSec, 0);
  const isActiveWatched = active ? watched.has(active.videoId) : false;

  // Cel przycisku „Kontynuuj": ostatnia oglądana, jeśli niedokończona; inaczej
  // pierwsza nieobejrzana.
  const firstUnwatched = lessons.find((l) => !watched.has(l.videoId)) ?? null;
  const lastPlayed = lastPlayedId
    ? lessons.find((l) => l.videoId === lastPlayedId) ?? null
    : null;
  const continueTarget =
    lastPlayed && !watched.has(lastPlayed.videoId) ? lastPlayed : firstUnwatched;
  const continueResumes =
    !!continueTarget && (positionsRef.current[continueTarget.videoId] ?? 0) > 0;

  if (!active) return null;

  const src = isYouTube
    ? `https://www.youtube.com/embed/${active.youtubeId}?autoplay=1&rel=0&modestbranding=1`
    : iframeUrl &&
      `${iframeUrl}?autoplay=true${resumeStart > 0 ? `&startTime=${resumeStart}s` : ""}`;

  return (
    <div className="container-xl grid gap-8 py-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:py-12">
      {/* ====== SIDEBAR ====== */}
      <aside className="lg:sticky lg:top-8 lg:h-fit">
        <div className="flex flex-col gap-8">
          <Logo variant="paper" href={null} onActivate={resetToDefaultView} />

          {/* Postęp kursu + Kontynuuj */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-300">
              Twój postęp
            </p>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-[2rem] leading-none tabular-nums text-white">
                {watchedCount}
              </span>
              <span className="text-[14px] text-ink-300">
                z {lessons.length} obejrzanych
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-[12px] text-ink-400">
              Docelowo {TOTAL_LESSONS} lekcji w kursie
            </p>

            {continueTarget && (
              <button
                type="button"
                onClick={() => play(continueTarget, true)}
                className="mt-4 flex w-full items-center gap-3 rounded-lg bg-brand-500 px-4 py-3 text-left transition-colors hover:bg-brand-400"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/15 text-white">
                  <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden>
                    <path d="M7 4.5v13L18 11 7 4.5z" fill="currentColor" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-tight text-white">
                    {continueResumes ? "Wróć do nauki" : "Zacznij naukę"}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] leading-tight text-white/80">
                    Lekcja {String(continueTarget.n).padStart(2, "0")}:{" "}
                    {continueTarget.title}
                  </span>
                </span>
              </button>
            )}

            {watchedCount > 0 && (
              <div className="mt-4 border-t border-white/8 pt-4">
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-[12.5px] font-medium text-ink-300 transition-colors hover:border-accent-400/40 hover:bg-accent-400/10 hover:text-accent-400"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                    className="transition-transform duration-300 group-hover:-rotate-180"
                  >
                    <path
                      d="M3.5 8a4.5 4.5 0 1 1 1.3 3.2M3.5 8V5m0 3h3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Resetuj postęp
                </button>
              </div>
            )}
          </div>

          {/* Nawigacja po modułach */}
          <nav className="hidden lg:block">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Moduły
            </p>
            <ul className="mt-3 space-y-1">
              {modules.map((m) => {
                const allDone =
                  m.items.length > 0 &&
                  m.items.every((l) => watched.has(l.videoId));
                const hasActive = m.items.some(
                  (l) => l.videoId === active.videoId,
                );
                return (
                  <li key={m.id}>
                    <a
                      href={`#modul-${m.id}`}
                      className={[
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors",
                        hasActive
                          ? "bg-white/[0.06] text-white"
                          : "text-ink-300 hover:bg-white/[0.03] hover:text-white",
                      ].join(" ")}
                    >
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/8 text-[11px] font-semibold tabular-nums text-ink-200">
                        {allDone ? (
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden className="text-brand-300">
                            <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          m.id
                        )}
                      </span>
                      <span className="truncate">{m.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Pomoc */}
          <div className="hidden rounded-2xl border border-white/8 bg-white/[0.02] p-5 lg:block">
            <p className="text-[13px] font-medium text-white">Problem z dostępem?</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-300">
              Napisz, pomożemy od ręki.
            </p>
            <a
              href="mailto:kontakt@fibranieruchomosci.pl"
              className="mt-2.5 inline-block text-[12.5px] text-brand-300 underline-offset-2 hover:underline"
            >
              kontakt@fibranieruchomosci.pl
            </a>
            <div className="mt-4 border-t border-white/8 pt-3">
              <a
                href="/kurs/logout"
                className="text-[12px] text-ink-400 underline-offset-2 transition-colors hover:text-ink-200 hover:underline"
              >
                Wyloguj
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* ====== GŁÓWNA KOLUMNA ====== */}
      <div className="min-w-0">
        {/* Scena wideo */}
        <div ref={stageRef} className="scroll-mt-8">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[var(--shadow-cinematic)]">
            {started && src ? (
              <iframe
                key={active.videoId}
                ref={iframeRef}
                className="absolute inset-0 h-full w-full"
                src={src}
                title={`Lekcja ${active.n}: ${active.title}`}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture;"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => play(active)}
                className="group absolute inset-0 h-full w-full cursor-pointer"
                aria-label={`Odtwórz lekcję ${active.n}: ${active.title}`}
              >
                <PosterImage
                  lesson={active}
                  sizes="(min-width: 1024px) 1040px, 100vw"
                  priority
                />

                {/* Gdy lekcja ma własną, zaprojektowaną okładkę - nie nakładamy
                    plakietki ani tytułu, żeby nie zasłaniać grafiki. Przy
                    fallbacku z klatki Cloudflare dokładamy winietę + opis, żeby
                    surowa klatka wyglądała jak zamierzona okładka. */}
                {active.poster ? (
                  <span className="absolute inset-0 bg-transparent transition-colors group-hover:bg-ink-950/15" />
                ) : (
                  <>
                    <span className="absolute inset-0 bg-ink-950/30 transition-colors group-hover:bg-ink-950/20" />
                    <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-950/85 via-ink-950/30 to-transparent" />

                    {/* Plakietka z numerem i czasem lekcji - lewy górny róg. */}
                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-md bg-ink-950/55 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm sm:left-5 sm:top-5">
                      Lekcja {String(active.n).padStart(2, "0")}
                      <span className="text-white/45">·</span>
                      <span className="font-medium tracking-[0.08em] text-white/85">
                        {formatLessonLength(active.durationSec)}
                      </span>
                    </span>

                    {/* Tytuł lekcji na winiecie - lewy dolny róg. */}
                    <span className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
                      <span className="block max-w-xl font-display text-[1.4rem] leading-tight text-white drop-shadow-sm sm:text-[1.9rem]">
                        {active.title}
                      </span>
                    </span>
                  </>
                )}

                {/* Przycisk odtwarzania - środek. */}
                <span className="absolute left-1/2 top-1/2 inline-flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink-950 shadow-[0_8px_30px_rgba(0,0,0,0.45)] ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105">
                  <svg width="28" height="28" viewBox="0 0 22 22" fill="none" aria-hidden className="ml-0.5">
                    <path d="M7 4.5v13L18 11 7 4.5z" fill="currentColor" />
                  </svg>
                </span>
              </button>
            )}
          </div>

          {/* Pasek sterowania pod wideo */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => prevLesson && play(prevLesson)}
                disabled={!prevLesson}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3.5 py-2 text-[13px] text-ink-200 transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Poprzednia
              </button>
              <button
                type="button"
                onClick={() => nextLesson && play(nextLesson)}
                disabled={!nextLesson}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3.5 py-2 text-[13px] text-ink-200 transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Następna
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Autoodtwarzanie */}
              <button
                type="button"
                onClick={toggleAutoplay}
                role="switch"
                aria-checked={autoplayNext}
                className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-[13px] text-ink-300 transition-colors hover:text-white"
              >
                <span
                  className={[
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    autoplayNext ? "bg-brand-400" : "bg-white/15",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      autoplayNext ? "translate-x-4" : "translate-x-0.5",
                    ].join(" ")}
                  />
                </span>
                Autoodtwarzanie
              </button>

              {/* Oznacz jako obejrzane */}
              <button
                type="button"
                onClick={toggleWatched}
                aria-pressed={isActiveWatched}
                className={[
                  "inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] transition-colors",
                  isActiveWatched
                    ? "border-brand-400/50 bg-brand-400/10 text-brand-300"
                    : "border-white/12 text-ink-200 hover:bg-white/[0.05]",
                ].join(" ")}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {isActiveWatched ? "Obejrzane" : "Oznacz jako obejrzane"}
              </button>
            </div>
          </div>

          {/* Tytuł + opis aktywnej lekcji */}
          <div className="mt-6">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">
              Lekcja {String(active.n).padStart(2, "0")}
              <span className="text-ink-400">·</span>
              <span className="text-ink-300">{formatLessonLength(active.durationSec)}</span>
            </p>
            <h1 className="mt-2 font-display text-[2rem] leading-[1.05] text-white sm:text-[2.4rem]">
              {active.title}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-300">
              {active.blurb}
            </p>
          </div>
        </div>

        {/* Program kursu - moduły */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-[1.5rem] leading-none text-white">
              Program kursu
            </h2>
            <p className="text-[12.5px] tabular-nums text-ink-300">
              {lessons.length} lekcji · {formatTotalLength(totalSeconds)}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {modules.map((m) => {
              const isCollapsed = collapsed.has(m.id);
              const done = m.items.filter((l) => watched.has(l.videoId)).length;
              return (
                <section
                  key={m.id}
                  id={`modul-${m.id}`}
                  className="scroll-mt-8 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]"
                >
                  {/* Nagłówek modułu */}
                  <button
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                    aria-expanded={!isCollapsed}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">
                          Moduł {m.id}
                        </span>
                        <span className="text-[12px] tabular-nums text-ink-300">
                          {done}/{m.items.length} · {formatTotalLength(m.seconds)}
                        </span>
                      </span>
                      <span className="mt-1 block truncate font-display text-[1.3rem] leading-tight text-white">
                        {m.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-ink-300">
                        {m.summary}
                      </span>
                    </span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      aria-hidden
                      className={[
                        "shrink-0 text-ink-300 transition-transform duration-200",
                        isCollapsed ? "" : "rotate-180",
                      ].join(" ")}
                    >
                      <path
                        d="M4 6.5L9 11.5L14 6.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* Lekcje */}
                  {!isCollapsed && (
                    <ul className="hairline-dark-t divide-y divide-white/[0.06]">
                      {m.items.map((lesson) => {
                        const isActive = lesson.videoId === active.videoId;
                        const isWatched = watched.has(lesson.videoId);
                        return (
                          <li key={lesson.videoId}>
                            <button
                              type="button"
                              onClick={() => play(lesson, true)}
                              className={[
                                "group flex w-full items-center gap-4 px-3 py-3 text-left transition-colors sm:px-4",
                                isActive
                                  ? "bg-white/[0.05] shadow-[inset_2px_0_0_0_#1d6fae]"
                                  : "hover:bg-white/[0.03]",
                              ].join(" ")}
                            >
                              {/* Miniatura */}
                              <span className="relative h-[52px] w-[92px] shrink-0 overflow-hidden rounded-md bg-black">
                                <PosterImage lesson={lesson} sizes="92px" />
                                <span
                                  className={[
                                    "absolute inset-0 flex items-center justify-center transition-opacity",
                                    isActive
                                      ? "bg-ink-950/20 opacity-100"
                                      : "bg-ink-950/30 opacity-0 group-hover:opacity-100",
                                  ].join(" ")}
                                >
                                  <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden>
                                    <path d="M7 4.5v13L18 11 7 4.5z" fill="#fff" />
                                  </svg>
                                </span>
                              </span>

                              {/* Numer + czas + tytuł */}
                              <span className="min-w-0 flex-1">
                                <span
                                  className={[
                                    "flex items-center gap-2 text-[11px] font-semibold tabular-nums",
                                    isActive ? "text-brand-300" : "text-ink-300",
                                  ].join(" ")}
                                >
                                  Lekcja {String(lesson.n).padStart(2, "0")}
                                  <span className="text-ink-500">·</span>
                                  <span className="font-normal text-ink-400">
                                    {formatLessonLength(lesson.durationSec)}
                                  </span>
                                </span>
                                <span
                                  className={[
                                    "mt-0.5 line-clamp-2 text-[14.5px] font-medium",
                                    isActive ? "text-white" : "text-ink-100",
                                  ].join(" ")}
                                >
                                  {lesson.title}
                                </span>
                              </span>

                              {/* Status */}
                              <span className="shrink-0 pr-1">
                                {isActive ? (
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-300">
                                    Teraz
                                  </span>
                                ) : isWatched ? (
                                  <span
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-400/15 text-brand-300"
                                    title="Obejrzane"
                                    aria-label="Obejrzane"
                                  >
                                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                                      <path
                                        d="M3 8.5l3 3 7-7"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/12 text-ink-300 opacity-0 transition-opacity group-hover:opacity-100"
                                    aria-hidden
                                  >
                                    <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                                      <path d="M7 4.5v13L18 11 7 4.5z" fill="currentColor" />
                                    </svg>
                                  </span>
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          <p className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 text-[13px] leading-relaxed text-ink-300">
            Kolejne lekcje dodajemy na bieżąco - znajdziesz je w tym samym
            miejscu, gdy tylko trafią do kursu.
          </p>
        </div>

        {/* Slot na sekcję dodatkową (newsletter) */}
        {children}
      </div>

      {/* ====== MODAL: potwierdzenie resetu postępu ====== */}
      {confirmResetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          aria-describedby="reset-modal-desc"
        >
          {/* Tło - klik zamyka */}
          <button
            type="button"
            aria-label="Zamknij"
            onClick={() => setConfirmResetOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink-950/70 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-ink-900 p-6 shadow-[var(--shadow-cinematic)]">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-400/12 text-accent-400">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M3.5 8a4.5 4.5 0 1 1 1.3 3.2M3.5 8V5m0 3h3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <h2
              id="reset-modal-title"
              className="mt-4 font-display text-[1.5rem] leading-tight text-white"
            >
              Wyzerować postęp?
            </h2>
            <p
              id="reset-modal-desc"
              className="mt-2 text-[14px] leading-relaxed text-ink-300"
            >
              Usuniemy oznaczenia obejrzanych lekcji i zapisane miejsca
              odtwarzania na tym urządzeniu. Samych filmów to nie dotyczy -
              dostęp do kursu zostaje.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-white/12 px-4 py-2.5 text-[13.5px] font-medium text-ink-200 transition-colors hover:bg-white/[0.05]"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={doResetProgress}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-500 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-accent-400"
              >
                Wyzeruj postęp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
