/**
 * Komunikat ograniczonej dostępności pakietu książki. Zgodny z prawdą: drukowany
 * nakład jest ograniczony, więc pakiet dołączamy do wyczerpania egzemplarzy.
 *
 * Domyślnie bez liczby (komunikat jakościowy „do wyczerpania nakładu" - zawsze
 * prawdziwy, nie wymaga aktualizacji). Liczbę (`stockLeft`) podawaj tylko, jeśli
 * znasz realny stan i chcesz go pokazać.
 *
 * Dwa warianty kolorystyczne pod tło: "dark" (sekcja bonusu) i "light" (cennik).
 */

type Props = {
  tone?: "dark" | "light";
  stockLeft?: number | null;
  className?: string;
};

export function ScarcityNote({ tone = "light", stockLeft = null, className = "" }: Props) {
  const detail =
    typeof stockLeft === "number"
      ? `Z nakładu zostało jeszcze ${stockLeft} egzemplarzy książki.`
      : "Pakiet książki dołączamy do wyczerpania nakładu.";

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
        <strong className="font-semibold">Ograniczony nakład.</strong> {detail}
      </span>
    </div>
  );
}
