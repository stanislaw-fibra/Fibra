import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { OpeningReels } from "@/components/home/OpeningReels";
import { getAllOffers } from "@/lib/offers-query";
import { HomeIntro } from "@/components/home/HomeIntro";
import { SellWithFibra } from "@/components/home/SellWithFibra";
import { Process } from "@/components/home/Process";
import { Marquee } from "@/components/home/Marquee";
import { Manifesto } from "@/components/home/Manifesto";
import { LeadCapture } from "@/components/home/LeadCapture";

export const revalidate = 60;

export default async function Home() {
  const offers = await getAllOffers();

  return (
    <>
      <Nav />
      <main className="flex-1">
        <OpeningReels offers={offers} />
        <HomeIntro />
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
