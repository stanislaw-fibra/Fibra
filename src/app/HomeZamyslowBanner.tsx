import Image from "next/image";
import { buildingImage } from "@/lib/investments/zamyslow-data";
import { HomeZamyslowBannerLink } from "@/app/HomeZamyslowBannerLink";

/**
 * Baner Osiedla Zamysłów na samej górze strony głównej.
 *
 * Ustalenie ze spotkania 16.10.2026: fibra.pl ma na górze jeden temat numer
 * jeden (jak główna oferta na ING.pl), a pod nim katalog ofert pośrednictwa.
 * Na całą szerokość, ale spokojnie: zdjęcie, nazwa, jedno zdanie i link
 * tekstowy - bez przycisków i akcentów, żeby nie konkurował z ofertami.
 * Cały baner jest jednym linkiem na /zamyslow.
 *
 * „pod klucz" w zdaniu od razu - prośba Romana z 8.11.2026.
 *
 * `priceFrom` leci z arkusza mieszkań (np. „od 296 tys. zł"); bez arkusza
 * zdanie zostaje bez ceny.
 */
export function HomeZamyslowBanner({ priceFrom }: { priceFrom: string | null }) {
  return (
    // Renderowany wewnątrz HomeOffersHero (wspólne tło, odstęp pod nawigację już jest).
    <div className="container-xl relative pb-4 pt-5 md:pb-6 md:pt-8">
      <HomeZamyslowBannerLink className="group grid overflow-hidden rounded-2xl bg-ink-800 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:grid-cols-2">
        <span className="relative block h-44 overflow-hidden sm:h-56 lg:order-2 lg:h-auto lg:min-h-[240px]">
          <Image
            src={buildingImage}
            alt=""
            fill
            // Pierwszy obraz strony (LCP). `priority` jest w Next 16 przestarzałe.
            loading="eager"
            fetchPriority="high"
            quality={80}
            sizes="(min-width: 1360px) 640px, (min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[45%_40%] transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.02]"
          />
        </span>

        <span className="flex flex-col justify-center px-6 py-7 sm:px-8 sm:py-8 lg:order-1 lg:px-14 lg:py-12">
          <span className="block font-display text-[clamp(1.75rem,2.6vw,2.5rem)] leading-[1.05] tracking-[-0.015em]">
            Osiedle Zamysłów w Rybniku
          </span>
          <span className="mt-3 block max-w-[40ch] text-[15px] leading-relaxed text-white/70 md:text-[16px]">
            Nowe mieszkania inwestycyjne pod&nbsp;klucz{priceFrom ? `, ${priceFrom}` : ""}
          </span>
          <span className="mt-7 inline-flex items-center gap-2 self-start text-[14px] font-medium text-white">
            <span className="underline decoration-white/30 underline-offset-[6px] transition-colors duration-300 group-hover:decoration-white">
              Poznaj inwestycję
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      </HomeZamyslowBannerLink>
    </div>
  );
}
