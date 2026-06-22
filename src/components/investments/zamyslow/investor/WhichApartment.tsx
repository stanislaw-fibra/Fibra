import { ZamyslowExperience } from "@/components/investments/zamyslow/ZamyslowExperience";

export function WhichApartment() {
  return (
    <section id="mieszkania" className="scroll-mt-[72px] bg-paper">
      <div className="container-xl pt-24 md:pt-32">
        <div className="max-w-[52ch]">
          <p className="eyebrow flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-brand-500" />
            Które mieszkanie
          </p>
          <h2 className="mt-6 font-display fluid-h2 text-ink-950">
            Wybierz lokal,{" "}
            <em className="italic text-brand-600">który pasuje do budżetu.</em>
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-ink-600">
            Kliknij piętro na wizualizacji, żeby zobaczyć metraże, układy i
            aktualny status każdego mieszkania. Pod inwestycję na wynajem
            zwykle najlepiej sprawdzają się mniejsze, łatwo wynajmowalne lokale,
            ale dobór zależy od Twoich celów. Pomożemy go dopasować.
          </p>
        </div>
      </div>

      {/* Pełny, interaktywny eksplorator budynku (ten sam co na /osiedle-zamyslow). */}
      <div className="mt-12 md:mt-16">
        <ZamyslowExperience />
      </div>
    </section>
  );
}
