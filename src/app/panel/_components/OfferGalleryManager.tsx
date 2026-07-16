"use client";

import { Reorder, useDragControls } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  deleteOfferImageAction,
  markGalleryImageAsFloorPlanAction,
  reorderOfferImagesAction,
  unmarkGalleryImageAsFloorPlanAction,
} from "@/app/panel/actions/offers";

type Img = { id: string; image_url: string };

type Props = {
  offerId: string;
  images: Img[];
  /** URL-e zdjęć już oznaczonych jako rzut (żeby pokazać „Rzut ✓" zamiast „Oznacz jako rzut"). */
  floorplanImageUrls: string[];
};

/**
 * Zarządzanie galerią zdjęć oferty: przeciąganie zmienia kolejność (framer-motion,
 * działa też dotykiem na tablecie), a przy każdym wierszu zostają akcje oznaczenia rzutu
 * i usunięcia. Kolejność zapisuje się automatycznie po upuszczeniu zdjęcia -
 * `reorderOfferImagesAction` przepisuje `order_index` i ustawia pierwsze zdjęcie jako
 * główne (miniatura karty/oferty).
 *
 * Układ jednokolumnowy (poziome wiersze) celowo: przeciąganie w pionie jest wtedy
 * przewidywalne, w przeciwieństwie do siatki wielokolumnowej.
 */
export function OfferGalleryManager({ offerId, images, floorplanImageUrls }: Props) {
  const [items, setItems] = useState<Img[]>(images);
  const savedOrderRef = useRef<string>(images.map((i) => i.id).join(","));
  const [phase, setPhase] = useState<"idle" | "saving" | "saved">("idle");

  // Gdy serwer odświeży dane (po usunięciu / oznaczeniu rzutu), przyjmij nową listę
  // jako bazową kolejność - inaczej lokalny stan rozjechałby się z bazą.
  useEffect(() => {
    setItems(images);
    savedOrderRef.current = images.map((i) => i.id).join(",");
  }, [images]);

  const fpSet = new Set(floorplanImageUrls);

  async function persist(order: Img[]) {
    const orderStr = order.map((i) => i.id).join(",");
    if (orderStr === savedOrderRef.current) return;
    setPhase("saving");
    const fd = new FormData();
    fd.set("offer_id", offerId);
    fd.set("ordered_ids", orderStr);
    await reorderOfferImagesAction(fd);
    savedOrderRef.current = orderStr;
    setPhase("saved");
    window.setTimeout(() => setPhase((p) => (p === "saved" ? "idle" : p)), 2500);
  }

  if (items.length === 0) {
    return <p className="text-[13px] text-ink-300">Brak zdjęć.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[12px] text-ink-300">
          Przeciągnij zdjęcie za uchwyt <span className="text-ink-100">⠿</span>, żeby zmienić kolejność. Pierwsze zdjęcie jest główne
          (miniatura na liście ofert i w ofercie).
        </p>
        <span className="text-[12px] font-semibold text-emerald-300 min-w-[92px] text-right">
          {phase === "saving" ? "Zapisywanie…" : phase === "saved" ? "Zapisano ✓" : ""}
        </span>
      </div>

      <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2.5 list-none">
        {items.map((im, idx) => (
          <GalleryRow
            key={im.id}
            offerId={offerId}
            im={im}
            index={idx}
            isFloorplan={fpSet.has(im.image_url?.trim())}
            onSettled={() => persist(items)}
          />
        ))}
      </Reorder.Group>
    </div>
  );
}

function GalleryRow({
  offerId,
  im,
  index,
  isFloorplan,
  onSettled,
}: {
  offerId: string;
  im: Img;
  index: number;
  isFloorplan: boolean;
  onSettled: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={im}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onSettled}
      className="flex items-stretch gap-3 rounded-lg border border-white/10 bg-ink-900/50 overflow-hidden"
    >
      {/* Uchwyt - tylko stąd startuje drag, żeby nie kolidował z przyciskami akcji. */}
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="shrink-0 px-2 flex items-center justify-center text-ink-500 hover:text-white cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
        title="Przeciągnij, aby zmienić kolejność"
        aria-label="Przeciągnij, aby zmienić kolejność"
      >
        <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden>
          <circle cx="4" cy="3" r="1.3" /><circle cx="10" cy="3" r="1.3" />
          <circle cx="4" cy="9" r="1.3" /><circle cx="10" cy="9" r="1.3" />
          <circle cx="4" cy="15" r="1.3" /><circle cx="10" cy="15" r="1.3" />
        </svg>
      </button>

      <div className="relative h-[68px] w-[92px] shrink-0 bg-ink-800 self-center rounded-md overflow-hidden">
        <Image src={im.image_url} alt="" fill className="object-cover" sizes="92px" unoptimized />
      </div>

      <div className="min-w-0 flex-1 flex items-center justify-between gap-3 py-2 pr-3 text-[12px] text-ink-300">
        <span className="shrink-0">
          #{index + 1}
          {index === 0 ? " · główne" : ""}
          {isFloorplan ? " · rzut" : ""}
        </span>
        <div className="flex items-center gap-3">
          {isFloorplan ? (
            <div className="flex items-center gap-2">
              <span className="text-emerald-300">Rzut ✓</span>
              <form action={unmarkGalleryImageAsFloorPlanAction}>
                <input type="hidden" name="image_id" value={im.id} />
                <input type="hidden" name="offer_id" value={offerId} />
                <button
                  type="submit"
                  className="text-ink-300 hover:text-white underline underline-offset-2 transition-colors"
                  title="Cofnij oznaczenie - zdjęcie wróci do zwykłej galerii, plik zostaje nietknięty"
                >
                  Odznacz
                </button>
              </form>
            </div>
          ) : (
            <form action={markGalleryImageAsFloorPlanAction}>
              <input type="hidden" name="image_id" value={im.id} />
              <input type="hidden" name="offer_id" value={offerId} />
              <button
                type="submit"
                className="text-brand-300 hover:text-brand-200 transition-colors"
                title="Przenieś to zdjęcie do kafelka „Rzut” na stronie oferty"
              >
                Oznacz jako rzut
              </button>
            </form>
          )}
          <form action={deleteOfferImageAction}>
            <input type="hidden" name="image_id" value={im.id} />
            <input type="hidden" name="offer_id" value={offerId} />
            <button type="submit" className="text-accent-400 hover:text-accent-300 transition-colors">
              Usuń
            </button>
          </form>
        </div>
      </div>
    </Reorder.Item>
  );
}
