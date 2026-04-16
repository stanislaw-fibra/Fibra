import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Manifesto } from "@/components/home/Manifesto";
import { LeadCapture } from "@/components/home/LeadCapture";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = {
  title: "O Fibrze — Fibra Nieruchomości",
  description:
    "Fibra Nieruchomości — zespół z Radlina: obrót nieruchomościami, budownictwo, architektura i finansowanie. Powiat rybnicki i wodzisławski.",
};

const TEAM = [
  {
    name: "Zespół sprzedaży",
    role: "Rybnik · Radlin · region",
    bio: "Doradcy, którzy znają lokalny rynek — od Zalewu po Rydułtowy. Prowadzą klienta od pierwszego kontaktu po akt.",
  },
  {
    name: "Media i prezentacja",
    role: "Wideo · spacer 3D",
    bio: "Przygotowują filmy pionowe, spacery Matterport i materiały, które odpowiadają na realne pytania kupujących.",
  },
  {
    name: "Finansowanie",
    role: "Kredyty · formalności",
    bio: "Współpraca z doradcami kredytowymi i przygotowanie dokumentów pod transakcję — bez chaosu po stronie klienta.",
  },
  {
    name: "Biuro i obsługa",
    role: "Radlin · ul. Rymera 177",
    bio: "Pierwsza linia kontaktu, umawianie oglądań i dopilnowanie terminów — żebyś czuł się zaopiekowany.",
  },
];

export default function ONasPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <section className="py-16 md:py-24">
          <div className="container-xl">
            <Reveal>
              <p className="eyebrow flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                O Fibrze
              </p>
              <h1 className="font-display fluid-hero text-ink-950 max-w-[18ch] leading-[1.02]">
                Zespół, który <br />
                <em className="italic text-brand-500">zna ten rynek</em>.
              </h1>
              <div className="mt-10 max-w-3xl space-y-5 text-[17px] text-ink-700 leading-[1.65]">
                <p>
                  Fibra Nieruchomości to spółka skupiająca specjalistów w kilku dziedzinach jednocześnie: obrotu
                  nieruchomościami, budownictwa, architektury i finansowania. Działamy w powiecie rybnickim i
                  wodzisławskim.
                </p>
                <p>
                  Nie jesteśmy agencją-agregatorem. Znamy tu każdy blok i każdą ulicę. Obsługujemy zarówno rodziny
                  szukające własnego M, jak i inwestorów kupujących lokale na wynajem.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-paper-warm border-y border-ink-200/60">
          <div className="container-xl grid lg:grid-cols-12 gap-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Misja
              </p>
              <h2 className="font-display fluid-h2 text-ink-950 max-w-[18ch] leading-[1.05]">
                Sprzedawać i wynajmować nieruchomości, które pozwalają realizować życiowe marzenia.
              </h2>
            </Reveal>
            <Reveal delay={100} className="lg:col-span-7">
              <p className="eyebrow flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Wartości
              </p>
              <ul className="grid sm:grid-cols-2 gap-4">
                {["Uczciwość", "Zaufanie", "Koncentracja na potrzebach klienta", "Bezpieczeństwo — bez stresu, bez chaosu"].map(
                  (v) => (
                    <li
                      key={v}
                      className="rounded-[var(--radius-md)] border border-ink-200/80 bg-paper px-5 py-4 text-[15px] font-medium text-ink-950"
                    >
                      {v}
                    </li>
                  ),
                )}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="container-xl">
            <Reveal className="mb-14">
              <p className="eyebrow flex items-center gap-3 mb-6">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Zespół
              </p>
              <h2 className="font-display fluid-display text-ink-950 max-w-[16ch]">
                Ludzie <em className="italic text-brand-500">za procesem</em>.
              </h2>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TEAM.map((t, i) => (
                <Reveal key={t.name} delay={i * 80}>
                  <div className="group">
                    <div className="aspect-[3/4] rounded-[var(--radius-md)] bg-gradient-to-br from-brand-500/10 to-accent-400/10 mb-5 overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-[64px] text-brand-500/20">{t.name.charAt(0)}</span>
                      </div>
                    </div>
                    <h3 className="font-display text-[20px] text-ink-950">{t.name}</h3>
                    <p className="text-[12px] uppercase tracking-[0.14em] text-brand-500 mt-1">{t.role}</p>
                    <p className="text-[14px] text-ink-600 mt-3 leading-[1.55]">{t.bio}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <Manifesto />
        <LeadCapture />
      </main>
      <Footer />
    </>
  );
}
