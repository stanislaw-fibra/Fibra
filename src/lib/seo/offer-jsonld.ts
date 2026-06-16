import type { Offer } from "@/lib/offers";

/**
 * Dane strukturalne pojedynczej oferty (schema.org). Niewidoczne dla
 * użytkownika - dają Google i modelom AI twarde fakty: typ nieruchomości,
 * cena, powierzchnia, liczba pokoi, lokalizacja. Zwraca tablicę obiektów
 * (nieruchomość + okruszki nawigacyjne) gotowych do wstrzyknięcia jako
 * <script type="application/ld+json">.
 */

const SITE_URL = "https://fibra.pl";

function schemaTypeForKind(kind: Offer["kind"]): string {
  switch (kind) {
    case "apartament":
    case "penthouse":
      return "Apartment";
    case "dom":
      return "House";
    case "grunt":
      return "Place";
    case "lokal":
      return "Place";
    default:
      return "Residence";
  }
}

export function buildOfferJsonLd(offer: Offer): Record<string, unknown>[] {
  const url = `${SITE_URL}/oferty/${offer.slug}`;
  const area = offer.areaUsableM2 ?? offer.area;
  const images = (offer.gallery ?? []).filter(Boolean).slice(0, 6);

  const residence: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaTypeForKind(offer.kind),
    name: offer.title,
    description: offer.excerpt || offer.subtitle || offer.title,
    url,
    ...(images.length ? { image: images } : {}),
    ...(offer.refNumber ? { sku: offer.refNumber } : {}),
    ...(offer.rooms ? { numberOfRooms: offer.rooms } : {}),
    ...(offer.bedrooms ? { numberOfBedroomsTotal: offer.bedrooms } : {}),
    ...(area
      ? {
          floorSize: {
            "@type": "QuantitativeValue",
            value: area,
            unitCode: "MTK",
          },
        }
      : {}),
    address: {
      "@type": "PostalAddress",
      ...(offer.district ? { streetAddress: offer.district } : {}),
      addressLocality: offer.city || "Rybnik",
      addressRegion: "śląskie",
      addressCountry: "PL",
    },
  };

  if (offer.priceFrom && offer.priceFrom > 0) {
    residence.offers = {
      "@type": "Offer",
      price: offer.priceFrom,
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      url,
      businessFunction:
        offer.listingType === "wynajem"
          ? "http://purl.org/goodrelations/v1#LeaseOut"
          : "http://purl.org/goodrelations/v1#Sell",
    };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Strona główna", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Oferty", item: `${SITE_URL}/oferty` },
      { "@type": "ListItem", position: 3, name: offer.title, item: url },
    ],
  };

  return [residence, breadcrumb];
}
