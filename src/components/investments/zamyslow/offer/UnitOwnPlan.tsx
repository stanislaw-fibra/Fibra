import Image from "next/image";

/**
 * Rzut samego mieszkania - wycięty z rzutu kondygnacji skryptem
 * `scripts/zamyslow-unit-plans.ts` (maska po obrysie strefy, poszerzona
 * o grubość ścian). Plik: /floorplans/units/<id>.webp, tło białe.
 *
 * Gdyby dla któregoś lokalu pliku nie było, komponent nic nie renderuje -
 * strona oferty działa dalej, tylko bez tej sekcji.
 */
export function UnitOwnPlan({
  unitId,
  areaLabel,
}: {
  unitId: string;
  areaLabel: string;
}) {
  const src = `/investments/zamyslow/floorplans/units/${unitId.toLowerCase()}.webp`;

  return (
    <figure className="overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/70 bg-white shadow-[var(--shadow-card)]">
      {/* Stała proporcja kadru + object-contain: mieszkania mają bardzo różne
          kształty (M8 pionowe 1308x2070, M12 poziome 1770x1002), a dzięki temu
          każdy rzut mieści się w całości i sekcja nie skacze między ofertami. */}
      <div className="relative aspect-[16/10] w-full bg-white p-4 md:p-6">
        <Image
          src={src}
          alt={`Rzut mieszkania ${unitId} - ${areaLabel.replace(".", ",")}`}
          fill
          sizes="(max-width: 1024px) 92vw, 780px"
          className="object-contain"
        />
      </div>
      <figcaption className="flex items-center justify-between gap-4 border-t border-ink-200/60 bg-paper-warm/50 px-6 py-3.5">
        <span className="text-[12.5px] text-ink-500">
          Rzut mieszkania {unitId}
        </span>
        <a
          href={src}
          download={`rzut-${unitId.toLowerCase()}.webp`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          Pobierz
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 2v8M3.5 7L7 10.5 10.5 7M2.5 12h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </figcaption>
    </figure>
  );
}
