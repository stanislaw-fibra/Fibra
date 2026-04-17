import type { Metadata } from "next";
import { LegalArticleShell } from "@/components/legal/LegalArticleShell";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Polityka prywatności - Fibra Nieruchomości",
  description: "Polityka prywatności serwisu fibranieruchomosci.pl - GRUPA FIBRA Sp. z o.o.",
  robots: { index: false, follow: false },
};

export default function PolitykaPrywatnosciPage() {
  return (
    <LegalArticleShell>
      <PrivacyPolicyContent />
    </LegalArticleShell>
  );
}
