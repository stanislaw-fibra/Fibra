import type { MetadataRoute } from "next";
import { getAllActiveOffers } from "@/lib/offers-query";

const SITE_URL = "https://fibra.pl";

// Sitemap odświeżany co godzinę (oferty dochodzą/wychodzą z importu VIRGO).
export const revalidate = 3600;

const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/sprzedaj-z-fibra", priority: 0.8, changeFrequency: "monthly" },
  { path: "/o-fibrze", priority: 0.7, changeFrequency: "monthly" },
  { path: "/kontakt", priority: 0.6, changeFrequency: "yearly" },
  { path: "/kurs-20-lekcji-inwestora", priority: 0.6, changeFrequency: "monthly" },
  { path: "/regulamin", priority: 0.2, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  let offers: Awaited<ReturnType<typeof getAllActiveOffers>> = [];
  try {
    offers = await getAllActiveOffers();
  } catch {
    // Brak bazy / błąd — sitemap nadal zwraca strony statyczne.
    offers = [];
  }

  const offerEntries: MetadataRoute.Sitemap = offers
    .filter((o) => o.slug)
    .map((o) => ({
      url: `${SITE_URL}/oferty/${o.slug}`,
      lastModified: o.updatedAt ? new Date(o.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.9,
    }));

  return [...staticEntries, ...offerEntries];
}
