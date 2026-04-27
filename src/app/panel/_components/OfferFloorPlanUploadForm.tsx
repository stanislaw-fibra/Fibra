"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteOfferFloorPlanImageAction,
  deleteOfferFloorPlanPdfAction,
  uploadOfferFloorPlanImageAction,
  uploadOfferFloorPlanPdfAction,
} from "@/app/panel/actions/offers";

type Props = {
  offerId: string;
  galacticaOfferId: string;
  images: { id: string; url: string; label: string | null }[];
  pdfs: { id: string; url: string; label: string | null }[];
};

export function OfferFloorPlanUploadForm({
  offerId,
  galacticaOfferId,
  images,
  pdfs,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [imageDragOver, setImageDragOver] = useState(false);
  const [pdfDragOver, setPdfDragOver] = useState(false);

  const imagePreviews = useMemo(() => {
    return imageFiles.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFiles]);

  useEffect(() => {
    return () => {
      for (const p of imagePreviews) URL.revokeObjectURL(p.url);
    };
  }, [imagePreviews]);

  function setNativeInputFiles(input: HTMLInputElement | null, files: File[]) {
    if (!input) return;
    try {
      const dt = new DataTransfer();
      for (const f of files) dt.items.add(f);
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } catch {
      // Some browsers restrict programmatic assignment; we still keep previews in state.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-[var(--radius-md)] border border-white/10 bg-ink-900/35 p-5">
        <h3 className="text-[14px] font-medium text-white leading-snug">Zdjęcie rzutu</h3>
        <p className="mt-2 text-[13px] text-ink-400 leading-relaxed">
          JPG, PNG, WebP.
        </p>

        {images.length > 0 ? (
          <div className="mt-4 space-y-2">
            {images.map((im, i) => (
              <div key={im.id} className="rounded-lg border border-white/10 bg-ink-950/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] text-ink-400 break-all">
                      {i === 0 ? "Główne:" : "Dodatkowe:"} {im.label || im.url}
                    </p>
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-ink-900/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={im.url} alt="" className="w-full max-h-[320px] object-contain" loading="lazy" />
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <a
                        href={im.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-[12px] font-medium text-white px-4 py-2 transition-colors"
                      >
                        Otwórz
                      </a>
                      <form action={deleteOfferFloorPlanImageAction}>
                        <input type="hidden" name="offer_id" value={offerId} />
                        <input type="hidden" name="floorplan_id" value={im.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-accent-400/30 bg-accent-400/10 hover:bg-accent-400/15 text-[12px] font-medium text-accent-300 px-4 py-2 transition-colors"
                        >
                          Usuń
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <form action={uploadOfferFloorPlanImageAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="offer_id" value={offerId} />
          <input type="hidden" name="galactica_offer_id" value={galacticaOfferId} />
          <div
            className={[
              "relative rounded-[var(--radius-md)] border border-dashed px-4 py-5 transition-colors",
              imageDragOver
                ? "border-brand-400 bg-brand-500/10"
                : "border-white/20 bg-ink-950/30 hover:border-white/35 hover:bg-white/5",
            ].join(" ")}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setImageDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setImageDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setImageDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setImageDragOver(false);
              const list = Array.from(e.dataTransfer.files ?? []).filter((f) => f.type.startsWith("image/"));
              if (!list.length) return;
              setImageFiles(list);
              setNativeInputFiles(imageInputRef.current, list);
            }}
          >
            <p className="text-[13px] text-ink-300">
              Przeciągnij i upuść zdjęcia tutaj lub kliknij, aby wybrać.
            </p>
            <input
              ref={imageInputRef}
              name="file"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                setImageFiles(list);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          {imagePreviews.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-ink-950/40 p-3">
              <p className="text-[12px] text-ink-300">Wybrane pliki ({imagePreviews.length})</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {imagePreviews.map((p) => (
                  <div key={p.url} className="rounded-lg overflow-hidden border border-white/10 bg-ink-900/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="h-24 w-full object-cover" />
                    <div className="px-2 py-2">
                      <p className="text-[11px] text-ink-400 break-all line-clamp-2">{p.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={imageFiles.length === 0}
            className="self-start rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[13px] font-medium px-6 py-2.5 transition-colors"
          >
            Dodaj zdjęcia
          </button>
        </form>
      </div>

      <div className="rounded-[var(--radius-md)] border border-white/10 bg-ink-900/35 p-5">
        <h3 className="text-[14px] font-medium text-white leading-snug">PDF rzutu</h3>
        <p className="mt-2 text-[13px] text-ink-400 leading-relaxed">
          PDF.
        </p>

        {pdfs.length > 0 ? (
          <div className="mt-4 space-y-2">
            {pdfs.map((p, i) => (
              <div key={p.id} className="rounded-lg border border-white/10 bg-ink-950/40 p-3">
                <p className="text-[12px] text-ink-400 break-all">
                  {i === 0 ? "Główne:" : "Dodatkowe:"} {p.label || p.url}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-[12px] font-medium text-white px-4 py-2 transition-colors"
                  >
                    Otwórz
                  </a>
                  <form action={deleteOfferFloorPlanPdfAction}>
                    <input type="hidden" name="offer_id" value={offerId} />
                    <input type="hidden" name="floorplan_id" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-accent-400/30 bg-accent-400/10 hover:bg-accent-400/15 text-[12px] font-medium text-accent-300 px-4 py-2 transition-colors"
                    >
                      Usuń
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <form action={uploadOfferFloorPlanPdfAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="offer_id" value={offerId} />
          <input type="hidden" name="galactica_offer_id" value={galacticaOfferId} />
          <div
            className={[
              "relative rounded-[var(--radius-md)] border border-dashed px-4 py-5 transition-colors",
              pdfDragOver
                ? "border-brand-400 bg-brand-500/10"
                : "border-white/20 bg-ink-950/30 hover:border-white/35 hover:bg-white/5",
            ].join(" ")}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPdfDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPdfDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPdfDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPdfDragOver(false);
              const list = Array.from(e.dataTransfer.files ?? []).filter(
                (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
              );
              if (!list.length) return;
              setPdfFiles(list);
              setNativeInputFiles(pdfInputRef.current, list);
            }}
          >
            <p className="text-[13px] text-ink-300">
              Przeciągnij i upuść PDF-y tutaj lub kliknij, aby wybrać.
            </p>
            <input
              ref={pdfInputRef}
              name="file"
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                setPdfFiles(list);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          {pdfFiles.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-ink-950/40 p-3">
              <p className="text-[12px] text-ink-300">Wybrane pliki ({pdfFiles.length})</p>
              <ul className="mt-2 space-y-1">
                {pdfFiles.map((f) => (
                  <li key={f.name} className="text-[12px] text-ink-400 break-all">
                    {f.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={pdfFiles.length === 0}
            className="self-start rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[13px] font-medium px-6 py-2.5 transition-colors"
          >
            Dodaj PDF-y
          </button>
        </form>
      </div>
    </div>
  );
}

