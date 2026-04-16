import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { SellWithFibra } from "@/components/home/SellWithFibra";
import { LeadCapture } from "@/components/home/LeadCapture";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = {
  title: "Sprzedaj z Fibrą — Fibra Nieruchomości",
  description:
    "Wycena, wideo, wirtualny spacer 3D w standardzie i promocja oferty — Fibra, powiat rybnicki i wodzisławski.",
};

export default function SprzedajPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <section className="py-16 md:py-24">
          <div className="container-xl">
            <Reveal>
              <p className="eyebrow flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Sprzedaj z Fibrą
              </p>
              <h1 className="font-display fluid-hero text-ink-950 max-w-[18ch] leading-[1.02]">
                Sprzedaj z Fibrą.
                <br />
                Nie tylko wystaw.
              </h1>
            </Reveal>
          </div>
        </section>

        <section className="pb-16 md:pb-20 border-b border-ink-200/70 bg-paper-warm">
          <div className="container-xl">
            <Reveal>
              <p className="eyebrow flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Wirtualny spacer 3D
              </p>
              <h2 className="font-display fluid-h2 text-ink-950 max-w-[20ch] leading-[1.05]">
                To jest nasz największy atut przy sprzedaży.
              </h2>
              <div className="mt-8 max-w-3xl space-y-5 text-[17px] text-ink-700 leading-[1.65]">
                <p>Wirtualny spacer 3D to u nas standard — nie opcja premium.</p>
                <p>
                  Kupujący wchodzą do środka wirtualnie przed wyjazdem. Widzą rzeczywisty układ, mierzą ściany do
                  centymetra, sprawdzają, czy sofa zmieści się w salonie.
                </p>
                <p>
                  Efekt: do Twoich drzwi trafiają tylko konkretni klienci, którzy znają ofertę „na wylot”. To buduje
                  prestiż i uzasadnia cenę Twojej nieruchomości.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <SellWithFibra />
        <LeadCapture />
      </main>
      <Footer />
    </>
  );
}
