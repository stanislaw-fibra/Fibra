import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { KontaktPage as KontaktScreen } from "@/components/kontakt/KontaktPage";

export const metadata = {
  title: "Kontakt - Fibra Nieruchomości",
  description:
    "Zadzwoń 510 777 200 lub napisz na biuro@grupafibra.pl. Biuro w Radlinie - powiat rybnicki i wodzisławski.",
};

export default function Page() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <KontaktScreen />
      </main>
      <Footer />
    </>
  );
}
