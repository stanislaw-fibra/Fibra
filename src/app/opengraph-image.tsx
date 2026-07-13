/**
 * Markowy obraz Open Graph dla CAŁEJ strony (segment root) - jest domyślnym
 * podglądem na socjalach dla strony głównej i każdej podstrony, która nie ma
 * własnego `opengraph-image` (kontakt, o-fibrze, dla-firm, kurs itd.).
 * Strona oferty nadpisuje go własnym, per-oferta (`oferty/[slug]`).
 *
 * Kompozycja premium (jak topowe agencje): jedno duże zdjęcie osiedla na pełnym
 * kadrze (ujęcie o zmierzchu z Zamysłowa) + subtelne przyciemnienie + wyśrodkowany
 * markowy znak z podpisem. Bez paneli i ścian tekstu - ma wyglądać jak wizytówka
 * agencji, nie jak auto-generowany placeholder.
 */
import { ImageResponse } from "next/og";
import {
  loadOgFonts,
  loadBrandLogoOnDark,
  loadLocalImageDataUri,
  BRAND_LOGO_RATIO,
  ogColors,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/og";

export const alt =
  "Fibra Nieruchomości - mieszkania, domy i działki w Rybniku, Radlinie i okolicach";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 86400;

const LOGO_W = 340;

export default async function Image() {
  const [fonts, logo, photo] = await Promise.all([
    loadOgFonts(),
    loadBrandLogoOnDark(),
    loadLocalImageDataUri("public/og/home-hero.jpg"),
  ]);

  const logoH = Math.round(LOGO_W / BRAND_LOGO_RATIO);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: ogColors.navy900,
          fontFamily: "Inter",
          color: ogColors.white,
        }}
      >
        {/* Zdjęcie na pełnym kadrze (cover) albo markowe tło, gdy brak pliku */}
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            width={OG_SIZE.width}
            height={OG_SIZE.height}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              backgroundImage: `linear-gradient(135deg, ${ogColors.navy800} 0%, ${ogColors.navy900} 100%)`,
            }}
          />
        )}

        {/* Delikatne przyciemnienie całości - żeby zdjęcie było stonowane i markowe */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(180deg, rgba(0,10,18,0.42) 0%, rgba(0,10,18,0.20) 34%, rgba(0,10,18,0.30) 62%, rgba(0,8,15,0.72) 100%)",
          }}
        />
        {/* Miękki środkowy „reflektor" - pod logo dla czytelności */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(closest-side at 50% 48%, rgba(0,12,22,0.55) 0%, rgba(0,12,22,0.28) 45%, rgba(0,12,22,0) 72%)",
          }}
        />

        {/* Wyśrodkowane logo - clean, bez podpisów */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={LOGO_W} height={logoH} alt="Fibra Nieruchomości" />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
