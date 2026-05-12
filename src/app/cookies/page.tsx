import type { Metadata } from "next";
import { LegalArticleShell } from "@/components/legal/LegalArticleShell";
import { CookiesPolicyContent } from "@/components/legal/CookiesPolicyContent";
import { CookieDeclaration } from "@/components/legal/CookieDeclaration";

export const metadata: Metadata = {
  title: "Polityka cookies - Fibra Nieruchomości",
  description: "Informacje o plikach cookies w serwisie fibranieruchomosci.pl.",
  robots: { index: false, follow: false },
};

// CBID Cookiebot — to samo ID co w layout.tsx.
const COOKIEBOT_CBID = "f74cf9e3-5a07-4574-bc83-3e970cfa9d62";

export default function CookiesPage() {
  return (
    <LegalArticleShell>
      <CookiesPolicyContent />
      {/* Cookiebot CookieDeclaration — automatycznie aktualizowana lista cookies. */}
      <section className="mt-10 border-t border-ink-200 pt-8">
        <h2 className="text-[18px] font-semibold text-ink-900 sm:text-[20px]">
          Aktualna lista cookies
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-600 sm:text-[14px]">
          Poniższa lista jest generowana automatycznie przez Cookiebot — odzwierciedla
          aktualny stan plików cookies używanych przez serwis.
        </p>
        <div className="mt-6">
          <CookieDeclaration cbid={COOKIEBOT_CBID} />
        </div>
      </section>
    </LegalArticleShell>
  );
}
