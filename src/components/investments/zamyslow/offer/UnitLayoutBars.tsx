import type { ZamyslowUnitListing } from "@/lib/investments/zamyslow-units";

/**
 * Rozkład pomieszczeń: nazwa + metraż + pasek proporcjonalny do udziału
 * pomieszczenia w powierzchni mieszkania. Dane wprost z arkusza (projekt).
 */
export function UnitLayoutBars({ unit }: { unit: ZamyslowUnitListing }) {
  if (unit.roomsList.length === 0) return null;
  const max = Math.max(...unit.roomsList.map((r) => r.areaM2));

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/70 bg-white shadow-[var(--shadow-card)]">
      <ul className="divide-y divide-ink-200/60">
        {unit.roomsList.map((room) => (
          <li key={room.name} className="px-6 py-4 md:px-7">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[14.5px] text-ink-700">{room.name}</span>
              <span className="shrink-0 font-sans text-[14.5px] font-semibold tabular-nums text-ink-950">
                {room.areaLabel.replace(".", ",")}
              </span>
            </div>
            <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-500/80"
                style={{ width: `${Math.max(8, (room.areaM2 / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between gap-4 border-t border-ink-200/70 bg-paper-warm/60 px-6 py-4 md:px-7">
        <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-ink-500">
          Powierzchnia użytkowa
        </span>
        <span className="font-sans text-[17px] font-bold tabular-nums text-ink-950">
          {unit.areaLabel.replace(".", ",")}
        </span>
      </div>
    </div>
  );
}
