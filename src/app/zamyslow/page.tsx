import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { ZamyslowNav } from "@/components/investments/zamyslow/ZamyslowNav";
import { InvestorHero } from "@/components/investments/zamyslow/investor/InvestorHero";
import { TrustSection } from "@/components/investments/zamyslow/investor/TrustSection";
import { WhyRybnik } from "@/components/investments/zamyslow/investor/WhyRybnik";
import { ReturnsSection } from "@/components/investments/zamyslow/investor/ReturnsSection";
import { WhichApartment } from "@/components/investments/zamyslow/investor/WhichApartment";
import { ZamyslowApartmentsList } from "@/components/investments/zamyslow/ZamyslowApartmentsList";
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
      <ZamyslowNav />
      <main className="flex-1 pt-[72px]">
        <InvestorHero />
        <TrustSection />
        <WhyRybnik />
        <ReturnsSection />
        <WhichApartment />
        <ZamyslowApartmentsList />
        <InvestorCta />
      </main>
      <Footer />
    </>
  );
}
