import type { Offer } from "@/lib/offers";
import { OfferListingTypeTag } from "@/components/offers/OfferListingTypeTag";

type Props = {
  listingType?: Offer["listingType"];
};

/** Tag transakcji nad treścią oferty — ten sam język wizualny co w katalogu. */
export function OfferListingHighlight({ listingType }: Props) {
  return (
    <div className="mb-6">
      <OfferListingTypeTag listingType={listingType} variant="page" />
    </div>
  );
}
