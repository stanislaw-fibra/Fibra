import type { ZamyslowUnitListing } from "@/lib/investments/zamyslow-units";

/** 27.04 → „27,04" (bez jednostki - „m²" jest osobnym, mniejszym elementem). */
const fmtArea = (v: number): string => v.toFixed(2).replace(".", ",");

/**
 * Rozkład pomieszczeń: metraż każdego pomieszczenia jako osobny kafelek
 * (liczba jest bohaterem, nazwa pod spodem), a pod nimi pasek z powierzchnią
 * użytkową całego mieszkania.
 *
 * Świadomie BEZ pasków proporcji - Bartosz nie chce wykresu, tylko czysto
 * podany metraż. Kafelki są w tym samym języku wizualnym, co liczby na
 * /zamyslow i w Przewodniku (duża liczba + mała etykieta), więc strona lokalu
 * wygląda jak część tej samej rodziny.
 */
export function UnitLayout({ unit }: { unit: ZamyslowUnitListing }) {
  if (unit.roomsList.length === 0) return null;

  // Balkon/taras dokładamy tylko wtedy, gdy arkusz ma jego powierzchnię -
  // i oznaczamy, że nie wchodzi do powierzchni użytkowej.
  const outdoorM2 = parseFloat(unit.outdoorArea.replace(",", ".").replace(/[^\d.]/g, ""));
  const outdoor =
    unit.outdoor && Number.isFinite(outdoorM2) && outdoorM2 > 0
      ? { name: unit.outdoor, areaM2: outdoorM2 }
      : null;

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {unit.roomsList.map((room, i) => (
          <li
            key={room.name}
            className="rounded-[var(--radius-lg)] border border-ink-200/70 bg-white px-5 py-6 shadow-[var(--shadow-soft)] transition-colors duration-300 hover:border-brand-300 md:px-6 md:py-7"
          >
            {/* Numer spójny ze znacznikiem tego pokoju na rzucie powyżej. */}
            <span className="mb-4 flex h-6 w-6 items-center justify-center rounded-full bg-ink-950 text-[11.5px] font-semibold text-white">
              {i + 1}
            </span>
            <p className="font-display text-[30px] leading-none tabular-nums text-ink-950 md:text-[34px]">
              {fmtArea(room.areaM2)}
              <span className="ml-1.5 font-sans text-[13.5px] font-medium tracking-normal text-ink-400">
                m²
              </span>
            </p>
            <p className="mt-3.5 text-[11.5px] font-medium uppercase leading-snug tracking-[0.13em] text-ink-500">
              {room.name}
            </p>
          </li>
        ))}

        {outdoor ? (
          <li className="rounded-[var(--radius-lg)] border border-ink-200/70 bg-paper-warm px-5 py-6 md:px-6 md:py-7">
            <span className="mb-4 flex h-6 w-6 items-center justify-center rounded-full border border-ink-300 text-[11px] text-ink-400">
              +
            </span>
            <p className="font-display text-[30px] leading-none tabular-nums text-ink-800 md:text-[34px]">
              {fmtArea(outdoor.areaM2)}
              <span className="ml-1.5 font-sans text-[13.5px] font-medium tracking-normal text-ink-400">
                m²
              </span>
            </p>
            <p className="mt-3.5 text-[11.5px] font-medium uppercase leading-snug tracking-[0.13em] text-ink-500">
              {outdoor.name}
            </p>
            <p className="mt-1 text-[11.5px] normal-case tracking-normal text-ink-400">
              poza powierzchnią użytkową
            </p>
          </li>
        ) : null}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 rounded-[var(--radius-lg)] bg-ink-950 px-6 py-6 md:px-8">
        <span className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/50">
          Powierzchnia użytkowa
        </span>
        <span className="font-display text-[32px] leading-none tabular-nums text-accent-400 md:text-[36px]">
          {fmtArea(unit.areaM2)}
          <span className="ml-1.5 font-sans text-[14px] font-medium tracking-normal text-white/45">
            m²
          </span>
        </span>
      </div>
    </div>
  );
}
