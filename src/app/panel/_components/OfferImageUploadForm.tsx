"use client";

import { useState } from "react";
import { uploadOfferImageAction } from "@/app/panel/actions/offers";

type Props = {
  offerId: string;
  galacticaOfferId: string;
};

export function OfferImageUploadForm({ offerId, galacticaOfferId }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="space-y-4 mb-10">
      <form action={uploadOfferImageAction} className="flex flex-col gap-4">
        <input type="hidden" name="offer_id" value={offerId} />
        <input type="hidden" name="galactica_offer_id" value={galacticaOfferId} />

        <div className="rounded-[var(--radius-md)] border border-dashed border-white/20 bg-ink-900/40 px-4 py-5 sm:px-6 sm:py-6">
          <label className="block cursor-pointer">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Plik z dysku</span>
            <p className="mt-2 text-[13px] text-ink-400">
              JPG, PNG, WebP. Po wyborze pliku kliknij <span className="text-ink-200 font-medium">Dodaj zdjęcie</span>, żeby je
              przesłać.
            </p>
            <input
              name="file"
              type="file"
              accept="image/*"
              required
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFileName(f ? f.name : null);
              }}
              className="mt-4 block w-full text-[13px] text-ink-200 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-white/20 file:bg-white/10 file:px-4 file:py-2.5 file:text-[13px] file:font-medium file:text-white file:transition-colors hover:file:bg-white/15"
            />
          </label>
          {fileName && (
            <p className="mt-4 text-[13px] text-emerald-400/90 border border-emerald-400/25 rounded-lg px-3 py-2 bg-emerald-400/10">
              Wybrano: <span className="font-medium text-white break-all">{fileName}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          className="self-start rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[13px] font-medium px-6 py-2.5 transition-colors"
        >
          Dodaj zdjęcie
        </button>
      </form>
    </div>
  );
}
