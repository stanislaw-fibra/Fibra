/**
 * Dane strukturalne (schema.org JSON-LD) na całą witrynę - niewidoczne dla
 * użytkownika, czytane przez Google i modele AI. Mówi wyszukiwarkom wprost:
 * to lokalne biuro nieruchomości w Radlinie/Rybniku, oto kontakt, obszar
 * działania i kanały social. Plus encja WebSite z akcją wyszukiwania (sitelinks
 * searchbox) celującą w katalog ofert (/?q=...).
 */

const SITE_URL = "https://fibra.pl";

const REAL_ESTATE_AGENT = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": `${SITE_URL}/#organization`,
  name: "Fibra Nieruchomości",
  legalName: "Grupa Fibra Sp. z o.o.",
  url: SITE_URL,
  image: `${SITE_URL}/web-app-manifest-512x512.png`,
  logo: `${SITE_URL}/web-app-manifest-512x512.png`,
  telephone: "+48 510 777 200",
  email: "biuro@grupafibra.pl",
  vatID: "PL6423147630",
  priceRange: "$$",
  areaServed: [
    "Rybnik",
    "Radlin",
    "Wodzisław Śląski",
    "Jastrzębie-Zdrój",
    "Żory",
    "Pszów",
    "Rydułtowy",
    "Czerwionka-Leszczyny",
    "Racibórz",
    "Knurów",
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "ul. Rymera 177",
    postalCode: "44-310",
    addressLocality: "Radlin",
    addressRegion: "śląskie",
    addressCountry: "PL",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 50.0586,
    longitude: 18.4669,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "16:00",
  },
  sameAs: [
    "https://www.facebook.com/fibra.radlin",
    "https://www.instagram.com/grupa_fibra/",
  ],
};

const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Fibra Nieruchomości",
  inLanguage: "pl-PL",
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export function SiteJsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(REAL_ESTATE_AGENT) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE) }}
      />
    </>
  );
}
