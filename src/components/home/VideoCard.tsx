"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { Offer } from "@/lib/offers";
import { priceShort } from "@/lib/offers";
import { VideoSoundIconButton } from "@/components/media/VideoSoundIconButton";
import { GridClipSurface } from "@/components/media/GridClipSurface";
import { useOptionalListVideoPlayback } from "@/components/media/ListVideoPlayback";
import { cloudflareStreamThumbnailUrl } from "@/lib/cloudflare-stream";
import { OfferTypeListingChip } from "@/components/offers/OfferTypeListingChip";

interface VideoCardProps {
  offer: Offer;
  index?: number;
  variant?: "primary" | "compact";
  /** Pierwszy plakat na liście (szybsze ładowanie miniatury) */
  priority?: boolean;
  showCardFooter?: boolean;
  showPrice?: boolean;
  visualOnly?: boolean;
  /** Hero strony głównej - typografia i obramowanie jak w sekcji „Aktualne oferty” */
  surfaceTheme?: "default" | "hero";
  /** Tailwind aspect klasa kafla mediów (domyślnie 9:16). Pozwala stronie hostującej
   *  spłaszczyć kafel w siatkach 2-kolumnowych mobile, gdzie 9:16 jest za wysokie. */
  aspectClass?: string;
}

export function VideoCard({
  offer,
  index = 0,
  variant = "primary",
  priority = false,
  showCardFooter = true,
  showPrice = true,
  visualOnly = false,
  surfaceTheme = "default",
  aspectClass = "aspect-[9/16]",
}: VideoCardProps) {
  const mediaShellRef = useRef<HTMLDivElement>(null);
  const playback = useOptionalListVideoPlayback();
  const [muted, setMuted] = useState(true);
  const [legacyInView, setLegacyInView] = useState(false);

  const hasVideo = !!offer.videoSrc || !!offer.streamId;
  const showFooter = showCardFooter && variant === "primary";
  const canToggleSound = !visualOnly && hasVideo;

  const clipPosterUrl = useMemo(() => {
    if (offer.streamId) {
      const u = cloudflareStreamThumbnailUrl(offer.streamId, { time: "1s", height: 600 });
      if (u) return u;
    }
    return offer.poster;
  }, [offer.streamId, offer.poster]);

  const activeSlug = playback?.activeSlug ?? null;
  const myIdx = playback ? playback.orderedSlugs.indexOf(offer.slug) : -1;
  const activeIdx =
    playback && activeSlug != null && activeSlug !== ""
      ? playback.orderedSlugs.indexOf(activeSlug)
      : -1;
  const distance =
    playback && myIdx >= 0 && activeIdx >= 0 ? Math.abs(myIdx - activeIdx) : Infinity;

  // Preload ring (ile `<video>` trzymamy w DOM bez niszczenia HLS):
  //  - desktop:    ±1 — hover zmienia często, szerszy ring zjada pasmo bez sensu.
  //  - mobile:     ±2 — kolejny klip zdąży się podciągnąć, zanim user do niego dotrze.
  //  - grid-first:  0 — w 2x2 grid mobile gra tylko 1 kafel, reszta to plakaty.
  const preloadRing = playback
    ? playback.isDesktop
      ? 1
      : playback.mobileMode === "grid-first"
        ? 0
        : 2
    : 0;
  const withinRing =
    !!playback && activeIdx >= 0 && myIdx >= 0 && distance <= preloadRing;

  const mountVideo = hasVideo && (playback ? withinRing : legacyInView);

  const isListActive = Boolean(
    playback && hasVideo && playback.activeSlug === offer.slug,
  );
  // Priming sąsiedniej karty tylko na mobile w trybach scrollowanych (viewport pokazuje
  // ~jeden klip naraz, więc wideo obok gra „w kulisach" muted — jak w Reels / TikTok).
  // Dla grid-first nie primujemy nikogo — w 2x2 wszystkie 4 są jednocześnie widoczne
  // i tylko pierwsza ma grać (reszta = plakaty).
  const primedNeighbor =
    !!playback &&
    !playback.isDesktop &&
    playback.mobileMode !== "grid-first" &&
    distance === 1 &&
    activeIdx >= 0;

  const playing =
    hasVideo && (playback ? isListActive || primedNeighbor : legacyInView);

  // Dopóki karta jest tylko primowana (neighbor), wymuszamy mute — dźwięk
  // odzywa się dopiero gdy karta faktycznie staje się aktywna.
  const effectiveMuted = isListActive ? muted : true;

  useEffect(() => {
    if (visualOnly || playback) return;
    const el = mediaShellRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const ok = e.isIntersecting && e.intersectionRatio > (priority ? 0.04 : 0.12);
          setLegacyInView(ok);
        });
      },
      { threshold: [0, 0.04, 0.08, 0.15, 0.35, 0.6, 1], rootMargin: priority ? "40px 0px 40px 0px" : "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [priority, visualOnly, playback]);

  useEffect(() => {
    if (visualOnly || !playback || playback.isDesktop) return;
    const target = mediaShellRef.current;
    if (!target) return;

    let io: IntersectionObserver | undefined;
    let raf1 = 0;
    let raf2 = 0;
    let attempts = 0;
    const maxAttempts = 80;

    const trySetup = () => {
      attempts += 1;
      if (attempts > maxAttempts) return;
      const rootEl =
        playback.mobileMode === "horizontal-scroll" ? playback.mobileRootRef?.current ?? null : null;
      if (playback.mobileMode === "horizontal-scroll" && !rootEl) {
        raf2 = window.requestAnimationFrame(trySetup);
        return;
      }
      const rootMargin =
        playback.mobileMode === "horizontal-scroll"
          ? "-10% -28% -10% -28%"
          : "-38% 0px -38% 0px";

      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            playback.reportVisibility(offer.slug, e.isIntersecting ? e.intersectionRatio : 0);
          }
        },
        {
          root: playback.mobileMode === "horizontal-scroll" ? rootEl : null,
          rootMargin,
          threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.35, 0.5, 0.65, 0.85, 1],
        },
      );
      io.observe(target);
    };

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(trySetup);
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      io?.disconnect();
    };
  }, [playback, offer.slug, visualOnly]);

  const onShellEnter = useCallback(() => {
    if (playback?.isDesktop) playback.onCardEnter(offer.slug);
  }, [playback, offer.slug]);

  const onShellLeave = useCallback(() => {
    if (playback?.isDesktop) playback.onCardLeave();
  }, [playback]);

  const isHero = surfaceTheme === "hero";
  /** Hero strony głównej: tytuł sklejony z kadrem filmu (overlay z gradientem na dole),
   *  zarówno na mobile, jak i desktop — większy kontrast i mniej „zlewających się" linijek pod kaflem. */
  const heroOverlayTitle = isHero && !showCardFooter;

  const shellClass = isHero
    ? [
        `relative ${aspectClass} w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-900 shadow-[var(--shadow-cinematic)]`,
        "transition-[box-shadow,transform] duration-300",
        "ring-1 ring-white/10 group-hover:ring-white/25 group-hover:shadow-[0_0_0_1px_rgba(242,101,34,0.2),var(--shadow-cinematic)]",
      ].join(" ")
    : `relative ${aspectClass} w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-800`;

  // Insety topRow są mniejsze na mobile (kafle 2x2 są wąskie - nie chcemy żeby
  // chip zajmował dużą część kadru). Klient zwracał uwagę, że dwa osobne chipy
  // (typ + transakcja) razem zasłaniały zbyt dużą powierzchnię filmu, więc
  // używamy teraz pojedynczej, zwartej pigułki.
  // pr-8 dodajemy tylko gdy mute button JEST FAKTYCZNIE widoczny (isListActive),
  // a nie wszędzie gdzie mamy video — wcześniej to obcinało chip na nieaktywnych kartach.
  const showMuteButton = canToggleSound && isListActive;
  const topRowClass = [
    isHero
      ? "absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 md:top-3.5 md:left-3.5 md:right-3.5"
      : "absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3",
    "flex items-start justify-between z-[3]",
    showMuteButton ? "pr-8 sm:pr-10 md:pr-11" : "",
  ].join(" ");

  // Tekst pod filmem — responsywny. Hero: zwięzły overlay-style. Non-hero (np. /oferty?view=video):
  // pełna premium-hierarchia: bold tytuł (Inter), wyraźny eyebrow, oddzielony separator pod metą + ceną,
  // pełny przycisk-pill jako CTA. Klient zwracał uwagę, że wcześniej tekst pod kartą się „zlewał".
  const textWrapClass = isHero
    ? "pt-2 sm:pt-3 md:pt-3.5"
    : "pt-4 sm:pt-5 md:pt-6 px-0.5";
  const eyebrowClass = isHero
    ? "text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-white/55"
    : "text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.18em] text-brand-700";
  // Tytuł non-hero: Inter Bold (Instrument Serif jest tylko w 400, więc bold-display nie zadziała).
  // Większy rozmiar + tighter tracking = wyraźny zakotwicz wzroku.
  const titleTextClass = isHero
    ? "mt-1 font-display text-[12.5px] sm:text-[15px] md:text-[16.5px] leading-[1.18] sm:leading-[1.15] text-white line-clamp-2 text-balance"
    : "mt-2 font-sans text-[18px] sm:text-[20px] md:text-[22px] leading-[1.18] font-bold tracking-tight text-ink-950 line-clamp-2 text-balance group-hover:text-brand-600 transition-colors";
  const metaRowClass = isHero
    ? "mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-[11px] md:text-[11.5px] text-white/65 tabular-nums"
    : "mt-4 pt-3 border-t border-ink-200/70 flex items-end justify-between gap-3";
  const priceClass = isHero
    ? "font-medium text-white"
    : "font-bold text-[16px] md:text-[17px] text-ink-950 tabular-nums leading-none";

  const hoverArrowClass = isHero
    ? "mt-2 sm:mt-3 inline-flex items-center gap-1.5 text-[11.5px] sm:text-[12.5px] font-medium text-white/80 group-hover:text-accent-400 transition-colors"
    // Non-hero: pełny przycisk-pill, czarne tło, pomarańcz na hover. Klient ma jednoznaczny CTA.
    : "mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-ink-950 group-hover:bg-brand-500 text-white text-[12.5px] font-semibold px-4 py-2.5 transition-colors self-start";

  // Cała karta = jeden klikalny link do oferty (shell + tekst + szczegóły).
  // Dzięki temu klik w tytuł, cenę, miasto itp. też przenosi do oferty.
  return (
    <Link
      href={`/oferty/${offer.slug}`}
      aria-label={`Zobacz ofertę: ${offer.title}`}
      className="video-card group relative block rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
    >
      <div
        ref={mediaShellRef}
        className={shellClass}
        onMouseEnter={onShellEnter}
        onMouseLeave={onShellLeave}
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="video-card__glow absolute -inset-px rounded-[var(--radius-lg)] z-10"
            style={{
              background: "linear-gradient(135deg, rgba(0,90,148,0.3) 0%, rgba(242,101,34,0.2) 100%)",
              filter: "blur(1px)",
            }}
          />

          <div className="video-card__media absolute inset-0 h-full w-full">
            {visualOnly ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={offer.poster}
                alt={offer.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding={priority ? "sync" : "async"}
              />
            ) : hasVideo ? (
              <GridClipSurface
                title={offer.title}
                streamId={offer.streamId}
                videoSrc={offer.videoSrc}
                posterUrl={clipPosterUrl}
                mounted={mountVideo}
                playing={playing}
                muted={effectiveMuted}
                posterPriority={index === 0}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={offer.poster}
                alt={offer.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding={priority ? "sync" : "async"}
              />
            )}
          </div>

          {/* Górny gradient: czytelność numeru/„Nowość" na jasnych kadrach. */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink-950/55 via-ink-950/15 to-transparent z-[1] pointer-events-none" />

          <div className={topRowClass}>
            {/* Pojedynczy chip „[ikona] Mieszk. · Zakup" — gwarantowana jedna linijka,
                ~50% mniejszy ślad nad kadrem niż dwa osobne chipy. Numer indeksu został
                usunięty, bo był wizualnym szumem, a film ma być pierwszoplanowy. */}
            <OfferTypeListingChip
              kind={offer.kind}
              kindLabel={offer.kindLabel}
              listingType={offer.listingType}
              variant="media-dark"
            />
          </div>

          {heroOverlayTitle ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4]">
              {/* Mocniejszy, dłuższy gradient — żeby tytuł był pewnie widoczny nawet na jasnych
                  klatkach filmu. To jest „hook" zachęcający do kliknięcia (klient prosił
                  wielokrotnie, żeby tytuły nie umykały). */}
              <div
                className="absolute inset-x-0 bottom-0 h-[72%] sm:h-[66%] md:h-[60%] bg-gradient-to-t from-black via-black/72 to-transparent"
                aria-hidden
              />
              <div className="relative px-3 pb-3 pt-16 sm:px-4 sm:pb-4 sm:pt-20 md:px-5 md:pb-5 md:pt-24">
                {/* Tytuł: sans-serif (Inter) bold — Instrument Serif (font-display) jest dostępny
                    tylko w weight 400, więc dla prawdziwego „hooka" przełączamy na Inter Bold.
                    Mobile bumpnięty z 13.5 → 17 px (czytelne z dystansu trzymania telefonu),
                    desktop z 18-20 → 22-26 px (rzuca się w oczy w siatce 4-up). Cienie złożone:
                    drop-shadow daje kontur, text-shadow dodaje głębi nad zmiennym tłem filmu. */}
                <h3
                  className="font-sans text-left text-[17px] sm:text-[20px] md:text-[22px] lg:text-[24px] xl:text-[26px] leading-[1.12] font-bold tracking-tight text-white line-clamp-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7), 0 4px 14px rgba(0,0,0,0.55)" }}
                >
                  {offer.title}
                </h3>
                {/* Mikro-CTA jako część hooka — białe, drobne, ale wyraźnie sugeruje akcję.
                    Pojawia się tylko od sm w górę, żeby nie zaśmiecać kafla 2x2 na małym mobile. */}
                <span className="mt-1.5 hidden sm:inline-flex items-center gap-1.5 text-[11.5px] md:text-[12.5px] font-semibold uppercase tracking-[0.16em] text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                  Zobacz ofertę
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {canToggleSound && isListActive && (
          <div className="pointer-events-auto absolute top-2.5 right-2.5 z-[50] md:top-3 md:right-3">
            <VideoSoundIconButton
              muted={muted}
              onToggle={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMuted((m) => !m);
              }}
            />
          </div>
        )}
      </div>

      {heroOverlayTitle ? (
        // Pod kaflem hero — wyraźny wiersz: typ + lokalizacja · metraż · cena.
        // Kontrast podbity (white/95 zamiast 65) — klient zwracał uwagę, że szare napisy
        // są nieczytelne, więc redukujemy szarość do minimum.
        <div className="px-1 pt-2 sm:pt-2.5 md:pt-3">
          <div className="flex items-center justify-between gap-2 text-[11.5px] sm:text-[12px] md:text-[12.5px] tabular-nums">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="truncate text-white">
                <span className="font-semibold">{offer.kindLabel}</span>
                <span className="text-white/80">{` · ${offer.city}`}</span>
                {offer.district ? (
                  <span className="hidden sm:inline text-white/75">{` · ${offer.district}`}</span>
                ) : null}
              </span>
            </span>
            <span className="font-semibold text-white shrink-0">
              {offer.area} m²
              {offer.rooms ? <span className="hidden sm:inline font-medium text-white/85">{` · ${offer.rooms} pok.`}</span> : null}
            </span>
          </div>
          {showPrice && offer.priceFrom ? (
            <p className="mt-0.5 text-right text-[11.5px] sm:text-[12px] md:text-[12.5px] font-semibold text-accent-300 tabular-nums">
              {priceShort(offer.priceFrom)}
            </p>
          ) : null}
        </div>
      ) : null}

      {!visualOnly && !heroOverlayTitle && (
        <div className={textWrapClass}>
          <p className={eyebrowClass}>
            {/* Non-hero: cały eyebrow ma tę samą wagę (nie wyróżniamy kategorii dodatkowo,
                bo chip kategorii już jest na kafelku). Hero zostaje z białym kontrastem. */}
            {isHero ? (
              <>
                <span className="text-white">{offer.kindLabel}</span>
                {" · "}
                {offer.city}
                {offer.district ? ` · ${offer.district}` : ""}
              </>
            ) : (
              <>
                {offer.kindLabel}
                {" · "}
                {offer.city}
                {offer.district ? ` · ${offer.district}` : ""}
              </>
            )}
          </p>
          <h3 className={titleTextClass}>{offer.title}</h3>

          {showFooter && !isHero && offer.excerpt && (
            // Excerpt: ciemniejszy ink-700 (lepszy kontrast), nieco większy lh, więcej mt
            // dla wizualnego oddechu między tytułem a opisem.
            <p className="mt-3 text-[14px] sm:text-[14.5px] text-ink-700 leading-[1.6] line-clamp-2 text-pretty">
              {offer.excerpt}
            </p>
          )}

          <div className={metaRowClass}>
            {isHero ? (
              <>
                <span>
                  {offer.area} m²{offer.rooms ? ` · ${offer.rooms} pok.` : ""}
                </span>
                {showPrice && offer.priceFrom ? (
                  <span className={priceClass}>{priceShort(offer.priceFrom)}</span>
                ) : null}
              </>
            ) : (
              // Non-hero: meta i cena z większym kontrastem i wyraźniejszą hierarchią.
              // Cena jest drugą informacją po tytule, której wzrok szuka — boldujemy ją mocno.
              <>
                <span className="text-[13px] sm:text-[13.5px] font-medium text-ink-700 tabular-nums">
                  {offer.area} m²{offer.rooms ? ` · ${offer.rooms} pok.` : ""}
                </span>
                {showPrice && offer.priceFrom ? (
                  <span className={priceClass}>{priceShort(offer.priceFrom)}</span>
                ) : null}
              </>
            )}
          </div>

          {showFooter && !isHero && (
            <span className={hoverArrowClass}>
              Zobacz ofertę
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
