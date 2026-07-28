import type { Metadata } from "next";
import { ZamyslowFooter } from "@/components/investments/zamyslow/ZamyslowFooter";
import { ZamyslowNav } from "@/components/investments/zamyslow/ZamyslowNav";
import { InvestorHero } from "@/components/investments/zamyslow/investor/InvestorHero";
import { ProofStrip } from "@/components/investments/zamyslow/investor/ProofStrip";
import { TrustSection } from "@/components/investments/zamyslow/investor/TrustSection";
import { WhyRybnik } from "@/components/investments/zamyslow/investor/WhyRybnik";
import { WhyZamyslow } from "@/components/investments/zamyslow/investor/WhyZamyslow";
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
      <ZamyslowNav experience="investor" />
      <main className="flex-1 pt-[72px]">
        <InvestorHero />
        <ProofStrip />
        <TrustSection />
        <WhyRybnik />
        <WhyZamyslow />
        <ReturnsSection />
        <WhichApartment />
        <ZamyslowApartmentsList />
        <InvestorCta />
      </main>
      <ZamyslowFooter experience="investor" />
    </>
  );
}
