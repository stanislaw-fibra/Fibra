/** Lokalizacje z obszaru działania Fibry. */
const ITEMS = [
  "Radlin",
  "Rybnik",
  "Wodzisław Śląski",
  "Rydułtowy",
  "Kornowac",
  "Rybnik Zalew",
  "Pszów",
  "Jastrzębie-Zdrój",
  "Żory",
];

export function Marquee() {
  const track = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <section className="py-8 md:py-10 bg-ink-950 text-ink-100 overflow-hidden hairline-dark-t hairline-dark-b">
      <div className="marquee-track flex gap-10 whitespace-nowrap">
        {track.map((t, i) => (
          <div key={`${t}-${i}`} className="flex items-center gap-10 shrink-0">
            <span className="font-display italic text-[30px] md:text-[40px] leading-none text-white/85">{t}</span>
            <span className="w-2 h-2 rounded-full bg-accent-400" aria-hidden />
          </div>
        ))}
      </div>
    </section>
  );
}
