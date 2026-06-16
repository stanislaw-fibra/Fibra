import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { OpeningReels } from "@/components/home/OpeningReels";
import { OfficeVirtualTour } from "@/components/home/OfficeVirtualTour";
import { getAllOffers } from "@/lib/offers-query";
import { getPublicTeamMembers } from "@/lib/team-query";
import { HomeIntro } from "@/components/home/HomeIntro";
import { SellWithFibra } from "@/components/home/SellWithFibra";
import { Process } from "@/components/home/Process";
import { Marquee } from "@/components/home/Marquee";
import { Manifesto } from "@/components/home/Manifesto";
import { LeadCapture } from "@/components/home/LeadCapture";

export const revalidate = 60;

// Archiwum poprzedniej strony głównej (awaryjnie). NIELINKOWANE z nawigacji i
// noindex - dostępne tylko pod tym adresem, gdyby trzeba było do niej wrócić.
export const metadata = { robots: { index: false, follow: false } };

export default async function PoprzedniaGlowna() {
  const [offers, team] = await Promise.all([getAllOffers(), getPublicTeamMembers()]);
  const founder = team.find((m) => m.kind === "founder");

  return (
    <>
      <Nav />
      <main className="flex-1">
        <OpeningReels offers={offers} />
        <OfficeVirtualTour />
        <HomeIntro
          founderName={founder?.name}
          founderRole={founder?.role}
          founderVideoId={founder?.cloudflareVideoId}
          founderPhotoUrl={founder?.photoUrl}
        />
        <Marquee />
        <SellWithFibra />
        <Process />
        <Manifesto />
        <LeadCapture />
      </main>
      <Footer />
    </>
  );
}
