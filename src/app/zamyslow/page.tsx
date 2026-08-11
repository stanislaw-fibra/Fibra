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
import { getPublicFounder, getPublicTeamMember } from "@/lib/team-query";
import { FOUNDER_VIDEO_OVERRIDE } from "@/lib/investments/zamyslow-proof";
import { getZamyslowUnitsSummary } from "@/lib/investments/zamyslow-units";
import {
  ZAMYSLOW_AGENT_BIO,
  ZAMYSLOW_AGENT_FALLBACK,
} from "@/lib/investments/zamyslow-data";

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
  const [founder, arek, units] = await Promise.all([
    getPublicFounder(),
    getPublicTeamMember(ZAMYSLOW_AGENT_FALLBACK.name),
    getZamyslowUnitsSummary(),
  ]);
  const founderVideoId = FOUNDER_VIDEO_OVERRIDE ?? founder?.cloudflareVideoId ?? null;
  const trustFounder = founderVideoId
    ? {
        name: founder?.name ?? "Bartosz Nosiadek",
        role: founder?.role ?? "Założyciel, Prezes Zarządu",
        videoId: founderVideoId,
        // Miniaturą filmu jest oficjalny portret założyciela (ten na niebieskim tle,
        // ten sam co na /o-fibrze i stronach agentów) - TeamMemberMedia stawia
        // `photoUrl` przed klatką ze streamu, więc nie podajemy tu własnej okładki.
        photoUrl: founder?.photoUrl,
      }
    : null;

  // Opiekun inwestycji (Arek) - twarz przy każdym miejscu kontaktu. Dane z bazy
  // (zdjęcie/rola/przyszłe wideo), z fallbackiem na stałe wartości, gdyby
  // Supabase chwilowo nie odpowiedział.
  const zamyslowAgent = {
    name: arek?.name ?? ZAMYSLOW_AGENT_FALLBACK.name,
    role: arek?.role ?? ZAMYSLOW_AGENT_FALLBACK.role,
    photoUrl: arek?.photoUrl ?? ZAMYSLOW_AGENT_FALLBACK.photoUrl,
    videoId: arek?.cloudflareVideoId,
    bio: ZAMYSLOW_AGENT_BIO,
  };

  return (
    <>
      <ZamyslowNav experience="investor" />
      <main className="flex-1 pt-[72px]">
        <InvestorHero />
        <ProofStrip />
        <TrustSection founder={trustFounder} agent={zamyslowAgent} />
        <WhyRybnik />
        <WhyZamyslow areaFromToLabel={units?.areaFromToLabel ?? null} />
        <ReturnsSection />
        <WhichApartment />
        <ZamyslowApartmentsList />
        <InvestorCta agent={zamyslowAgent} />
      </main>
      <InvestorStickyCta />
      <ZamyslowFooter experience="investor" />
    </>
  );
}
