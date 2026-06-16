import type { MetadataRoute } from "next";

const SITE_URL = "https://fibra.pl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Panel, bramka „wkrótce", portal kursu i strony robocze - poza indeksem.
      disallow: ["/panel/", "/wkrotce", "/kurs/", "/jak-dzialamy", "/zamyslow-dostep"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
