import Link from "next/link";
import { zamyslowData } from "@/lib/investments/zamyslow-data";
import { getZamyslowUnitStatuses } from "@/lib/investments/zamyslow-units";
import { FloorPlanCompass } from "../FloorPlanCompass";

/**
 * Położenie mieszkania na rzucie piętra - statyczna (nieinteraktywna) wersja
 * eksploratora: pełny rzut kondygnacji z PODŚWIETLONĄ strefą tego mieszkania.
 * Obraz i polygon pochodzą z tych samych danych co interaktywny rzut na
 * /zamyslow, więc zaznaczenie jest zawsze spójne z eksploratorem.
 *
 * Sąsiednie lokale, które są już zajęte, kreskujemy tak samo jak w
 * eksploratorze - patrząc na to piętro widać od razu, co jeszcze zostało.
 */
export async function UnitFloorPlanCard({ unitId }: { unitId: string }) {
  const statuses = await getZamyslowUnitStatuses();
  const floor = zamyslowData.floors.find((f) =>
    f.floorPlan?.units.some((u) => u.id === unitId),
  );
  const plan = floor?.floorPlan;
  const unit = plan?.units.find((u) => u.id === unitId);
  if (!floor || !plan || !unit) return null;

  const { width: vbW, height: vbH } = plan.viewBox;
  const taken = plan.units.filter(
    (u) => u.id !== unitId && (statuses[u.id]?.availability ?? "available") !== "available",
  );

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-ink-200/70 bg-white shadow-[var(--shadow-cinematic)]">
      <div className="flex items-baseline justify-between gap-4 px-6 pt-5 md:px-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
          Położenie na piętrze
        </p>
        <p className="text-[13px] font-medium text-ink-600">{floor.label}</p>
      </div>

      <div className="relative mx-4 my-4 md:mx-5" style={{ aspectRatio: `${vbW} / ${vbH}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plan.image}
          alt={`${floor.label} - położenie mieszkania ${unitId} na rzucie`}
          className="h-full w-full select-none object-contain"
          draggable={false}
        />
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <pattern
              id="zamyslow-card-hatch"
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(120,113,108,0.5)" strokeWidth="2.2" />
            </pattern>
          </defs>
          {/* Delikatne wyciszenie reszty piętra + akcent na tym mieszkaniu. */}
          <path
            d={`M0 0H${vbW}V${vbH}H0Z ${unit.d}`}
            fill="rgba(250,250,248,0.55)"
            fillRule="evenodd"
          />
          {/* Zajęci sąsiedzi - to samo kreskowanie co na interaktywnym rzucie. */}
          {taken.map((u) => (
            <path key={`taken-${u.id}`} d={u.d} fill="url(#zamyslow-card-hatch)" />
          ))}
          <path
            d={unit.d}
            fill="rgba(0,221,214,0.16)"
            stroke="rgba(13,148,143,0.95)"
            strokeWidth={2.4}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <FloorPlanCompass className="absolute right-1 top-1 h-11 w-11 md:h-12 md:w-12" />

        {/* Plakietka z numerem w środku strefy */}
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md bg-ink-950 px-2 py-0.5 font-sans text-[11px] font-bold tabular-nums tracking-tight text-white shadow-lg md:text-[12.5px]"
          style={{
            left: `${(unit.label.x / vbW) * 100}%`,
            top: `${(unit.label.y / vbH) * 100}%`,
          }}
        >
          {unitId}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-ink-200/60 bg-paper-warm/50 px-6 py-3.5 md:px-7">
        <p className="flex items-center gap-2 text-[12.5px] text-ink-500">
          {taken.length ? (
            <>
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[repeating-linear-gradient(45deg,rgba(120,113,108,0.55)_0_2px,transparent_2px_4px)] ring-1 ring-ink-300"
              />
              <span>Kreskowane mieszkania są już zajęte</span>
            </>
          ) : (
            <span>Sąsiednie mieszkania zobaczysz na interaktywnym rzucie</span>
          )}
        </p>
        {/* #pietro-<id> otwiera na /zamyslow rzut DOKŁADNIE tego piętra
            (ZamyslowBuilding czyta hash i przewija do sceny). */}
        <Link
          href={`/zamyslow#pietro-${floor.id}`}
          className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          Otwórz rzut piętra
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
