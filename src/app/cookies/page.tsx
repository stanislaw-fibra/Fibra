import type { Metadata } from "next";
import { LegalArticleShell } from "@/components/legal/LegalArticleShell";
import { CookiesPolicyContent } from "@/components/legal/CookiesPolicyContent";

export const metadata: Metadata = {
  title: "Polityka cookies - Fibra Nieruchomości",
  description: "Informacje o plikach cookies w serwisie fibranieruchomosci.pl.",
  robots: { index: false, follow: false },
};

export default function CookiesPage() {
  return (
    <LegalArticleShell>
      <CookiesPolicyContent />
    </LegalArticleShell>
  );
}
