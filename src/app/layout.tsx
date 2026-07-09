import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { AnalyticsScripts } from "@/components/consent/AnalyticsScripts";
import { MetaPixelPageView } from "@/components/consent/MetaPixelPageView";
import { CookiebotLoader } from "@/components/consent/CookiebotLoader";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { getCloudflareStreamCustomerCode } from "@/lib/cloudflare-stream";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
});

const SITE_URL = "https://fibra.pl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Domyślny tytuł = strona główna (katalog), nasycony lokalnymi frazami.
  // Świadomie BEZ szablonu „%s | …", bo podstrony już zawierają sufiks marki
  // w swoich tytułach - szablon dublowałby go.
  title:
    "Mieszkania i nieruchomości - Rybnik, Radlin, Wodzisław | Fibra Nieruchomości",
  description:
    "Mieszkania, domy i działki na sprzedaż oraz wynajem w Rybniku, Radlinie i okolicach. Każdą ofertę zobaczysz na wideo i w wirtualnym spacerze 3D. Fibra Nieruchomości - pełna obsługa transakcji.",
  applicationName: "Fibra Nieruchomości",
  keywords: [
    "mieszkania Rybnik",
    "mieszkania na sprzedaż Rybnik",
    "mieszkania na wynajem Rybnik",
    "nieruchomości Rybnik",
    "domy na sprzedaż Rybnik",
    "działki Rybnik",
    "mieszkania Radlin",
    "nieruchomości Radlin",
    "mieszkania Wodzisław Śląski",
    "biuro nieruchomości Rybnik",
    "mieszkania na wynajem Radlin",
    "Fibra Nieruchomości",
  ],
  authors: [{ name: "Fibra Nieruchomości", url: SITE_URL }],
  creator: "Fibra Nieruchomości",
  publisher: "Grupa Fibra Sp. z o.o.",
  category: "real estate",
  alternates: { canonical: "/" },
  formatDetection: { telephone: true, address: true, email: true },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: SITE_URL,
    siteName: "Fibra Nieruchomości",
    title: "Mieszkania i nieruchomości - Rybnik, Radlin, Wodzisław | Fibra",
    description:
      "Mieszkania, domy i działki na sprzedaż i wynajem w Rybniku i okolicach. Każdą ofertę zobaczysz na wideo i w spacerze 3D.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mieszkania i nieruchomości - Rybnik, Radlin | Fibra",
    description:
      "Oferty na wideo i w wirtualnym spacerze 3D. Rybnik, Radlin, Wodzisław i okolice.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cfCustomerCode = getCloudflareStreamCustomerCode();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? null;

  return (
    <html
      lang="pl"
      className={`${inter.variable} ${instrument.variable} h-full scroll-smooth`}
    >
      <head>
        {/* Preconnect do źródeł LCP (posterów wideo). Oszczędza ~300 ms TTFB dla pierwszych kafelków hero. */}
        <link rel="preconnect" href="https://videodelivery.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://videodelivery.net" />
        {cfCustomerCode ? (
          <>
            <link
              rel="preconnect"
              href={`https://customer-${cfCustomerCode}.cloudflarestream.com`}
              crossOrigin="anonymous"
            />
            <link
              rel="dns-prefetch"
              href={`https://customer-${cfCustomerCode}.cloudflarestream.com`}
            />
          </>
        ) : null}
        {supabaseUrl ? (
          <>
            <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseUrl} />
          </>
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-paper)] text-ink-900">
        <SiteJsonLd />
        <AttributionCapture />
        {children}
        {/* Cookiebot ładowany PO hydracji (CookiebotLoader, useEffect) - inaczej React
            kasuje wstrzyknięty baner podczas hydracji. AnalyticsScripts emituje trackery
            tagowane type="text/plain", aktywowane przez Cookiebot dopiero po zgodzie. */}
        <CookiebotLoader />
        <AnalyticsScripts />
        <MetaPixelPageView />
      </body>
    </html>
  );
}
