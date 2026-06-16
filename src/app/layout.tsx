import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { AnalyticsScripts } from "@/components/consent/AnalyticsScripts";
import { getCloudflareStreamCustomerCode } from "@/lib/cloudflare-stream";
import "./globals.css";

// Cookiebot CBID - z panelu manage.cookiebot.com (Bartosz, 2026-05-12).
// Tryb data-blockingmode="auto" - Cookiebot sam blokuje znane trackery przed
// uzyskaniem zgody, więc nie trzeba ręcznie gate'ować GA/FB Pixel.
const COOKIEBOT_CBID = "f74cf9e3-5a07-4574-bc83-3e970cfa9d62";

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

export const metadata: Metadata = {
  title: "Fibra Nieruchomości - Rybnik, Radlin, region",
  description:
    "Fibra Nieruchomości - wideo, wirtualny spacer 3D i pełna obsługa transakcji. Powiat rybnicki i wodzisławski, biuro w Radlinie.",
  metadataBase: new URL("https://fibra.pl"),
  openGraph: {
    title: "Fibra Nieruchomości",
    description:
      "Znajdź swoje miejsce - zobaczysz je w wideo i spacerze 3D, zanim tam wejdziesz. Radlin, Rybnik i okolice.",
    type: "website",
    locale: "pl_PL",
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
        {/* Cookiebot - MUSI być pierwszym skryptem w <head>, przed jakimkolwiek trackerem.
            data-blockingmode="auto" automatycznie blokuje GA/FB Pixel/inne znane skrypty
            dopóki użytkownik nie zaakceptuje przez baner.

            UWAGA: używamy raw <script> zamiast next/script <Script>, bo Cookiebot
            po załadowaniu PRZEPISUJE swój <script> (zmienia src na consentcdn,
            dodaje type/charset), co generuje hydration mismatch z next/script.
            `suppressHydrationWarning` tłumi ostrzeżenie React (mod jest oczekiwany). */}
        <script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid={COOKIEBOT_CBID}
          data-blockingmode="auto"
          suppressHydrationWarning
        />
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
        {children}
        {/* Baner consent dostarcza Cookiebot (uc.js w <head>). AnalyticsScripts emituje
            trackery, ale są blokowane przez Cookiebot do czasu uzyskania zgody. */}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
