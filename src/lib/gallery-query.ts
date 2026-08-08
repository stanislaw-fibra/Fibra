import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type GalleryPhoto = {
  name: string;
  src: string;
  alt: string;
};

const BUCKET = "investment-gallery";

/**
 * Zdjęcia, które są w buckecie na dziś - kolejność tej listy to kolejność w galerii,
 * a `alt` idzie do SEO i czytników ekranu. Służy też za fallback, gdy listowanie
 * Storage nie wyjdzie (np. brak service-role przy buildzie) - wtedy galeria i tak
 * się wyświetli, bo bucket jest publiczny i URL da się złożyć z samego adresu projektu.
 *
 * Nowe pliki wrzucone do bucketa pojawią się w galerii bez zmiany w kodzie
 * (dostaną ogólny opis); wpis tutaj daje im tylko własny `alt`.
 */
const KNOWN_PHOTOS: ReadonlyArray<{ name: string; alt: string }> = [
  { name: "01_foto-01.webp", alt: "Gotowy budynek mieszkalny na osiedlu w Rybniku-Zamysłowie" },
  { name: "02_foto-04.webp", alt: "Budynek z garażami i kolejnym budynkiem w realizacji" },
  { name: "03_foto-13.webp", alt: "Osiedle w Rybniku-Zamysłowie z lotu ptaka" },
  { name: "04_foto-02.webp", alt: "Elewacja boczna gotowego budynku z balkonami" },
  { name: "05_foto-07.webp", alt: "Budynek, garaże i parking widziane z góry" },
  { name: "06_foto-12.webp", alt: "Budynek oddany do użytku obok budynku w budowie" },
  { name: "07_foto-17.webp", alt: "Osiedle i okoliczna zabudowa Rybnika-Zamysłowa" },
  { name: "08_foto-11.webp", alt: "Budynek mieszkalny z parkingiem i terenem zielonym" },
  { name: "09_foto-19.webp", alt: "Osiedle w otoczeniu pól i zieleni pod Rybnikiem" },
  { name: "10_foto-5.webp", alt: "Wcześniejsza realizacja Fibry - budynek z parkingiem" },
  { name: "11_foto-1.webp", alt: "Zabudowane osiedle Fibry z lotu ptaka" },
  { name: "12_foto-11-kopia.webp", alt: "Budynek mieszkalny na skraju osiedla" },
];

const CAPTIONS = new Map(KNOWN_PHOTOS.map((p) => [p.name, p.alt]));

const FALLBACK_ALT = "Zdjęcie z inwestycji Grupy Fibra";

/** Publiczny URL pliku w buckecie - bucket jest publiczny, więc wystarczy adres projektu. */
function publicUrl(name: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(name)}`;
}

function fallbackPhotos(): GalleryPhoto[] {
  return KNOWN_PHOTOS.flatMap((p) => {
    const src = publicUrl(p.name);
    return src ? [{ name: p.name, src, alt: p.alt }] : [];
  });
}

/**
 * Lista zdjęć galerii inwestycji prosto z bucketa `investment-gallery`.
 * Listowanie idzie service-rolem - nie ma polityki RLS na `storage.objects` dla anona,
 * a to i tak wyłącznie odczyt po stronie serwera. Kolejność bierze się z nazwy pliku
 * (prefiks `01_`, `02_`, ...), więc przestawienie zdjęć = zmiana nazwy w Storage.
 *
 * Gdy listowanie się nie uda albo nic nie zwróci, wracamy do listy `KNOWN_PHOTOS`,
 * żeby galeria nie została pusta.
 */
export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  try {
    const db = createSupabaseAdmin();
    const { data, error } = await db.storage.from(BUCKET).list("", { limit: 200 });
    if (error || !data) return fallbackPhotos();

    const photos = data
      .filter((f) => f.id !== null && /\.(webp|jpe?g|png|avif)$/i.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, "pl"))
      .flatMap((f) => {
        const src = db.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl;
        return src ? [{ name: f.name, src, alt: CAPTIONS.get(f.name) ?? FALLBACK_ALT }] : [];
      });

    return photos.length > 0 ? photos : fallbackPhotos();
  } catch {
    return fallbackPhotos();
  }
}
