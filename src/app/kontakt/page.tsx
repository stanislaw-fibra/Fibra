import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { LeadCapture } from "@/components/home/LeadCapture";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = {
  title: "Kontakt — Fibra Nieruchomości",
  description:
    "Zadzwoń 510 777 200 lub napisz na biuro@grupafibra.pl. Biuro w Radlinie — powiat rybnicki i wodzisławski.",
};

export default function KontaktPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <section className="pt-16 pb-4 md:pt-24 md:pb-8">
          <div className="container-xl">
            <Reveal>
              <p className="eyebrow flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Kontakt
              </p>
              <h1 className="font-display fluid-hero text-ink-950 max-w-[16ch] leading-[1.02]">
                Porozmawiajmy <em className="italic text-brand-500">o nieruchomości</em>.
              </h1>
            </Reveal>
          </div>
        </section>
        <LeadCapture />
      </main>
      <Footer />
    </>
  );
}
