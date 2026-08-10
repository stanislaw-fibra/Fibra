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
import { InvestorStickyCta } from "@/components/investments/zamyslow/investor/InvestorStickyCta";
import { getPublicFounder } from "@/lib/team-query";
import { FOUNDER_VIDEO_OVERRIDE, FOUNDER_VIDEO_POSTER } from "@/lib/investments/zamyslow-proof";
import { getZamyslowUnitsSummary } from "@/lib/investments/zamyslow-units";

// Jak /o-fibrze: dane założyciela (film) lecą z Supabase, więc odświeżamy stronę
// co minutę zamiast zamrażać ją na buildzie.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Zainwestuj w Rybniku - Osiedle Zamysłów | Fibra Nieruchomości",
  description:
    "Mieszkanie na wynajem na Osiedlu Zamysłów w Rybniku. Komu zaufać, dlaczego Rybnik, szacowana rentowność najmu i wybór mieszkania - wszystko, co inwestor chce wiedzieć.",
  robots: { index: false, follow: false },
};

export default async function ZamyslowPage() {
  // Autoprezentacja założyciela w sekcji „Czy mogę zaufać?" - domyślnie ten sam
  // film, co na /o-fibrze; osobne nagranie pod inwestora wpisuje się w
  // FOUNDER_VIDEO_OVERRIDE. Bez filmu blok się nie pokazuje.
  // Metraże w tekstach lecą z arkusza mieszkań - żadnych widełek na sztywno.
  const [founder, units] = await Promise.all([
    getPublicFounder(),
    getZamyslowUnitsSummary(),
  ]);
  const founderVideoId = FOUNDER_VIDEO_OVERRIDE ?? founder?.cloudflareVideoId ?? null;
  const trustFounder = founderVideoId
    ? {
        name: founder?.name ?? "Bartosz Nosiadek",
        role: founder?.role ?? "Założyciel, Prezes Zarządu",
        videoId: founderVideoId,
        photoUrl: founder?.photoUrl,
        posterUrl: FOUNDER_VIDEO_POSTER,
      }
    : null;

  return (
    <>
      <ZamyslowNav experience="investor" />
      <main className="flex-1 pt-[72px]">
        <InvestorHero />
        <ProofStrip />
        <TrustSection founder={trustFounder} />
        <WhyRybnik />
        <WhyZamyslow areaFromToLabel={units?.areaFromToLabel ?? null} />
        <ReturnsSection />
        <WhichApartment />
        <ZamyslowApartmentsList />
        <InvestorCta />
      </main>
      <InvestorStickyCta />
      <ZamyslowFooter experience="investor" />
    </>
  );
}
