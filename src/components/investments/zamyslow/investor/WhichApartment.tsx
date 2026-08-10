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
            <em className="italic text-brand-600">który pasuje do Twojego budżetu.</em>
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-ink-600">
            Kliknij wybrane piętro na wizualizacji, aby zobaczyć metraże, układy
            mieszkań i ich aktualny status. Wybór zależy od Twojego budżetu
            i planów. Pomożemy wybrać mieszkanie, które będzie najlepiej
            odpowiadało Twoim celom.
          </p>
        </div>
      </div>

      {/* Pełny, interaktywny eksplorator budynku (ten sam co na /osiedle-zamyslow).
          `id` jest celem sticky CTA - skrót ma prowadzić wprost do wizualizacji,
          a nie do nagłówka sekcji nad nią. */}
      <div id="wizualizacja" className="mt-12 scroll-mt-[72px] md:mt-16">
        <ZamyslowExperience />
      </div>
    </section>
  );
}
