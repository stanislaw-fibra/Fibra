import type { Offer, OfferKind } from "@/lib/offers";
import { OfferListingTypeTag } from "@/components/offers/OfferListingTypeTag";
import { OfferKindTag } from "@/components/offers/OfferKindTag";

type Props = {
  listingType?: Offer["listingType"];
  kind?: OfferKind;
  kindLabel?: string;
};

/**
 * Pasek nad tytułem oferty: typ nieruchomości (dom/mieszkanie/działka) + transakcja (zakup/wynajem).
 * Klient zwracał uwagę, że na mobile typ oferty był w ogóle niewidoczny dopóki nie zjechało się
 * w dół strony - dlatego oba chipy stoją tu razem, są wyraziste i pojawiają się jeszcze przed
 * pierwszym wierszem hero (zarówno w widoku desktop, jak i mobile).
 */
export function OfferListingHighlight({ listingType, kind, kindLabel }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {kindLabel ? (
        <OfferKindTag kind={kind} kindLabel={kindLabel} variant="page-hero" />
      ) : null}
      <OfferListingTypeTag listingType={listingType} variant="page" />
    </div>
  );
}
