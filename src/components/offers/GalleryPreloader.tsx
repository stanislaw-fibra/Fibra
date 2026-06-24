"use client";

import { useEffect } from "react";

/**
 * Cichy preload zdjęć galerii do cache PRZEGLĄDARKI - żeby po otwarciu lightboxa
 * obraz był natychmiast, bez „kółka".
 *
 * Kontekst: wygrzewanie (`/api/warm-images`) przyspiesza SERWER (Vercel oddaje gotowy
 * AVIF z cache), ale przeglądarka i tak pobiera każde zdjęcie dopiero w momencie
 * otwarcia go w lightboxie - stąd krótkie kółko przy 1. otwarciu/przewinięciu. Na
 * stronie oferty user najpierw ogląda film, więc mamy „darmowy" czas, żeby w tle
 * ściągnąć całą galerię. Gdy potem otworzy podgląd - wszystko jest już w cache.
 *
 * KLUCZ: preload musi trafić DOKŁADNIE w ten sam wariant, którego użyje lightbox,
 * inaczej cache się nie zgodzi. Dlatego odtwarzamy 1:1 `srcset`/`sizes`/`src`, jakie
 * generuje tam `next/image` (zweryfikowane na żywo: deviceSizes + q=90 + te same
 * `sizes`). Przeglądarka, mając identyczny `srcset`+`sizes`, wybierze i pobierze ten
 * sam plik, co potem realny `<Image>` w lightboxie.
 *
 * BEZPIECZNIE dla wydajności i transferu:
 *  - start dopiero w bezczynności (`requestIdleCallback`) / po krótkiej zwłoce, żeby
 *    NIE konkurować z filmem hero i LCP,
 *  - niski priorytet sieciowy (`fetchPriority="low"`),
 *  - throttling (kilka równoległych), nie zalewamy łącza,
 *  - SZANUJEMY tryb oszczędzania danych / wolne łącze (Save-Data, 2g) - wtedy NIE
 *    preloadujemy (użytkownik mobilny nie płaci za dane, których może nie obejrzeć),
 *  - rozsądny limit liczby zdjęć (bardzo długie galerie dociągną resztę na żądanie).
 */

// Domyślne `deviceSizes` next/image (next.config.ts ich nie nadpisuje) - muszą się
// zgadzać z tym, co next emituje w `srcset`, żeby cache trafił. Zweryfikowane w DOM.
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const QUALITY = 90;
// Te same `sizes` co `<Image>` w GalleryLightbox (wariant nie-landscape = 99% przypadków).
const LIGHTBOX_SIZES = "(min-width: 1280px) 1240px, 95vw";
const MAX_PRELOAD = 40; // bezpiecznik dla bardzo długich galerii
const CONCURRENCY = 3;

function optimizedUrl(src: string, w: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${QUALITY}`;
}

function buildSrcSet(src: string): string {
  return DEVICE_SIZES.map((w) => `${optimizedUrl(src, w)} ${w}w`).join(", ");
}

type Conn = {
  saveData?: boolean;
  effectiveType?: string;
};

export function GalleryPreloader({ images }: { images: string[] }) {
  useEffect(() => {
    if (!images || images.length === 0) return;
    if (typeof window === "undefined") return;

    // Szanuj oszczędzanie danych / wolne łącze - nie ściągaj na zapas.
    const conn = (navigator as unknown as { connection?: Conn }).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /(^|\b)(slow-2g|2g)\b/.test(conn.effectiveType)) return;

    const list = images.slice(0, MAX_PRELOAD);
    let cancelled = false;
    const objs: HTMLImageElement[] = [];
    let next = 0;
    let active = 0;

    const pump = () => {
      if (cancelled) return;
      while (active < CONCURRENCY && next < list.length) {
        const src = list[next++];
        const img = new Image();
        img.decoding = "async";
        // Niski priorytet - galeria poczeka, film/LCP mają pierwszeństwo.
        try {
          (img as unknown as { fetchPriority?: string }).fetchPriority = "low";
        } catch {
          /* starsze przeglądarki - ignoruj */
        }
        img.sizes = LIGHTBOX_SIZES;
        img.srcset = buildSrcSet(src);
        img.src = optimizedUrl(src, DEVICE_SIZES[DEVICE_SIZES.length - 1]); // fallback jak next
        active++;
        const done = () => {
          active--;
          pump();
        };
        img.onload = done;
        img.onerror = done;
        objs.push(img);
      }
    };

    // Odpal w bezczynności (po filmie/LCP), z fallbackiem na setTimeout.
    const ric = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    const cancelRic = (window as unknown as { cancelIdleCallback?: (h: number) => void })
      .cancelIdleCallback;
    let handle: number;
    if (ric) handle = ric(() => pump(), { timeout: 2500 });
    else handle = window.setTimeout(() => pump(), 1500);

    return () => {
      cancelled = true;
      if (ric && cancelRic) cancelRic(handle);
      else clearTimeout(handle);
      // Zerwij ewentualne trwające pobrania.
      for (const o of objs) {
        o.onload = null;
        o.onerror = null;
        o.src = "";
        o.srcset = "";
      }
    };
  }, [images]);

  return null;
}
