import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Process } from "@/components/home/Process";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = {
  title: "Jak działamy — Fibra Nieruchomości",
  description:
    "Wideo zamiast zdjęć, wirtualny spacer 3D w standardzie i jeden opiekun od pierwszego kontaktu do aktu — Fibra, powiat rybnicki i wodzisławski.",
};

export default function JakDzialamyPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <section className="py-16 md:py-24">
          <div className="container-xl">
            <Reveal>
              <p className="eyebrow flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Jak działamy
              </p>
              <h1 className="font-display fluid-hero text-ink-950 max-w-[18ch]">
                Prezentacja, która <em className="italic text-brand-500">buduje zaufanie</em>.
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] text-ink-700 leading-relaxed">
                Działamy lokalnie w powiecie rybnickim i wodzisławskim. Każdą ofertę pokazujemy wideo i w wirtualnym
                spacerze 3D — żebyś wiedział, czego się spodziewać, zanim umówisz się na oglądanie.
              </p>
            </Reveal>
          </div>
        </section>
        <Process />
      </main>
      <Footer />
    </>
  );
}
