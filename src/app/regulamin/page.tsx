import type { Metadata } from "next";
import { LegalArticleShell } from "@/components/legal/LegalArticleShell";
import { RegulaminPlaceholderContent } from "@/components/legal/RegulaminPlaceholderContent";

export const metadata: Metadata = {
  title: "Regulamin - Fibra Nieruchomości",
  description: "Regulamin serwisu fibranieruchomosci.pl - w przygotowaniu.",
  robots: { index: false, follow: false },
};

export default function RegulaminPage() {
  return (
    <LegalArticleShell>
      <RegulaminPlaceholderContent />
    </LegalArticleShell>
  );
}
