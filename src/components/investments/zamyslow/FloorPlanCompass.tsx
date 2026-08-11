import { FLOOR_PLAN_NORTH_DEG } from "@/lib/investments/zamyslow-data";

/**
 * Róża wiatrów na rzucie piętra - igła obrócona o rzeczywisty kąt północy
 * odczytany z rysunku architekta (patrz FLOOR_PLAN_NORTH_DEG).
 *
 * Litera „N" zostaje PIONOWA (czytelność na ekranie), a wskazuje ją igła -
 * na rysunkach technicznych litera jest obracana razem ze strzałką, ale w
 * interfejsie obrócony tekst czyta się gorzej.
 *
 * `tone`: "light" na jasnej karcie rzutu, "dark" na ciemnym tle overlaya.
 */
const R_LABEL = 15.8; // promień, na którym siada litera N (mieści się pod obręczą)

export function FloorPlanCompass({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const rad = (FLOOR_PLAN_NORTH_DEG * Math.PI) / 180;
  // Pozycja litery N: na przedłużeniu igły, ale bez obracania samego znaku.
  const nx = 24 + Math.sin(rad) * R_LABEL;
  const ny = 24 - Math.cos(rad) * R_LABEL;

  const ring = tone === "dark" ? "rgba(255,255,255,0.28)" : "rgba(11,15,20,0.16)";
  const needleN = tone === "dark" ? "#ffffff" : "#0b0f14";
  const needleS = tone === "dark" ? "rgba(255,255,255,0.32)" : "rgba(11,15,20,0.26)";
  const label = tone === "dark" ? "#ffffff" : "#0b0f14";
  const pivotFill = tone === "dark" ? "#0b0f14" : "#ffffff";
  const plate =
    tone === "dark"
      ? "bg-ink-950/55 ring-white/12 backdrop-blur-md"
      : "bg-white/85 ring-ink-950/8 backdrop-blur-[2px]";

  return (
    <div
      className={`pointer-events-none rounded-full p-1 ring-1 shadow-[0_2px_10px_-4px_rgba(11,15,20,0.25)] ${plate} ${className}`}
      role="img"
      aria-label={`Kierunek północy: ${FLOOR_PLAN_NORTH_DEG} stopni od pionu rzutu`}
      title="Północ"
    >
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <circle cx="24" cy="24" r="20.5" fill="none" stroke={ring} strokeWidth="1" />
        {/* Igła czterodzielna: północ pełna, południe wygaszone - kierunek
            czyta się od razu, a światłocień daje jej głębię. */}
        <g transform={`rotate(${FLOOR_PLAN_NORTH_DEG} 24 24)`}>
          <path d="M24 11.5 L24 24 L20.9 24 Z" fill={needleN} opacity="0.62" />
          <path d="M24 11.5 L27.1 24 L24 24 Z" fill={needleN} />
          <path d="M24 36.5 L20.9 24 L24 24 Z" fill={needleS} />
          <path d="M24 36.5 L24 24 L27.1 24 Z" fill={needleS} opacity="0.6" />
        </g>
        <circle cx="24" cy="24" r="1.15" fill={pivotFill} stroke={ring} strokeWidth="0.7" />
        {/* Litera N - pionowa, na obwodzie po stronie północy. */}
        <text
          x={nx}
          y={ny}
          fill={label}
          fontSize="8"
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
        >
          N
        </text>
      </svg>
    </div>
  );
}
