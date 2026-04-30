import type { Offer } from "@/lib/offers";
import { OfferListingTypeTag } from "@/components/offers/OfferListingTypeTag";

type Props = {
  listingType?: Offer["listingType"];
};

/** Tag transakcji nad treścią oferty. Typ nieruchomości (mieszkanie/dom/działka)
 *  pojawia się już w wierszu lokalizacji, więc tutaj zostawiamy tylko Zakup / Wynajem. */
export function OfferListingHighlight({ listingType }: Props) {
  return (
    <div className="mb-6">
      <OfferListingTypeTag listingType={listingType} variant="page" />
    </div>
  );
}
