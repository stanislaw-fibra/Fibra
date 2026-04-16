import type { Offer } from "@/lib/offers";

export type OfferParamItem = {
  label: string;
  value: string;
  href?: string;
};

function trimText(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function addBool(out: OfferParamItem[], label: string, v: boolean | undefined) {
  if (v === true) out.push({ label, value: "Tak" });
}

/**
 * Parametry na ciemną sekcję strony oferty — tylko to, czego nie ma w górnych
 * kartach SpecCard (cena, powierzchnia podstawowa, pokoje, piętro, rok, parking, działka, energetyka).
 * Uzupełniane w miarę rozwoju eksportu z Galactiki.
 */
export function getOfferExtendedParamItems(offer: Offer): OfferParamItem[] {
  const out: OfferParamItem[] = [];

  const add = (label: string, value: unknown) => {
    const t = trimText(value);
    if (t) out.push({ label, value: t });
  };

  if (offer.listingType === "wynajem") {
    out.push({ label: "Typ oferty", value: "Wynajem" });
  } else if (offer.listingType === "sprzedaz") {
    out.push({ label: "Typ oferty", value: "Sprzedaż" });
  }

  if (offer.isPriceNegotiable === true) {
    out.push({ label: "Cena", value: "Do negocjacji" });
  }

  const au = offer.areaUsableM2;
  const at = offer.areaTotalM2;
  if (offer.kind !== "grunt" && au != null && au > 0 && at != null && at > 0 && Math.round(at) !== Math.round(au)) {
    add("Powierzchnia całkowita", `${Math.round(at)} m²`);
  }

  add("Liczba sypialni", offer.bedrooms);
  add("Liczba łazienek", offer.bathrooms);

  add("Ogrzewanie", offer.heating);
  add("Materiał budowy", offer.buildingMaterial);
  add("Stan budynku", offer.buildingState);
  add("Stan nieruchomości", offer.propertyState);
  add("Kuchnia", offer.kitchenType);
  add("Rynek", offer.marketType);

  addBool(out, "Balkon", offer.hasBalcony);
  addBool(out, "Taras", offer.hasTerrace);
  addBool(out, "Piwnica", offer.hasBasement);
  addBool(out, "Ogród", offer.hasGarden);
  addBool(out, "Loggia", offer.hasLoggia);
  addBool(out, "Winda", offer.hasElevator);
  addBool(out, "Klimatyzacja", offer.hasAirConditioning);

  const tour = trimText(offer.virtualTourUrl);
  if (tour) {
    out.push({ label: "Wirtualny spacer", value: "Otwórz link", href: tour });
  }

  return out;
}

/** Fallback dla mocków: krótkie punkty bez numeracji. */
export function highlightFallbackItems(offer: Offer): OfferParamItem[] {
  const h = offer.highlights;
  if (!h?.length) return [];
  return h.map((value) => ({ label: "Wyróżnik", value }));
}
