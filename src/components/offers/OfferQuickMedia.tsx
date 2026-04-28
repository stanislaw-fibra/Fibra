"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { OfferMatterport } from "@/components/offers/OfferMatterport";
import { youtubeEmbedUrl } from "@/components/offers/OfferHeroMedia";
import { pickFloorPlanImageFromGallery } from "@/lib/offers";

const ease = [0.22, 1, 0.36, 1] as const;

type ModalKind = "tour" | "floor" | "floor-choice" | "youtube";

function youtubeVideoId(raw: string): string | null {
  try {
    const u = new URL(raw);
    let id: string | null = null;
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace(/^\//, "");
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v");
      if (!id && u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] || null;
      if (!id && u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] || null;
    }
    return id?.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}

type Props = {
  offerTitle: string;
  virtualTourUrl?: string;
  /** Z parametru Galactica / raw_params (priorytet nad heurystyką z galerii). */
  floorPlanImageUrl?: string;
  /** PDF rzutu (panel/admin) — otwierany w nowej karcie. */
  floorPlanPdfUrl?: string;
  floorPlanImages?: string[];
  floorPlanPdfs?: { url: string; label?: string }[];
  gallery?: string[];
  youtubeUrl?: string;
};

export function OfferQuickMedia({
  offerTitle,
  virtualTourUrl,
  floorPlanImageUrl: floorPlanFromParams,
  floorPlanPdfUrl,
  floorPlanImages,
  floorPlanPdfs,
  gallery,
  youtubeUrl: youtubeUrlProp,
}: Props) {
  const labelId = useId();
  const [open, setOpen] = useState<ModalKind | null>(null);
  const [mounted, setMounted] = useState(false);
  const [floorIdx, setFloorIdx] = useState(0);

  const floorImages = useMemo(() => {
    const fromDb = (floorPlanImages ?? []).map((x) => x?.trim()).filter(Boolean) as string[];
    const primary = floorPlanFromParams?.trim();
    const merged = primary ? [primary, ...fromDb.filter((u) => u !== primary)] : fromDb;
    if (merged.length) return merged;
    const fromGallery = pickFloorPlanImageFromGallery(gallery);
    return fromGallery ? [fromGallery] : [];
  }, [floorPlanImages, floorPlanFromParams, gallery]);

  const floorPdfsResolved = useMemo(() => {
    const list = (floorPlanPdfs ?? []).filter((x) => x && x.url?.trim()).map((x) => ({
      url: x.url.trim(),
      label: x.label?.trim() || "PDF",
    }));
    const primary = floorPlanPdfUrl?.trim();
    if (primary && !list.some((x) => x.url === primary)) {
      return [{ url: primary, label: "PDF" }, ...list];
    }
    return list;
  }, [floorPlanPdfs, floorPlanPdfUrl]);

  const resolvedFloorUrl = useMemo(() => {
    return floorImages[floorIdx] ?? null;
  }, [floorImages, floorIdx]);

  const youtubeEmbed = useMemo(() => {
    const raw = youtubeUrlProp?.trim();
    if (!raw) return null;
    return youtubeEmbedUrl(raw);
  }, [youtubeUrlProp]);

  const youtubeThumb = useMemo(() => {
    const raw = youtubeUrlProp?.trim();
    if (!raw) return null;
    const id = youtubeVideoId(raw);
    if (!id) return null;
    return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }, [youtubeUrlProp]);

  const hasTour = Boolean(virtualTourUrl?.trim());
  const hasFloorImage = floorImages.length > 0;
  const hasFloorPdf = floorPdfsResolved.length > 0;
  const hasFloor = hasFloorImage || hasFloorPdf;
  const hasYoutube = Boolean(youtubeEmbed);

  const close = useCallback(() => setOpen(null), []);

  const prevFloor = useCallback(() => {
    if (floorImages.length <= 1) return;
    setFloorIdx((i) => (i - 1 + floorImages.length) % floorImages.length);
  }, [floorImages.length]);

  const nextFloor = useCallback(() => {
    if (floorImages.length <= 1) return;
    setFloorIdx((i) => (i + 1) % floorImages.length);
  }, [floorImages.length]);

  const openPdf = useCallback(() => {
    const first = floorPdfsResolved[0]?.url;
    if (!first) return;
    window.open(first, "_blank", "noopener,noreferrer");
  }, [floorPdfsResolved]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (open === "floor") {
        if (e.key === "ArrowLeft") prevFloor();
        if (e.key === "ArrowRight") nextFloor();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  useEffect(() => {
    if (open !== "floor") return;
    setFloorIdx(0);
  }, [open]);

  const modal =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                key="offer-media-modal-root"
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease }}
                className="fixed inset-0 z-[280] flex items-center justify-center p-2 sm:p-4 md:p-6"
              >
                <motion.button
                  type="button"
                  aria-label="Zamknij"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-ink-950/72 backdrop-blur-sm"
                  onClick={close}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 12 }}
                  transition={{ duration: 0.32, ease }}
                  className="relative z-[1] flex h-[min(94dvh,960px)] w-[min(96vw,1440px)] max-w-[96vw] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-ink-200/90 bg-paper shadow-[var(--shadow-cinematic)]"
                >
                  <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink-200/70 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="min-w-0">
                      <p
                        id={labelId}
                        className="font-display text-[clamp(1.1rem,2.5vw,1.35rem)] text-ink-950 leading-tight truncate"
                      >
                        {open === "tour"
                          ? "Spacer 3D"
                          : open === "floor"
                            ? "Rzut 3D"
                            : open === "floor-choice"
                              ? "Rzut"
                              : "Film z nieruchomości"}
                      </p>
                      <p className="mt-0.5 text-[12px] sm:text-[13px] text-ink-600 line-clamp-2">{offerTitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-paper text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-950 hover:text-white"
                      aria-label="Zamknij panel"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-5 md:p-6">
                    {open === "tour" && virtualTourUrl ? (
                      <OfferMatterport
                        url={virtualTourUrl}
                        title={`Spacer 3D — ${offerTitle}`}
                        embedImmediately
                        layoutVariant="modal"
                      />
                    ) : null}
                    {open === "floor" && resolvedFloorUrl ? (
                      <div className="flex h-full flex-col gap-3">
                        {floorImages.length > 1 ? (
                          <div className="shrink-0 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {floorImages.map((u, i) => (
                              <button
                                key={`${u}-${i}`}
                                type="button"
                                onClick={() => setFloorIdx(i)}
                                aria-label={`Pokaż rzut ${i + 1}`}
                                className={[
                                  "shrink-0 rounded-[var(--radius-md)] border overflow-hidden bg-ink-100",
                                  i === floorIdx ? "border-ink-950" : "border-ink-200 hover:border-ink-400",
                                ].join(" ")}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={u}
                                  alt=""
                                  className="h-14 w-24 object-cover"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              </button>
                            ))}
                          </div>
                        ) : null}

                        <div className="relative min-h-0 flex-1 w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-100 p-2 ring-1 ring-ink-200/70">
                          {/* eslint-disable-next-line @next/next/no-img-element -- dowolny URL z galerii / CRM */}
                          <img
                            src={resolvedFloorUrl}
                            alt={`Rzut 3D — ${offerTitle}`}
                            className="h-full w-full object-contain"
                            referrerPolicy="no-referrer"
                          />

                          {floorImages.length > 1 ? (
                            <>
                              <button
                                type="button"
                                onClick={prevFloor}
                                aria-label="Poprzedni rzut"
                                className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink-950/65 text-white backdrop-blur-sm ring-1 ring-white/15 hover:bg-ink-950/80 transition-colors"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                                  <path d="M10 3.5L5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={nextFloor}
                                aria-label="Następny rzut"
                                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink-950/65 text-white backdrop-blur-sm ring-1 ring-white/15 hover:bg-ink-950/80 transition-colors"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                                  <path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {open === "floor-choice" ? (
                      <div className="flex min-h-[min(78dvh,820px)] w-full items-center justify-center rounded-[var(--radius-lg)] bg-paper-warm/60 p-4 ring-1 ring-ink-200/70 sm:min-h-[min(80dvh,840px)]">
                        <div className="w-full max-w-md space-y-3">
                          <p className="text-center text-[12px] uppercase tracking-[0.14em] text-ink-500">
                            Wybierz format
                          </p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => setOpen("floor")}
                              className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-ink-200/90 bg-paper px-4 py-3.5 text-left shadow-[var(--shadow-soft)] transition-all hover:border-brand-400 hover:shadow-md active:scale-[0.99]"
                            >
                              <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Zdjęcie</span>
                                <span className="truncate text-[15px] font-medium text-ink-900">Otwórz podgląd</span>
                              </span>
                              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-paper-warm text-ink-900 transition-colors group-hover:border-brand-400 group-hover:bg-brand-50">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                                  <rect x="2.5" y="3.5" width="11" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.25" />
                                  <path d="M2.5 6.5h11M6 3.5v10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                                </svg>
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                openPdf();
                                close();
                              }}
                              className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-ink-200/90 bg-paper px-4 py-3.5 text-left shadow-[var(--shadow-soft)] transition-all hover:border-brand-400 hover:shadow-md active:scale-[0.99]"
                            >
                              <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">PDF</span>
                                <span className="truncate text-[15px] font-medium text-ink-900">Otwórz w nowej karcie</span>
                              </span>
                              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-950 text-white transition-colors group-hover:bg-brand-500">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                                  <path d="M6.25 2.5h3.5l2.75 2.75v7.5A1.75 1.75 0 0 1 10.75 14.5h-4.5A1.75 1.75 0 0 1 4.5 12.75v-8.5A1.75 1.75 0 0 1 6.25 2.5Z" stroke="currentColor" strokeWidth="1.25" />
                                  <path d="M9.75 2.75V5.5H12.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            </button>
                          </div>
                          {floorPdfsResolved.length > 1 ? (
                            <div className="pt-2">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 mb-2">
                                PDF-y
                              </p>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {floorPdfsResolved.map((p, i) => (
                                  <a
                                    key={`${p.url}-${i}`}
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-paper px-4 py-2 text-[12.5px] font-medium text-ink-800 hover:border-ink-400 hover:text-ink-950 transition-colors"
                                  >
                                    {p.label || `PDF ${i + 1}`}
                                  </a>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {open === "youtube" && youtubeEmbed ? (
                      <div className="relative w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-950 ring-1 ring-ink-200/60 shadow-[var(--shadow-cinematic)]">
                        <div className="relative aspect-video w-full max-h-[min(76dvh,820px)]">
                          <iframe
                            src={`${youtubeEmbed}&autoplay=1`}
                            title={`Film z nieruchomości — ${offerTitle}`}
                            className="absolute inset-0 h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        </div>
                        {youtubeUrlProp ? (
                          <p className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-200/70 bg-paper-warm/50 px-4 py-3 text-[12px] text-ink-600">
                            <span>Film z kanału YouTube.</span>
                            <a
                              href={youtubeUrlProp}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 font-medium text-ink-800 transition-colors hover:text-brand-600"
                            >
                              Otwórz na YouTube
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                                <path d="M4.5 2.5H2.5v7h7V7.5M7 2.5h2.5V5M5.5 6.5l4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </a>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null;

  if (!hasTour && !hasFloor && !hasYoutube) {
    return null;
  }

  const buttonGridClass =
    [hasTour, hasFloor, hasYoutube].filter(Boolean).length >= 3
      ? "mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      : "mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2";

  return (
    <>
      <div className={buttonGridClass}>
        {hasTour ? (
          <button
            type="button"
            onClick={() => setOpen("tour")}
            className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-ink-200/90 bg-paper px-4 py-3.5 text-left shadow-[var(--shadow-soft)] transition-all hover:border-brand-400 hover:shadow-md active:scale-[0.99]"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Spacer 3D</span>
              <span className="truncate text-[15px] font-medium text-ink-900">Otwórz wirtualny spacer</span>
            </span>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-950 text-white transition-colors group-hover:bg-brand-500">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M8 2.5L13.5 5.75v4.5L8 13.5 2.5 10.25v-4.5L8 2.5z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <path d="M8 2.5v11M8 8l5.5-2.25M8 8L2.5 5.75M8 8l5.5 2.25M8 8L2.5 10.25" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" opacity="0.7" />
              </svg>
            </span>
          </button>
        ) : null}
        {hasFloor ? (
          <button
            type="button"
            onClick={() => {
              if (hasFloorPdf && !hasFloorImage) {
                openPdf();
                return;
              }
              if (hasFloorPdf && hasFloorImage) {
                setOpen("floor-choice");
                return;
              }
              setOpen("floor");
            }}
            className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-ink-200/90 bg-paper px-4 py-3.5 text-left shadow-[var(--shadow-soft)] transition-all hover:border-brand-400 hover:shadow-md active:scale-[0.99]"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Rzut 3D</span>
              <span className="truncate text-[15px] font-medium text-ink-900">
                {hasFloorPdf && !hasFloorImage ? "Otwórz rzut PDF" : "Zobacz układ pomieszczeń"}
              </span>
            </span>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-paper-warm text-ink-900 transition-colors group-hover:border-brand-400 group-hover:bg-brand-50">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="2.5" y="3.5" width="11" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.25" />
                <path d="M2.5 6.5h11M6 3.5v10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        ) : null}
        {hasYoutube ? (
          <button
            type="button"
            onClick={() => setOpen("youtube")}
            className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-ink-200/90 bg-paper px-4 py-3.5 text-left shadow-[var(--shadow-soft)] transition-all hover:border-brand-400 hover:shadow-md active:scale-[0.99]"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Film</span>
              <span className="truncate text-[15px] font-medium text-ink-900">Zobacz film z nieruchomości</span>
            </span>
            <span
              className={[
                // Mobile: okrągła „ikonka” (jak teraz). Desktop: prostokątna miniatura, żeby faktycznie było widać kadr.
                "relative inline-flex h-10 w-10 md:h-12 md:w-20 shrink-0 items-center justify-center overflow-hidden",
                "rounded-full md:rounded-[var(--radius-sm)]",
                youtubeThumb ? "ring-1 ring-ink-200 bg-ink-100" : "bg-ink-950 text-white",
                "transition-colors group-hover:ring-brand-300 group-hover:bg-[#FF0033]",
              ].join(" ")}
              aria-hidden
            >
              {youtubeThumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={youtubeThumb}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
              ) : null}
              <span className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={[
                  "relative z-[1] translate-x-[0.5px]",
                  youtubeThumb ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" : "text-white",
                ].join(" ")}
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        ) : null}
      </div>

      {modal}
    </>
  );
}
