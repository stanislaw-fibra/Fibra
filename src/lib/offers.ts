/**
 * Oferty - dane demonstracyjne dla regionu Fibry (powiat rybnicki / wodzisławski).
 * Docelowo: Galactica + Cloudflare Stream.
 */

export type OfferKind = "apartament" | "dom" | "penthouse" | "lokal" | "grunt";

export interface Offer {
  /** Gdy oferta z Supabase - ten sam co `slug` w URL (uuid). */
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  city: string;
  district?: string;
  kind: OfferKind;
  kindLabel: string;
  area: number;
  rooms?: number;
  priceFrom?: number;
  priceLabel?: string;
  tagline: string;
  excerpt: string;
  /** Krótkie punkty (np. mocki) - gdy brak parametrów z bazy, sekcja na stronie oferty może je pokazać jako fallback. */
  highlights?: string[];
  /** Pełny opis z CRM / Supabase (`description`) - wyświetlany jako jeden blok, bez dzielenia na zdania. */
  fullDescription?: string;
  poster: string;
  videoSrc?: string;
  /** Cloudflare Stream - krótki klip (karty, hero). */
  streamId?: string;
  /** Cloudflare Stream - dłuższy klip na stronie oferty, jeśli jest w bazie. */
  streamIdLong?: string;
  gallery?: string[];
  isNew?: boolean;
  isExclusive?: boolean;
  refNumber?: string;
  body?: string[];
  rokBudowy?: number;
  pietro?: string;
  miejscParkingowych?: number;
  powDzialkiM2?: number;
  energetyka?: string;
  statusOferty?: "wolna" | "w rozmowach" | "zarezerwowana";
  /** Z bazy: `sprzedaz` | `wynajem` */
  listingType?: "sprzedaz" | "wynajem";
  bedrooms?: number;
  bathrooms?: number;
  /** Pow. użytkowa (m²), gdy znana osobno od głównego `area`. */
  areaUsableM2?: number;
  /** Pow. całkowita (m²). */
  areaTotalM2?: number;
  buildingMaterial?: string;
  buildingState?: string;
  propertyState?: string;
  heating?: string;
  kitchenType?: string;
  marketType?: string;
  hasBalcony?: boolean;
  hasTerrace?: boolean;
  hasBasement?: boolean;
  hasGarden?: boolean;
  hasLoggia?: boolean;
  hasElevator?: boolean;
  hasAirConditioning?: boolean;
  isPriceNegotiable?: boolean;
  virtualTourUrl?: string;
  /** Link do YouTube z Galactiki (param „wideo"). Fallback hero i landing page. */
  youtubeUrl?: string;
  /** Flaga — true gdy oferta ma krótki, pionowy film (Cloudflare Stream). */
  hasShortVideo?: boolean;
  /** Data ostatniej aktualizacji (ISO) — do sortowania w katalogu. */
  updatedAt?: string;
  /** Agent przypisany do oferty (z Galactiki / panelu). */
  agentName?: string;
  agentPhone?: string;
  agentPhoneOffice?: string;
  agentEmail?: string;
}

const u = (id: string, w = 1200, h = 1500) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=82`;

const streamPoster = (streamId: string, height = 1200) =>
  `https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=${height}`;

const streamFrame = (streamId: string, time: string, height = 1600) =>
  `https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg?time=${time}&height=${height}`;

const streamGallery = (streamId: string, extras: string[] = []) =>
  [
    streamPoster(streamId, 1600),
    streamFrame(streamId, "5s"),
    streamFrame(streamId, "14s"),
    ...extras,
  ];

const interiors = (...ids: string[]) => ids.map((id) => u(id));

export const OFFERS: Offer[] = [
  {
    slug: "mieszkanie-rybnik-zalew-smolna",
    title: "Mieszkanie przy Zalewie · Smolna",
    subtitle: "Widok na wodę, balkon, winda",
    city: "Rybnik",
    district: "Zalew",
    kind: "apartament",
    kindLabel: "Mieszkanie",
    area: 68,
    rooms: 3,
    priceFrom: 520_000,
    tagline: "Codzienny spacer nad zalewem.",
    excerpt:
      "Jasne mieszkanie z balkonem w stronę zalewu. Spokojna ulica, szybki dojazd do centrum Rybnika i obwodnicy.",
    highlights: ["Widok na zalew", "Balkon 9 m²", "Komórka", "Parking naziemny"],
    streamId: "81b5480a03a58f68e910e288a96cc76a",
    poster: streamPoster("81b5480a03a58f68e910e288a96cc76a"),
    videoSrc: "https://cdn.pixabay.com/video/2023/10/19/185259-877424987_large.mp4",
    isExclusive: true,
    refNumber: "FIB-RS-4801",
    rokBudowy: 2018,
    pietro: "4 / 5",
    miejscParkingowych: 1,
    energetyka: "B",
    statusOferty: "wolna",
    body: [
      "Układ: salon z aneksem kuchennym, dwie sypialnie, łazienka z oknem. Stolarka trzyszybowa, ogrzewanie miejskie.",
      "W okolicy sklepy, przedszkole i ścieżki spacerowe wzdłuż zalewu - idealne dla rodziny lub pod wynajem krótkoterminowy.",
    ],
    gallery: streamGallery("81b5480a03a58f68e910e288a96cc76a", [u("photo-1600585154340-be6161a56a0c")]),
  },
  {
    slug: "dom-kornowac-pogorze",
    title: "Dom z ogrodem · Kornowac",
    subtitle: "Parter + poddasze, garaż",
    city: "Kornowac",
    district: "Pogrzebień",
    kind: "dom",
    kindLabel: "Dom",
    area: 142,
    rooms: 5,
    priceFrom: 780_000,
    tagline: "Miejsce na grill i dla dzieci.",
    excerpt:
      "Dom w zabudowie wolnostojącej z ogródkiem ok. 450 m². Cicha okolica, dobry dojazd do Rybnika i Raciborza.",
    highlights: ["Ogród", "Garaż", "Poddasze do aranżacji", "Ekspozycja południowa"],
    streamId: "913fdfcbaf9daf04d02a24b8564894ea",
    poster: streamPoster("913fdfcbaf9daf04d02a24b8564894ea"),
    videoSrc: "https://cdn.pixabay.com/video/2019/10/08/27787-365224634_large.mp4",
    isExclusive: true,
    refNumber: "FIB-RS-4802",
    rokBudowy: 2012,
    pietro: "Parter + 1",
    miejscParkingowych: 2,
    powDzialkiM2: 620,
    energetyka: "C",
    statusOferty: "w rozmowach",
    body: [
      "Na parterze salon z kominkiem, kuchnia z wyjściem na taras oraz spiżarnia. Na piętrze trzy pokoje i łazienka.",
      "Instalacja gazowa, piec dwufunkcyjny wymieniony w 2023 r. Kanalizacja i woda miejska.",
    ],
    gallery: streamGallery("913fdfcbaf9daf04d02a24b8564894ea", [u("photo-1613490493576-7fde63acd811")]),
  },
  {
    slug: "mieszkanie-radlin-centrum",
    title: "Mieszkanie 3-pokojowe · Radlin centrum",
    subtitle: "Blisko ul. Rymera",
    city: "Radlin",
    district: "Centrum",
    kind: "apartament",
    kindLabel: "Mieszkanie",
    area: 72,
    rooms: 3,
    priceFrom: 385_000,
    tagline: "Funkcjonalny układ, niskie koszty.",
    excerpt:
      "Trzecie piętro w odnowionej kamienicy. Cicho, jasno, dogodnie do biura Fibry i komunikacji zbiorowej.",
    highlights: ["Po remoncie", "Czynsz ok. 650 zł", "Piwnica", "Balkon francuski"],
    streamId: "52a76a2f3f9c848bec73c445954f8322",
    poster: streamPoster("52a76a2f3f9c848bec73c445954f8322"),
    videoSrc: "https://cdn.pixabay.com/video/2020/06/24/42952-434558051_large.mp4",
    isNew: true,
    refNumber: "FIB-RS-4803",
    rokBudowy: 1980,
    pietro: "3 / 4",
    miejscParkingowych: 0,
    energetyka: "D",
    statusOferty: "wolna",
    body: [
      "Mieszkanie po generalnym remoncie: nowe instalacje, podłogi, stolarka wewnętrzna. Gotowe do wprowadzenia.",
      "Doskonała baza pod pierwsze M lub inwestycję pod wynajem - popyt na mieszkania w Radlinie stabilny.",
    ],
    gallery: streamGallery("52a76a2f3f9c848bec73c445954f8322", [u("photo-1507089947368-19c1da9775ae")]),
  },
  {
    slug: "kawalerka-wodzislaw-centrum",
    title: "Kawalerka inwestycyjna · Wodzisław Śląski",
    subtitle: "Kamienica, II piętro",
    city: "Wodzisław Śląski",
    district: "Centrum",
    kind: "apartament",
    kindLabel: "Kawalerka",
    area: 32,
    rooms: 1,
    priceFrom: 195_000,
    tagline: "Wejście niskim kosztem.",
    excerpt:
      "Kompaktowe mieszkanie z oddzielną kuchnią i łazienką z oknem. Świetne pod wynajem dla studentów lub singla.",
    highlights: ["Niski czynsz", "Winda w budynku", "Odświeżone", "Blisko dworca"],
    /** Ten sam clip Stream co pierwsza oferta - demo hero (karty 04 / 08). */
    streamId: "81b5480a03a58f68e910e288a96cc76a",
    poster: streamPoster("81b5480a03a58f68e910e288a96cc76a"),
    videoSrc: "https://cdn.pixabay.com/video/2020/05/25/39680-424166318_large.mp4",
    refNumber: "FIB-RS-4804",
    rokBudowy: 2005,
    pietro: "2 / 4",
    miejscParkingowych: 0,
    energetyka: "C",
    statusOferty: "wolna",
    body: [
      "Na podłodze panele, ściany po gładzi. Wymiana okien w 2021 r.",
      "Typowa lokalizacja „pod klucz” dla inwestora - dobra stopa zwrotu przy niewielkim nakładzie.",
    ],
    gallery: streamGallery("81b5480a03a58f68e910e288a96cc76a", [
      u("photo-1522708323590-d24dbb6b0267"),
      u("photo-1502672260266-1c1ef2d93688"),
    ]),
  },
  {
    slug: "dom-rydułtowy-centrum",
    title: "Dom · Rydułtowy Centrum",
    subtitle: "Budynek z lat 90., po modernizacji",
    city: "Rydułtowy",
    district: "Centrum",
    kind: "dom",
    kindLabel: "Dom",
    area: 165,
    rooms: 5,
    priceFrom: 640_000,
    tagline: "Blisko szkół i komunikacji.",
    excerpt:
      "Dom piętrowy z poddaszem użytkowym i garażem w bryle. Działka 380 m², zagospodarowana, z miejscem na ogródek warzywny.",
    highlights: ["Garaż", "Poddasze", "Ogrzewanie gazowe", "Alarm"],
    poster: u("photo-1600596542815-ffad4c1539a5"),
    videoSrc: "https://cdn.pixabay.com/video/2021/04/03/69287-535096131_large.mp4",
    refNumber: "FIB-RS-4805",
    rokBudowy: 1996,
    pietro: "Parter + 1",
    miejscParkingowych: 2,
    powDzialkiM2: 380,
    energetyka: "C",
    statusOferty: "wolna",
    body: [
      "Na parterze salon z jadalnią, kuchnia z oknem, łazienka i pokój. Piętro: trzy pokoje i druga łazienka.",
      "W 2022 r. wymieniono dach i docieplono elewację zgodnie z WT.",
    ],
    gallery: interiors(
      "photo-1600596542815-ffad4c1539a5",
      "photo-1600585154526-990dced4db0d",
      "photo-1600210492486-724fe5c67fb0",
      "photo-1600607687644-c7171b42498f"
    ),
  },
  {
    slug: "mieszkanie-pszow",
    title: "Mieszkanie 2-pokojowe · Pszów",
    subtitle: "Spółdzielcze własnościowe",
    city: "Pszów",
    kind: "apartament",
    kindLabel: "Mieszkanie",
    area: 48,
    rooms: 2,
    priceFrom: 298_000,
    tagline: "Dobre na start.",
    excerpt:
      "Czwarte piętro z widokiem na zieleń. Blok po termomodernizacji, plac zabaw pod oknem.",
    highlights: ["Winda", "Piwnica", "Spółdzielnia", "Czynsz z CO"],
    poster: u("photo-1600607687939-ce8a6c25118c"),
    refNumber: "FIB-RS-4806",
    rokBudowy: 1985,
    pietro: "4 / 10",
    miejscParkingowych: 0,
    energetyka: "C",
    statusOferty: "wolna",
    body: [
      "Rozkład: pokój z aneksem kuchennym, sypialnia, łazienka z kabiną. Loggia z zachodu.",
      "Dojazd do Rybnika ok. 12 minut - spokojna dzielnica zamknięta dla tranzytu.",
    ],
    gallery: interiors(
      "photo-1600607687939-ce8a6c25118c",
      "photo-1600566753083-00f18fb6b3ea",
      "photo-1600047509358-9dc4987f6c0d",
      "photo-1600585154340-be6161a56a0c"
    ),
  },
  {
    slug: "penthouse-rybnik-niedobczyce",
    title: "Penthouse z tarasem · Rybnik",
    subtitle: "Niedobczyce, ostatnie piętro",
    city: "Rybnik",
    district: "Niedobczyce",
    kind: "penthouse",
    kindLabel: "Penthouse",
    area: 118,
    rooms: 4,
    priceFrom: 920_000,
    tagline: "Panorama miasta i lasu.",
    excerpt:
      "Apartament narożny z tarasem ok. 35 m². Dwie sypialnie, gabinet, dwie łazienki, garderoba.",
    highlights: ["Taras", "Dwie łazienki", "Garderoba", "2 miejsca postojowe"],
    poster: u("photo-1600566753190-17f0baa2a6c3"),
    videoSrc: "https://cdn.pixabay.com/video/2022/11/13/139062-770754049_large.mp4",
    isExclusive: true,
    refNumber: "FIB-RS-4807",
    rokBudowy: 2020,
    pietro: "8 / 8",
    miejscParkingowych: 2,
    energetyka: "A",
    statusOferty: "wolna",
    body: [
      "Apartament wykończony pod klucz w standardzie deweloperskim premium: rekuperacja, klimatyzacja, rolety zewnętrzne.",
      "W budynku monitoring, winda osobowa i towarowa, hala garażowa podziemna.",
    ],
    gallery: interiors(
      "photo-1600566753190-17f0baa2a6c3",
      "photo-1600573472592-401b9a5e456f",
      "photo-1600585154526-990dced4db0d",
      "photo-1600047509787-80d8a234f734"
    ),
  },
  {
    slug: "dzialka-jastrzebie-zdroj",
    title: "Działka budowlana · Jastrzębie-Zdrój",
    subtitle: "Media w drodze",
    city: "Jastrzębie-Zdrój",
    kind: "grunt",
    kindLabel: "Działka",
    area: 1240,
    rooms: undefined,
    priceFrom: 265_000,
    priceLabel: "Cena za całość",
    tagline: "Prostokąt, spadek w stronę południa.",
    excerpt:
      "Działka 1240 m² z decyzją o warunkach zabudowy na dom jednorodzinny. Spokojna ulica osiedlowa.",
    highlights: ["Wz decyzja", "1240 m²", "Media w drodze", "Szybki dojazd do DK81"],
    poster: u("photo-1500382017468-9049fed747ef"),
    refNumber: "FIB-RS-4808",
    powDzialkiM2: 1240,
    statusOferty: "wolna",
    body: [
      "Teren suchy, ogrodzony siatką. W sąsiedztwie nowa zabudowa jednorodzinna.",
      "Fibra pomoże w weryfikacji dokumentacji i ewentualnym podziale działki.",
    ],
    gallery: interiors(
      "photo-1500382017468-9049fed747ef",
      "photo-1502672260266-1c1ef2d93688",
      "photo-1613977257363-707ba9348227",
      "photo-1600210492486-724fe5c67fb0"
    ),
  },
];

export function getOffer(slug: string): Offer | undefined {
  return OFFERS.find((o) => o.slug === slug);
}

export function priceFormat(pln?: number): string {
  if (!pln) return "Cena na zapytanie";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(pln);
}

export function priceShort(pln?: number): string {
  if (!pln) return "na zapytanie";
  if (pln >= 1_000_000) {
    const m = pln / 1_000_000;
    return `${m.toFixed(m % 1 === 0 ? 0 : 2).replace(".", ",")} mln zł`;
  }
  return new Intl.NumberFormat("pl-PL").format(pln) + " zł";
}
