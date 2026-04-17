import { LegalCallout, LegalPageHeader } from "./LegalPagePrimitives";

export function RegulaminPlaceholderContent() {
  return (
    <>
      <LegalPageHeader eyebrow="Regulamin" title="Regulamin serwisu" showUpdated={false} />
      <p className="text-[15px] leading-relaxed text-ink-700">
        Regulamin serwisu jest w przygotowaniu. W razie pytań prosimy o kontakt:
      </p>
      <LegalCallout>
        <a href="mailto:biuro@grupafibra.pl" className="text-[15px] font-medium text-ink-900">
          biuro@grupafibra.pl
        </a>
      </LegalCallout>
    </>
  );
}
