"use client";

import { useState } from "react";
import Image from "next/image";
import { StreamVideo } from "./StreamVideo";
import bookCta from "../../../public/kurs/ksiazka_cta.png";

type Props = {
  videoId: string;
  price: string;
  priceRegular: string;
};

/** Hero: pionowe wideo 9:16 (zgodne ze źródłem - bez czarnych pasów, pełne
    kontrolki) plus plakietki ceny i książki. Plakietki znikają po starcie
    odtwarzania, żeby nie zasłaniać sterowania filmem. */
export function HeroMedia({ videoId, price, priceRegular }: Props) {
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

      {/* Cena: bohaterem jest kurs, książka to bonus */}
      <div
        className={`absolute -top-4 -right-2 sm:-right-4 rounded-2xl bg-white px-5 py-3.5 shadow-[var(--shadow-card)] border border-ink-200/60 transition-opacity duration-200 ${chipState}`}
      >
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-500">
          Kurs + książka gratis
        </p>
        <p className="mt-1">
          <span className="font-display text-ink-950 text-[1.9rem] leading-none tabular-nums">
            {price}
          </span>
        </p>
        <p className="mt-0.5 text-[11px] text-ink-500 tabular-nums">
          osobno <span className="line-through">{priceRegular}</span>
        </p>
      </div>

      {/* Książka gratis - z miniaturą okładki */}
      <div
        className={`absolute -bottom-4 -left-2 sm:-left-5 rotate-[-3deg] flex items-center gap-3 rounded-2xl bg-brand-700 text-white pl-3 pr-5 py-3 shadow-lg max-w-[15rem] transition-opacity duration-200 ${chipState}`}
      >
        <Image
          src={bookCta}
          alt=""
          className="h-12 w-auto shrink-0 drop-shadow"
          sizes="48px"
        />
        <p className="text-[13px] sm:text-[14px] font-medium leading-tight">
          Książka „Zarabianie Uczciwych Pieniędzy” w gratisie
        </p>
      </div>
    </div>
  );
}
