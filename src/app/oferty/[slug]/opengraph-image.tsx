/**
 * Obraz Open Graph per-oferta: zdjęcie nieruchomości na pełnym kadrze 1200x630,
 * przyciemnione od dołu, z markowym paskiem (lokalizacja, tytuł, cena, metraż,
 * liczba pokoi). Dzięki temu udostępniony link do oferty zawsze wygląda
 * intencjonalnie, niezależnie od proporcji oryginalnego zdjęcia.
 *
 * Gdy zdjęcia brak (lub nie udało się pobrać) - markowy fallback z tytułem.
 */
import { ImageResponse } from "next/og";
import { getOfferBySlug } from "@/lib/offers-query";
import { priceFormat } from "@/lib/offers";
import {
  loadOgFonts,
  ogColors,
  OG_SIZE,
  OG_CONTENT_TYPE,
  fetchImageDataUri,
  clampText,
} from "@/lib/og";

export const alt = "Oferta - Fibra Nieruchomości";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// Karta OG odświeżana raz dziennie (zdjęcie/cena rzadko się zmieniają).
export const revalidate = 86400;

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 11,
          height: 30,
          borderRadius: 3,
          backgroundColor: ogColors.accent,
          display: "flex",
        }}
      />
      <div
        style={{
          fontFamily: "Instrument Serif",
          fontSize: 34,
          color: ogColors.white,
          lineHeight: 1,
        }}
      >
        Fibra
      </div>
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [offer, fonts] = await Promise.all([getOfferBySlug(slug), loadOgFonts()]);

  // Brak oferty - neutralna markowa karta (nie wysypujemy buildu).
  if (!offer) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: ogColors.navy900,
            color: ogColors.white,
            fontFamily: "Instrument Serif",
            fontSize: 64,
          }}
        >
          Fibra Nieruchomości
        </div>
      ),
      { ...size, fonts },
    );
  }

  const photo = await fetchImageDataUri(offer.gallery?.find(Boolean) ?? offer.poster);
  const transakcja = offer.listingType === "wynajem" ? "Na wynajem" : "Na sprzedaż";
  const place = [offer.kindLabel, offer.district ?? offer.city]
    .filter(Boolean)
    .join(" · ");
  const title = clampText(offer.title, 84);
  // Kwota z `priceFrom` (priceLabel to tylko caption typu „Cena miesięczna").
  // priceFormat zwraca „Cena na zapytanie", gdy brak ceny. Wynajem -> „/ mc".
  const price =
    priceFormat(offer.priceFrom) +
    (offer.priceFrom && offer.listingType === "wynajem" ? " / mc" : "");

  // Parametry liczbowe jako "chipy" (tylko te, które mamy).
  const stats: string[] = [];
  if (offer.area) stats.push(`${offer.area} m²`);
  if (offer.rooms) stats.push(`${offer.rooms} ${offer.rooms === 1 ? "pokój" : "pok."}`);
  if (offer.kind === "grunt" && offer.powDzialkiM2)
    stats.push(`działka ${offer.powDzialkiM2} m²`);

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
        {/* Zdjęcie pełnokadrowe (cover) lub markowe tło */}
        {photo ? (
          <img
            src={photo}
            width={OG_SIZE.width}
            height={OG_SIZE.height}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
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

        {/* Przyciemnienie od dołu (czytelność tekstu) + delikatne od góry */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to top, rgba(0,9,17,0.94) 6%, rgba(0,9,17,0.55) 38%, rgba(0,9,17,0.12) 64%, rgba(0,9,17,0.45) 100%)",
          }}
        />

        {/* Górny pasek: wordmark + typ transakcji */}
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 56,
            right: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Wordmark />
          <div
            style={{
              display: "flex",
              padding: "9px 20px",
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.28)",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {transakcja}
          </div>
        </div>

        {/* Dolny blok informacyjny */}
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 52,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {place ? (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: ogColors.brand100,
              }}
            >
              {place}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              fontFamily: "Instrument Serif",
              fontSize: 56,
              lineHeight: 1.05,
              color: ogColors.white,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 26px",
                borderRadius: 14,
                backgroundColor: ogColors.accent,
                color: ogColors.white,
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              {price}
            </div>
            {stats.map((s) => (
              <div
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 22px",
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.24)",
                  fontSize: 30,
                  fontWeight: 600,
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
