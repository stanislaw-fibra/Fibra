/**
 * Markowy obraz Open Graph dla CAŁEJ strony (segment root) - jest domyślnym
 * podglądem na socjalach dla strony głównej i każdej podstrony, która nie ma
 * własnego `opengraph-image` (kontakt, o-fibrze, dla-firm, kurs itd.).
 * Strona oferty nadpisuje go własnym, per-oferta (`oferty/[slug]`).
 */
import { ImageResponse } from "next/og";
import { loadOgFonts, ogColors, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const alt =
  "Fibra Nieruchomości - mieszkania, domy i działki w Rybniku, Radlinie i okolicach";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: ogColors.navy900,
          backgroundImage: `linear-gradient(135deg, ${ogColors.navy800} 0%, ${ogColors.navy900} 62%, #000c16 100%)`,
          color: ogColors.white,
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* Ciepła poświata marki w prawym dolnym rogu */}
        <div
          style={{
            position: "absolute",
            right: -160,
            bottom: -200,
            width: 620,
            height: 620,
            borderRadius: 620,
            backgroundImage: `radial-gradient(closest-side, rgba(242,101,34,0.34), rgba(242,101,34,0))`,
            display: "flex",
          }}
        />

        {/* Nagłówek: wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 16,
              height: 44,
              borderRadius: 4,
              backgroundColor: ogColors.accent,
              display: "flex",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Instrument Serif",
                fontSize: 50,
                lineHeight: 1,
                color: ogColors.white,
              }}
            >
              Fibra
            </div>
            <div
              style={{
                fontSize: 17,
                letterSpacing: 6,
                fontWeight: 600,
                color: ogColors.brand200,
              }}
            >
              NIERUCHOMOŚCI
            </div>
          </div>
        </div>

        {/* Główny komunikat */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontFamily: "Instrument Serif",
              fontSize: 70,
              lineHeight: 1.06,
              color: ogColors.white,
            }}
          >
            Mieszkania, domy i działki w Rybniku, Radlinie i okolicach
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              color: ogColors.brand100,
              maxWidth: 880,
            }}
          >
            Każdą ofertę zobaczysz na wideo i w wirtualnym spacerze 3D.
          </div>
        </div>

        {/* Stopka */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 24px",
              borderRadius: 999,
              backgroundColor: ogColors.accent,
              color: ogColors.white,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            fibra.pl
          </div>
          <div style={{ display: "flex", fontSize: 24, color: ogColors.brand200 }}>
            Pełna obsługa zakupu, sprzedaży i wynajmu
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
