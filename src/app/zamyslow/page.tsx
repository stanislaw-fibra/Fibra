import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { InvestorHero } from "@/components/investments/zamyslow/investor/InvestorHero";
import { TrustSection } from "@/components/investments/zamyslow/investor/TrustSection";
import { WhyRybnik } from "@/components/investments/zamyslow/investor/WhyRybnik";
import { ReturnsSection } from "@/components/investments/zamyslow/investor/ReturnsSection";
import { WhichApartment } from "@/components/investments/zamyslow/investor/WhichApartment";
import { InvestorCta } from "@/components/investments/zamyslow/investor/InvestorCta";

export const metadata: Metadata = {
  title: "Zainwestuj w Rybniku - Osiedle Zamysłów | Fibra Nieruchomości",
  description:
    "Mieszkanie na wynajem na Osiedlu Zamysłów w Rybniku. Komu zaufać, dlaczego Rybnik, szacowana rentowność najmu i wybór mieszkania - wszystko, co inwestor chce wiedzieć.",
  robots: { index: false, follow: false },
};

export default function ZamyslowPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <InvestorHero />
        <TrustSection />
        <WhyRybnik />
        <ReturnsSection />
        <WhichApartment />
        <InvestorCta />
      </main>
      <Footer />
    </>
  );
}
