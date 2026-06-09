"use client";

import { useState } from "react";
import Image from "next/image";
import { StreamVideo } from "./StreamVideo";
import bookCta from "../../../public/kurs/ksiazka_cta.png";

type Props = {
  videoId: string;
  price: string;
  /** Czy aktywny jest bonus (pakiet książki gratis). Steruje całą komunikacją. */
  bonusActive: boolean;
  /** Wartość pakietu książki jako prezent, np. "297 zł". */
  bonusValue: string;
  /** Do kiedy bonus, np. "15 lipca". */
  bonusDeadline: string;
  /** Wartość przy zakupie osobno (kurs + pakiet), np. "474 zł". */
  priceSeparate: string;
};

/** Hero: pionowe wideo 9:16 (zgodne ze źródłem - bez czarnych pasów, pełne
    kontrolki) plus plakietki ceny i książki. Plakietki znikają po starcie
    odtwarzania, żeby nie zasłaniać sterowania filmem. */
export function HeroMedia({
  videoId,
  price,
  bonusActive,
  bonusValue,
  bonusDeadline,
  priceSeparate,
}: Props) {
  const [playing, setPlaying] = useState(false);

  const chipState = playing
    ? "opacity-0 pointer-events-none"
    : "opacity-100";

  return (
    <div className="relative mx-auto w-full max-w-[20rem] sm:max-w-[22rem] lg:max-w-[24rem]">
      <div className="relative aspect-[9/16] rounded-3xl overflow-hidden shadow-[var(--shadow-cinematic)] border border-ink-200/60 bg-ink-900">
        <StreamVideo
          id={videoId}
          title="Bartosz Nosiadek o kursie „20 Lekcji Inwestora”"
          poster="/kurs/Bartosz_Nosiadek_Miniatura.webp"
          showCaption={false}
          onPlay={() => setPlaying(true)}
        />
      </div>

      {/* Cena: bohaterem jest kurs, pakiet książki to bonus */}
      <div
        className={`absolute -top-4 -right-2 sm:-right-4 rounded-2xl bg-white px-5 py-3.5 shadow-[var(--shadow-card)] border border-ink-200/60 transition-opacity duration-200 ${chipState}`}
      >
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-500">
          {bonusActive ? "Kurs + pakiet książki gratis" : "Kurs 20 Lekcji Inwestora"}
        </p>
        <p className="mt-1">
          <span className="font-display text-ink-950 text-[1.9rem] leading-none tabular-nums">
            {price}
          </span>
        </p>
        {bonusActive && (
          <p className="mt-0.5 text-[11px] text-ink-500 tabular-nums">
            osobno {priceSeparate}
          </p>
        )}
      </div>

      {/* Bonus: pakiet książki o wartości X w prezencie, do daty */}
      {bonusActive && (
        <div
          className={`absolute -bottom-4 -left-2 sm:-left-5 rotate-[-3deg] flex items-center gap-3 rounded-2xl bg-brand-700 text-white pl-3 pr-5 py-3 shadow-lg max-w-[16rem] transition-opacity duration-200 ${chipState}`}
        >
          <Image
            src={bookCta}
            alt=""
            className="h-12 w-auto shrink-0 drop-shadow"
            sizes="48px"
          />
          <p className="text-[13px] sm:text-[14px] font-medium leading-tight">
            Pakiet książki o wartości {bonusValue} w prezencie, do {bonusDeadline}
          </p>
        </div>
      )}
    </div>
  );
}
