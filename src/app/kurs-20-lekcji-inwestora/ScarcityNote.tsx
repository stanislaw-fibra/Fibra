/**
 * Komunikat ograniczonej oferty bonusu (pakiet książki gratis). Mówi wprost, że to
 * OFERTA jest ograniczona - czasowo (do `deadline`) lub do wyczerpania nakładu
 * drukowanej książki. Nie jest to disclaimer „możesz nie dostać książki" - kto
 * zamawia w trakcie oferty, dostaje pakiet.
 *
 * Dwa warianty kolorystyczne pod tło: "dark" (sekcja bonusu) i "light" (reszta).
 */

type Props = {
  tone?: "dark" | "light";
  /** Termin obowiązywania bonusu, np. "15 lipca" (BONUS.deadline). */
  deadline: string;
  className?: string;
};

export function ScarcityNote({ tone = "light", deadline, className = "" }: Props) {
  const box =
    tone === "dark"
      ? "border-accent-400/35 bg-accent-500/10 text-accent-100"
      : "border-accent-500/30 bg-accent-50 text-accent-600";

  return (
    <div
      role="note"
      className={`inline-flex items-center gap-3 rounded-full border px-4 py-2.5 text-[13.5px] md:text-[14px] leading-snug ${box} ${className}`}
    >
      {/* Pulsujący punkt - przyciąga wzrok, ale dyskretnie. */}
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-500" />
      </span>
      <span>
        <strong className="font-semibold">Oferta ograniczona.</strong> Pakiet książki
        gratis tylko do {deadline} lub do wyczerpania nakładu.
      </span>
    </div>
  );
}
