import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { SprzedajZFibraLanding } from "@/components/sprzedaj-z-fibra/SprzedajZFibraLanding";
import {
  cloudflareStreamIframeUrl,
  cloudflareStreamThumbnailViaDeliveryNet,
} from "@/lib/cloudflare-stream";

/** Krótki klip Stream z fallbackowych ofert - demo na landing (9:16). */
const SELL_PAGE_DEMO_STREAM_ID = "81b5480a03a58f68e910e288a96cc76a";

export const metadata = {
  title: "Sprzedaj z Fibrą - Fibra Nieruchomości",
  description:
    "Profesjonalna sprzedaż nieruchomości z filmem, spacerem 3D i strategią. Nie ogłoszenie - oferta, która sprzedaje.",
};

export default function SprzedajZFibraPage() {
  const filmEmbedSrc = cloudflareStreamIframeUrl(SELL_PAGE_DEMO_STREAM_ID);
  const filmPosterSrc = cloudflareStreamThumbnailViaDeliveryNet(SELL_PAGE_DEMO_STREAM_ID, {
    time: "1s",
    height: 1600,
  });

  return (
    <>
      <Nav />
      <main className="flex-1">
        <SprzedajZFibraLanding filmEmbedSrc={filmEmbedSrc} filmPosterSrc={filmPosterSrc} />
      </main>
      <Footer />
    </>
  );
}
