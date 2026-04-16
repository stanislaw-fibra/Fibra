import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Fibra Nieruchomości — Rybnik, Radlin, region",
  description:
    "Fibra Nieruchomości — wideo, wirtualny spacer 3D i pełna obsługa transakcji. Powiat rybnicki i wodzisławski, biuro w Radlinie.",
  metadataBase: new URL("https://fibranieruchomosci.pl"),
  openGraph: {
    title: "Fibra Nieruchomości",
    description:
      "Znajdź swoje miejsce — zobaczysz je w wideo i spacerze 3D, zanim tam wejdziesz. Radlin, Rybnik i okolice.",
    type: "website",
    locale: "pl_PL",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pl"
      className={`${inter.variable} ${instrument.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-paper)] text-ink-900">
        {children}
      </body>
    </html>
  );
}
