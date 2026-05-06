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

/**
 * Sekcja „Rzut" — formularze obraz + PDF.
 *
 * Zmiany w stosunku do poprzedniej wersji (klient skarżył się, że dodany .jpg „znika"):
 *
 * 1. Drop zone i input pokrywają się z formularzem przez `formAction` na nadrzędnym `<form>`.
 *    Po wybraniu / upuszczeniu plików formularz JEST WYSYŁANY AUTOMATYCZNIE — nie trzeba
 *    klikać dodatkowego przycisku, żeby plik się utrwalił.
 * 2. Wyraźna informacja statusu: „Wysyłam plik do bazy…" / „Zapisano".
 * 3. Awaryjny przycisk „Wyślij teraz" — gdy auto-submit zostanie zablokowany przez przeglądarkę
 *    (np. wskutek własnego rozszerzenia), klient ma jeszcze fallback.
 */
export function OfferFloorPlanUploadForm({
  offerId,
  galacticaOfferId,
  images,
  pdfs,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FloorPlanCard
        offerId={offerId}
        galacticaOfferId={galacticaOfferId}
        kind="image"
        title="Zdjęcie rzutu"
        helper="Akceptujemy JPG, PNG, WebP. Plik zostanie zapisany automatycznie po upuszczeniu."
        accept="image/*"
        items={images}
        action={uploadOfferFloorPlanImageAction}
        deleteAction={deleteOfferFloorPlanImageAction}
        firstLabel="Główne"
        otherLabel="Dodatkowe"
      />
      <FloorPlanCard
        offerId={offerId}
        galacticaOfferId={galacticaOfferId}
        kind="pdf"
        title="PDF rzutu"
        helper="Sam plik PDF — zapisuje się automatycznie po upuszczeniu."
        accept="application/pdf,.pdf"
        items={pdfs}
        action={uploadOfferFloorPlanPdfAction}
        deleteAction={deleteOfferFloorPlanPdfAction}
        firstLabel="Główne"
        otherLabel="Dodatkowe"
      />
    </div>
  );
}

type FloorPlanCardProps = {
  offerId: string;
  galacticaOfferId: string;
  kind: "image" | "pdf";
  title: string;
  helper: string;
  accept: string;
  items: { id: string; url: string; label: string | null }[];
  action: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  firstLabel: string;
  otherLabel: string;
};

function FloorPlanCard({
  offerId,
  galacticaOfferId,
  kind,
  title,
  helper,
  accept,
  items,
  action,
  deleteAction,
  firstLabel,
  otherLabel,
}: FloorPlanCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const previews = useMemo(
    () =>
      kind === "image"
        ? files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))
        : files.map((f) => ({ name: f.name, url: "" })),
    [files, kind],
  );

  useEffect(() => {
    if (kind !== "image") return;
    return () => {
      for (const p of previews) {
        if (p.url) URL.revokeObjectURL(p.url);
      }
    };
  }, [previews, kind]);

  function setNativeInputFiles(input: HTMLInputElement | null, list: File[]) {
    if (!input) return;
    try {
      const dt = new DataTransfer();
      for (const f of list) dt.items.add(f);
      input.files = dt.files;
    } catch {
      /* niektóre przeglądarki blokują programowy zapis files; mamy fallback przez input.click() */
    }
  }

  function pickFiles(list: File[]) {
    const filtered = list.filter((f) =>
      kind === "image" ? f.type.startsWith("image/") : f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (!filtered.length) return;
    setFiles(filtered);
    setNativeInputFiles(inputRef.current, filtered);
    // Auto-submit — kluczowa zmiana: po wybraniu plików formularz IDZIE OD RAZU,
    // klient nie musi szukać przycisku „Dodaj zdjęcia".
    // Małe opóźnienie, żeby React zdążył odświeżyć stan inputa przed submitem.
    window.setTimeout(() => {
      if (!formRef.current) return;
      setSubmitting(true);
      formRef.current.requestSubmit();
    }, 50);
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-ink-900/35 p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold text-white leading-snug">{title}</h3>
      <p className="mt-2 text-[13px] text-ink-300 leading-relaxed">{helper}</p>

      {items.length > 0 ? (
        <div className="mt-4 space-y-2">
          {items.map((it, i) => (
            <div key={it.id} className="rounded-lg border border-white/10 bg-ink-950/40 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] text-ink-200 break-all">
                    {i === 0 ? `${firstLabel}:` : `${otherLabel}:`} {it.label || it.url}
                  </p>
                  {kind === "image" ? (
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-ink-900/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.url} alt="" className="w-full max-h-[320px] object-contain" loading="lazy" />
                    </div>
                  ) : null}
                </div>
                <div className="shrink-0">
                  <div className="flex flex-wrap gap-2 justify-end">
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-white/25 bg-white/10 hover:bg-white/15 text-[12px] font-semibold text-white px-4 py-2 transition-colors"
                    >
                      Otwórz
                    </a>
                    <form action={deleteAction}>
                      <input type="hidden" name="offer_id" value={offerId} />
                      <input type="hidden" name="floorplan_id" value={it.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-accent-400/40 bg-accent-400/10 hover:bg-accent-400/20 text-[12px] font-semibold text-accent-200 px-4 py-2 transition-colors"
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

      <form
        ref={formRef}
        action={action}
        onSubmit={() => setSubmitting(true)}
        className="mt-4 flex flex-col gap-3"
      >
        <input type="hidden" name="offer_id" value={offerId} />
        <input type="hidden" name="galactica_offer_id" value={galacticaOfferId} />
        <div
          className={[
            "relative rounded-[var(--radius-md)] border-2 border-dashed px-4 py-7 transition-colors",
            dragOver
              ? "border-brand-400 bg-brand-500/15"
              : submitting
                ? "border-emerald-400/60 bg-emerald-400/10"
                : "border-white/30 bg-ink-950/30 hover:border-white/50 hover:bg-white/5",
          ].join(" ")}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            const list = Array.from(e.dataTransfer.files ?? []);
            pickFiles(list);
          }}
        >
          <p className="text-[14px] font-semibold text-white">
            {submitting ? "Wysyłam plik do bazy…" : "Przeciągnij plik tutaj lub kliknij"}
          </p>
          <p className="mt-1 text-[12px] text-ink-300">
            {kind === "image" ? "JPG, PNG, WebP — wiele plików naraz." : "PDF — wiele plików naraz."}
            {" "}
            Plik zapisuje się automatycznie po upuszczeniu.
          </p>
          <input
            ref={inputRef}
            name="file"
            type="file"
            accept={accept}
            multiple
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              pickFiles(list);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {previews.length > 0 ? (
          <div className="rounded-lg border border-white/10 bg-ink-950/40 p-3">
            <p className="text-[12px] text-ink-200">
              {submitting ? "Wgrywanie…" : "Wybrane pliki"} ({previews.length})
            </p>
            {kind === "image" ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {previews.map((p) => (
                  <div key={p.url || p.name} className="rounded-lg overflow-hidden border border-white/10 bg-ink-900/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="h-24 w-full object-cover" />
                    <div className="px-2 py-2">
                      <p className="text-[11px] text-ink-200 break-all line-clamp-2">{p.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="mt-2 space-y-1">
                {previews.map((p) => (
                  <li key={p.name} className="text-[12px] text-ink-200 break-all">
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {/* Awaryjny przycisk „Wyślij teraz" — pokazuje się tylko gdy są wybrane pliki, ale auto-submit
            się nie powiódł (np. extension blokuje requestSubmit). */}
        {files.length > 0 ? (
          <button
            type="submit"
            disabled={submitting}
            className="self-start inline-flex items-center gap-2 rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[13px] font-semibold px-6 py-2.5 transition-colors disabled:opacity-60"
          >
            {submitting ? "Wysyłam…" : "Wyślij teraz"}
          </button>
        ) : null}
      </form>
    </div>
  );
}
