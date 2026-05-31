import type { Metadata } from "next";
import Script from "next/script";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { DlaFirmLanding } from "@/components/dla-firm/DlaFirmLanding";

export const metadata: Metadata = {
  title: "Mieszkania dla firm - Rybnik, Wodzisław, Jastrzębie · Fibra Nieruchomości",
  description:
    "Wynajem mieszkania dla firmy na zachodnim Śląsku: umeblowane mieszkania służbowe, faktura VAT, jeden kontakt, umowy od 3 miesięcy. Mieszkania dla pracowników w Rybniku, Wodzisławiu, Jastrzębiu, Żorach i Radlinie.",
  keywords: [
    "mieszkanie dla pracownika",
    "wynajem mieszkania dla firm",
    "wynajem mieszkania na firmę",
    "mieszkania służbowe Śląsk",
    "mieszkania dla pracowników Rybnik",
    "mieszkania dla pracowników Wodzisław",
    "mieszkania dla pracowników Jastrzębie",
    "najem korporacyjny Śląsk",
    "zakwaterowanie pracowników",
    "faktura VAT za wynajem mieszkania",
    "mieszkanie służbowe",
    "najem instytucjonalny",
  ],
  alternates: { canonical: "/dla-firm" },
  openGraph: {
    title: "Mieszkania dla firm - Rybnik, Wodzisław, Jastrzębie",
    description:
      "Umeblowane mieszkania na wynajem dla firm. Faktura VAT, jeden kontakt, umowy od 3 miesięcy. Zachodni Śląsk: Rybnik, Wodzisław, Jastrzębie, Żory.",
    url: "/dla-firm",
    type: "website",
    locale: "pl_PL",
  },
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Czy wystawiacie fakturę VAT za najem mieszkania dla firmy?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Tak. Umowę zawieramy bezpośrednio z firmą i co miesiąc wystawiamy fakturę VAT na dane spółki. Standardowo jedna zbiorcza faktura za wszystkie wynajęte mieszkania w miesiącu.",
      },
    },
    {
      "@type": "Question",
      name: "Jaka jest minimalna długość umowy najmu na firmę?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Najczęściej zawieramy umowy na 3, 6, 12 lub 24 miesiące. Krótsze umowy dla ekip montażowych są możliwe - wymagają indywidualnej rozmowy.",
      },
    },
    {
      "@type": "Question",
      name: "Czy obsługujecie pracowników z zagranicy?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Tak. Mówimy po polsku, angielsku i ukraińsku - pracownika wprowadzamy bez pośrednictwa Twojego HR. W razie potrzeby pomagamy z meldunkiem czasowym.",
      },
    },
    {
      "@type": "Question",
      name: "Jak szybko można podpisać umowę i wprowadzić pracownika?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Od pierwszego telefonu do kluczy w ręku zwykle 5–10 dni roboczych. Przy gotowym mieszkaniu i podpisanej umowie klucze możemy wydać następnego dnia.",
      },
    },
    {
      "@type": "Question",
      name: "Czy mogę zaliczyć koszt najmu mieszkania pracowniczego w koszty firmy?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Najem mieszkania dla pracownika jest standardowo kosztem uzyskania przychodu. W kwestii VAT zalecamy konsultację z księgową - orzecznictwo NSA jest korzystne, ale praktyka skarbówki bywa różna.",
      },
    },
  ],
};

const SERVICE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Wynajem mieszkania dla firmy",
  provider: {
    "@type": "RealEstateAgent",
    name: "Grupa Fibra Sp. z o.o.",
    telephone: "+48 510 777 200",
    email: "biuro@grupafibra.pl",
    address: {
      "@type": "PostalAddress",
      streetAddress: "ul. Rymera 177",
      postalCode: "44-310",
      addressLocality: "Radlin",
      addressCountry: "PL",
    },
  },
  areaServed: [
    "Rybnik",
    "Wodzisław Śląski",
    "Jastrzębie-Zdrój",
    "Żory",
    "Radlin",
    "Pszów",
    "Rydułtowy",
    "Czerwionka-Leszczyny",
    "Racibórz",
    "Knurów",
  ],
  audience: {
    "@type": "BusinessAudience",
    audienceType: "Firmy zatrudniające pracowników spoza regionu",
  },
};

export default function DlaFirmPage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <DlaFirmLanding />
      </main>
      <Footer />
      <Script
        id="b2b-faq-jsonld"
        type="application/ld+json"
        // dane statyczne, generowane na serwerze
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <Script
        id="b2b-service-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_JSON_LD) }}
      />
    </>
  );
}
