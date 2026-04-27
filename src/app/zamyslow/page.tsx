import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { ZamyslowExperience } from "@/components/investments/zamyslow/ZamyslowExperience";

export const metadata: Metadata = {
  title: "Osiedle Zamysłów - Inwestycja premium | Fibra Nieruchomości",
  description:
    "Poznaj Osiedle Zamysłów: interaktywny podgląd pięter, rzuty mieszkań i aktualne statusy lokali.",
};

export default function ZamyslowPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <ZamyslowExperience />
      </main>
      <Footer />
    </>
  );
}
