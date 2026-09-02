import type { MetadataRoute } from "next";

const SITE_URL = "https://fibra.pl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Panel, bramki (kurs / „wkrótce" / Zamysłów), prywatna lista najmu
      // i strony robocze - poza indeksem. Same strony inwestycji (/zamyslow,
      // /osiedle-zamyslow, lokale) mają być indeksowane normalnie; do 7.09.2026
      // crawler i tak dostaje z bramki 307, potem wchodzi już bez przeszkód.
      // `/czy-inwestycja-...` zostaje zablokowane, dopóki to placeholder.
      disallow: ["/panel/", "/wkrotce", "/kurs/", "/jak-dzialamy", "/zamyslow-dostep", "/wynajem-zamyslow", "/czy-inwestycja-w-mieszkanie-jest-dla-mnie"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
