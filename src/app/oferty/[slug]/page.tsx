import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { priceFormat } from "@/lib/offers";
import type { Offer } from "@/lib/offers";
import { getAllOffers, getOfferBySlug } from "@/lib/offers-query";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { OfferGallery } from "@/components/offers/OfferGallery";
import { OfferStickyCta } from "@/components/offers/OfferStickyCta";
import { OfferAgentMini } from "@/components/offers/OfferAgentMini";
import { OfferContactForm } from "@/components/offers/OfferContactForm";
import { OfferAgentPresentation } from "@/components/offers/OfferAgentPresentation";
import { OfferDescription } from "@/components/offers/OfferDescription";
import { OfferDetailParams } from "@/components/offers/OfferDetailParams";
import { RelatedOffersWithPlayback } from "@/components/offers/RelatedOffersWithPlayback";
import { OfferHeroMedia } from "@/components/offers/OfferHeroMedia";
import { OfferMatterport } from "@/components/offers/OfferMatterport";
import { OfferYouTube } from "@/components/offers/OfferYouTube";
import { OfferListingHighlight } from "@/components/offers/OfferListingHighlight";
import { OfferQuickMedia } from "@/components/offers/OfferQuickMedia";
import { OfferCollapsible } from "@/components/offers/OfferCollapsible";
import { GalleryLightboxProvider } from "@/components/offers/GalleryLightbox";
import { OfferMiniGallery } from "@/components/offers/OfferMiniGallery";
import { OfferStreamHeroShell } from "@/components/offers/OfferStreamHeroShell";
import { firstNameInstrumental } from "@/lib/polish-names";
import { buildOfferJsonLd } from "@/lib/seo/offer-jsonld";
import { OfferReviewsBar } from "@/components/reviews/OfferReviewsBar";

export const revalidate = 60;

export async function generateStaticParams() {
  const offers = await getAllOffers();
  const params: { slug: string }[] = [];
  for (const o of offers) {
    const offer = await getOfferBySlug(o.slug);
    if (offer) params.push({ slug: o.slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer) return { title: "Oferta niedostępna" };

  const canonical = `/oferty/${offer.slug ?? slug}`;
  const transakcja = offer.listingType === "wynajem" ? "na wynajem" : "na sprzedaż";
  const keywords = [
    offer.kindLabel,
    offer.city ? `${offer.kindLabel} ${offer.city}` : null,
    offer.city ? `${offer.kindLabel} ${transakcja} ${offer.city}` : null,
    offer.refNumber,
    "Fibra Nieruchomości",
  ].filter((v): v is string => Boolean(v));

  return {
    title: `${offer.title} - Fibra Nieruchomości`,
    description: offer.excerpt,
    keywords,
    alternates: { canonical },
    // og:image / twitter:image pochodzą z konwencji plikowej
    // (`opengraph-image.tsx` / `twitter-image.tsx` w tym segmencie) - markowa
    // karta 1200x630 zamiast surowego kadru z galerii.
    openGraph: {
      type: "website",
      locale: "pl_PL",
      url: canonical,
      siteName: "Fibra Nieruchomości",
      title: offer.title,
      description: offer.excerpt,
    },
    twitter: {
      card: "summary_large_image",
      title: offer.title,
      description: offer.excerpt,
    },
  };
}

function statusLabel(s: Offer["statusOferty"]) {
  if (!s) return null;
  const map = {
    wolna: "Wolna",
    "w rozmowach": "W rozmowach",
    zarezerwowana: "Zarezerwowana",
  } as const;
  return map[s];
}

export default async function OfferPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer) notFound();

  // 301 na kanoniczny slug: stare linki typu /oferty/{uuid} lub /oferty/{FIB-DS-4127}
  // oraz odmiany wielkości liter w suffiksie przenosimy na `offer.slug`.
  if (offer.slug && offer.slug !== slug) {
    permanentRedirect(`/oferty/${offer.slug}`);
  }

  const all = await getAllOffers();
  const others = all.filter((o) => o.slug !== slug).slice(0, 4);
  const gallery = offer.gallery?.length ? offer.gallery : [];
  const fullDesc = offer.fullDescription?.trim();
  const heroStreamId = offer.streamIdLong ?? offer.streamId;

  return (
    <>
      <Nav />
      <GalleryLightboxProvider images={gallery} title={offer.title}>
      <main className="flex-1 pt-[72px] pb-28 md:pb-32">
        <section className="relative pt-5 pb-10 md:pt-9 md:pb-16 border-b border-ink-200/80">
          <div className="container-xl">
            <nav className="text-[12px] text-ink-500 mb-4 flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
              <Link href="/" className="shrink-0 hover:text-brand-500 transition-colors">
                Strona główna
              </Link>
              <span aria-hidden className="shrink-0 text-ink-300">/</span>
              <Link href="/oferty" className="shrink-0 hover:text-brand-500 transition-colors">
                Oferty
              </Link>
              <span aria-hidden className="shrink-0 text-ink-300">/</span>
              <span className="truncate text-ink-700">{offer.title}</span>
            </nav>

            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <div
                className={`${heroStreamId ? "lg:col-span-5" : "lg:col-span-6"} order-1 min-w-0 lg:sticky lg:top-[88px]`}
              >
                <div className="md:hidden max-w-[520px] mx-auto lg:mx-0">
                  <OfferListingHighlight
                    listingType={offer.listingType}
                    kind={offer.kind}
                    kindLabel={offer.kindLabel}
                  />
                </div>
                {heroStreamId ? (
                  <div className="max-w-[520px] mx-auto lg:mx-0">
                    <OfferStreamHeroShell
                      title={offer.title}
                      poster={offer.poster}
                      streamId={heroStreamId}
                      videoSrc={offer.videoSrc}
                    >
                      <div className="pointer-events-none absolute top-4 left-4 right-4 flex gap-2 flex-wrap z-[3]">
                        {offer.statusOferty && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-950/55 backdrop-blur-md text-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em]">
                            {statusLabel(offer.statusOferty)}
                          </span>
                        )}
                      </div>
                    </OfferStreamHeroShell>
                    {/* Mobile / tablet (<lg): galeria pod filmem - zaraz po nim, nim user dotrze
                        do parametrów. Na desktop galeria pojawia się w prawej kolumnie. */}
                    {gallery.length > 0 && (
                      <div className="lg:hidden mt-5">
                        <OfferMiniGallery images={gallery} label="Zdjęcia oferty" />
                      </div>
                    )}
                    {/* Główne liczby (cena · powierzchnia · pokoje) NIE są tu powtarzane -
                        żyją na przyklejonym dolnym pasku, a pełny komplet parametrów jest
                        niżej w sekcji OfferDetailParams. Dedup zgłoszony przez Romana. */}
                  </div>
                ) : (
                  <OfferHeroMedia
                    title={offer.title}
                    youtubeUrl={offer.youtubeUrl}
                    poster={offer.poster}
                    gallery={gallery}
                  />
                )}
              </div>

              <div className={`${heroStreamId ? "lg:col-span-7" : "lg:col-span-6"} order-2`}>
                <Reveal>
                  <div className="hidden md:block">
                    <OfferListingHighlight
                      listingType={offer.listingType}
                      kind={offer.kind}
                      kindLabel={offer.kindLabel}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-700">
                      {offer.city}
                      {offer.district ? ` · ${offer.district}` : ""}
                    </span>
                  </div>
                  {/* Tytuł skompresowany na ofertach z pionowym filmem - zostaje wtedy
                      więcej miejsca na galerię w pierwszym viewportcie. Dla ofert bez filmu
                      tytuł zostaje pełnowymiarowy (większa hero-typografia). */}
                  <h1
                    className={
                      heroStreamId
                        ? "font-display text-[clamp(1.6rem,3.4vw,2.5rem)] leading-[1.08] text-ink-950"
                        : "font-display text-[clamp(2.2rem,4.8vw,3.75rem)] leading-[1.02] text-ink-950"
                    }
                  >
                    {offer.title}
                  </h1>
                  {/* Subtitle (np. „Centrum") chowamy gdy lokalizacja + kategoria są już w eyebrow nad tytułem
                      (oferty z pionowym filmem). Bez filmu - zostaje pełny opis pod tytułem. */}
                  {offer.subtitle && !heroStreamId && (
                    <p className="mt-5 text-[17px] md:text-[18px] text-ink-600 max-w-2xl leading-relaxed">
                      {offer.subtitle}
                    </p>
                  )}
                </Reveal>

                {/* Premium pasek ceny + kluczowych faktów (desktop) - od razu czytelna cena
                    i najważniejsze liczby przy tytule. Na mobile te dane są na dolnym pasku,
                    a hero jest wysoki - więc tu pokazujemy je tylko od lg w górę. */}
                <Reveal delay={60} className="mt-6 hidden lg:block">
                  <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-y border-ink-200/70 py-5">
                    <div>
                      <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-500">
                        {offer.priceLabel ?? "Cena"}
                      </span>
                      <span className="mt-1 block font-display text-[clamp(1.9rem,2.6vw,2.5rem)] leading-none text-ink-950">
                        {priceFormat(offer.priceFrom)}
                      </span>
                    </div>
                    <dl className="flex flex-wrap items-end gap-x-7 gap-y-3">
                      <Fact
                        label={offer.kind === "grunt" ? "Pow. działki" : "Powierzchnia"}
                        value={`${offer.area} m²`}
                      />
                      {offer.rooms != null && <Fact label="Pokoje" value={String(offer.rooms)} />}
                      {offer.pietro && <Fact label="Piętro" value={offer.pietro} />}
                      {offer.rokBudowy != null && (
                        <Fact label="Rok budowy" value={String(offer.rokBudowy)} />
                      )}
                    </dl>
                  </div>
                </Reveal>

                <Reveal delay={80} className="mt-6">
                  <OfferQuickMedia
                    offerTitle={offer.title}
                    offerKind={offer.kind}
                    virtualTourUrl={offer.virtualTourUrl}
                    floorPlanImageUrl={offer.floorPlanImageUrl}
                    floorPlanPdfUrl={offer.floorPlanPdfUrl}
                    floorPlanImages={offer.floorPlanImages}
                    floorPlanPdfs={offer.floorPlanPdfs}
                    gallery={gallery.length ? gallery : undefined}
                    youtubeUrl={offer.youtubeUrl}
                    youtubeInHero={!heroStreamId && Boolean(offer.youtubeUrl)}
                  />
                </Reveal>

                {/* Autoprezentacja agenta wysoko na stronie - mało kto scrolluje do dolnej
                    karty kontaktu, więc dajemy klikalny pasek z miniaturą tuż przy parametrach.
                    Renderuje się tylko gdy oferta ma wideo-autoprezentację agenta. */}
                {offer.agentVideoId && (
                  <Reveal delay={120} className="mt-6">
                    <OfferAgentPresentation
                      variant="banner"
                      videoId={offer.agentVideoId}
                      photoUrl={offer.agentPhotoUrl}
                      name={offer.agentName}
                    />
                  </Reveal>
                )}

                {/* Galeria w prawej kolumnie - tylko desktop (lg+). Na mobile/tablet
                    galeria jest już renderowana zaraz pod filmem (lewa „kolumna").
                    Kluczowe liczby NIE są tu powielane kafelkami (uwaga Romana: "trzy razy
                    te same dane") - cena/powierzchnia są w premium pasku przy tytule i na
                    dolnym pasku; pełny komplet parametrów jest niżej w OfferDetailParams. */}
                {heroStreamId && gallery.length > 0 && (
                  <Reveal delay={100} className="mt-7 hidden lg:block">
                    <OfferMiniGallery images={gallery} label="Zdjęcia oferty" />
                  </Reveal>
                )}

                {fullDesc ? (
                  <Reveal delay={180} className="mt-8 max-w-3xl">
                    <p className="eyebrow flex items-center gap-3 mb-4">
                      <span className="inline-block w-8 h-px bg-brand-500" />
                      Opis
                    </p>
                    {fullDesc.length > 520 ? (
                      <OfferCollapsible collapsedHeight={240} moreLabel="Rozwiń opis" lessLabel="Zwiń opis">
                        <OfferDescription text={fullDesc} />
                      </OfferCollapsible>
                    ) : (
                      <OfferDescription text={fullDesc} />
                    )}
                  </Reveal>
                ) : (
                  <Reveal delay={180} className="mt-8 max-w-3xl space-y-5">
                    {(offer.body?.length ? offer.body : [offer.excerpt]).map((p, i) => (
                      <p key={i} className="text-[16px] md:text-[17px] leading-[1.7] text-ink-700">
                        {p}
                      </p>
                    ))}
                  </Reveal>
                )}

                <Reveal delay={260} className="mt-8">
                  <a
                    href="#kontakt"
                    className="inline-flex items-center gap-2 rounded-full bg-ink-950 hover:bg-brand-500 text-white px-7 py-3.5 text-[14px] font-medium transition-colors"
                  >
                    Dowiedz się więcej
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-16 border-b border-ink-200/70 bg-paper">
          <div className="container-xl grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <h2 className="font-display text-[clamp(1.6rem,3vw,2.25rem)] leading-tight text-ink-950 max-w-[22ch]">
                {offer.agentName
                  ? `Skontaktuj się z ${firstNameInstrumental(offer.agentName)} - prowadzi tę ofertę.`
                  : "Masz pytania? Zadzwoń bezpośrednio lub zostaw numer - oddzwonimy."}
              </h2>
              <p className="mt-4 text-[15px] text-ink-600 max-w-md leading-relaxed">
                Chętnie doprecyzujemy warunki, terminy oglądania i komplet dokumentów do tej oferty.
              </p>
              {(() => {
                const phone = offer.agentPhone || offer.agentPhoneOffice || "510 777 200";
                const telHref = `tel:+48${phone.replace(/\D/g, "")}`;
                return (
                  <div className="mt-6 flex items-center gap-4 md:gap-5">
                    <OfferAgentPresentation
                      videoId={offer.agentVideoId}
                      photoUrl={offer.agentPhotoUrl}
                      name={offer.agentName}
                    />
                    <div className="min-w-0 flex flex-col gap-1">
                      {offer.agentName && (
                        <span className="text-[11px] uppercase tracking-[0.16em] text-ink-500">
                          {offer.agentName}
                        </span>
                      )}
                      {offer.agentVideoId && (
                        <span className="text-[12px] font-medium text-brand-600">
                          Kliknij zdjęcie, aby zobaczyć autoprezentację
                        </span>
                      )}
                      <a
                        href={telHref}
                        className="inline-flex font-display text-[22px] text-brand-600 hover:text-brand-500 transition-colors tabular-nums leading-none"
                      >
                        {phone}
                      </a>
                      {offer.agentEmail && (
                        <a
                          href={`mailto:${offer.agentEmail}`}
                          className="text-[14px] text-ink-600 hover:text-brand-600 transition-colors truncate"
                        >
                          {offer.agentEmail}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="lg:col-span-7 rounded-[var(--radius-lg)] border border-ink-200/80 bg-paper-warm p-6 md:p-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-500 mb-4">
                Krótki kontakt
              </p>
              <OfferAgentMini
                offerId={offer.id}
                galacticaOfferId={offer.refNumber}
                offerTitle={offer.title}
                agentName={offer.agentName}
                agentEmail={offer.agentEmail}
              />
            </div>
          </div>
        </section>

        <OfferDetailParams offer={offer} />

        {offer.youtubeUrl && heroStreamId && (
          <section id="film-prezentacyjny" className="py-16 md:py-24">
            <div className="container-xl">
              <Reveal className="mb-8 md:mb-10 max-w-2xl">
                <p className="eyebrow flex items-center gap-3 mb-4">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Film prezentacyjny
                </p>
                <h2 className="font-display fluid-h2 text-ink-950 max-w-[22ch]">
                  Dłuższe spojrzenie na nieruchomość.
                </h2>
                <p className="mt-4 text-[15px] text-ink-600 leading-relaxed">
                  Pełna prezentacja na YouTube - układ, otoczenie, detale w jednym nagraniu.
                </p>
              </Reveal>
              <Reveal delay={120}>
                <OfferYouTube url={offer.youtubeUrl} title={`Film prezentacyjny - ${offer.title}`} />
              </Reveal>
            </div>
          </section>
        )}

        {offer.virtualTourUrl && (
          <section id="spacer-3d" className="py-16 md:py-24 bg-paper-warm border-y border-ink-200/60">
            <div className="container-xl">
              <Reveal className="mb-8 md:mb-10 max-w-2xl">
                <p className="eyebrow flex items-center gap-3 mb-4">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Spacer 3D
                </p>
                <h2 className="font-display fluid-h2 text-ink-950 max-w-[22ch]">
                  Przejdź się po nieruchomości w 360°.
                </h2>
                <p className="mt-4 text-[15px] text-ink-600 leading-relaxed">
                  Interaktywny spacer Matterport - każdy pokój, każdy detal, w swoim tempie.
                </p>
              </Reveal>
              <Reveal delay={120}>
                <OfferMatterport url={offer.virtualTourUrl} title={`Spacer 3D - ${offer.title}`} />
              </Reveal>
            </div>
          </section>
        )}

        {gallery.length > 0 && (
          <section id="galeria" className="py-20 md:py-28">
            <div className="container-xl">
              <Reveal className="mb-10 md:mb-12">
                <p className="eyebrow flex items-center gap-3 mb-5">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Galeria
                </p>
                <h2 className="font-display fluid-h2 text-ink-950 max-w-[20ch]">
                  Wnętrza, detale, kontekst miejsca.
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <OfferGallery images={gallery} title={offer.title} />
              </Reveal>
            </div>
          </section>
        )}

        {/* Dowód zaufania tuż przed formularzem kontaktowym - user obejrzał ofertę,
            widzi ocenę z Google i od razu pod spodem zostawia namiary. */}
        <OfferReviewsBar />

        <section className="relative py-20 md:py-28 bg-paper">
          <span
            id="kontakt"
            aria-hidden
            className="pointer-events-none absolute -top-24 left-0"
          />
          <span
            id="kontakt-prezentacja"
            aria-hidden
            className="pointer-events-none absolute -top-24 left-0"
          />
          <span
            id="kontakt-materialy"
            aria-hidden
            className="pointer-events-none absolute -top-24 left-0"
          />
          <div className="container-xl">
            {/* Gdy agent ma autoprezentację wideo - układ 2-kolumnowy: nagłówek + formularz
                po lewej, duży kafelek wideo po prawej (wypełnia puste miejsce na desktopie).
                Kolejność w DOM: nagłówek → kafelek → formularz, więc na mobile kafelek ląduje
                naturalnie między nagłówkiem a formularzem i jest łatwy do kliknięcia. */}
            {offer.agentVideoId ? (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
                <Reveal className="lg:col-span-7 lg:row-start-1">
                  <p className="eyebrow flex items-center gap-3 mb-5">
                    <span className="inline-block w-8 h-px bg-brand-500" />
                    Kontakt w sprawie oferty
                  </p>
                  <h2 className="font-display fluid-h2 text-ink-950 max-w-[22ch]">
                    {offer.agentName
                      ? `Porozmawiaj z ${firstNameInstrumental(offer.agentName)} o tej nieruchomości.`
                      : "Porozmawiajmy o tej nieruchomości."}
                  </h2>
                  <p className="mt-5 text-[15.5px] leading-[1.7] text-ink-600">
                    Zostaw namiary, a oddzwonimy. Możesz od razu zaznaczyć, czy chcesz umówić
                    prezentację, otrzymać komplet materiałów, czy po prostu dopytać o szczegóły.
                  </p>
                </Reveal>
                <Reveal
                  delay={80}
                  className="mx-auto w-full max-w-[320px] lg:col-span-5 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:max-w-none lg:self-center"
                >
                  <OfferAgentPresentation
                    variant="card"
                    videoId={offer.agentVideoId}
                    photoUrl={offer.agentPhotoUrl}
                    name={offer.agentName}
                  />
                </Reveal>
                <Reveal delay={120} className="lg:col-span-7 lg:row-start-2">
                  <OfferContactForm
                    offerId={offer.id}
                    galacticaOfferId={offer.refNumber}
                    offerTitle={offer.title}
                    refNumber={offer.refNumber}
                    agentName={offer.agentName}
                    agentEmail={offer.agentEmail}
                    agentPhone={offer.agentPhone || offer.agentPhoneOffice}
                  />
                </Reveal>
              </div>
            ) : (
              <>
                <Reveal className="mb-10 md:mb-12 max-w-2xl">
                  <p className="eyebrow flex items-center gap-3 mb-5">
                    <span className="inline-block w-8 h-px bg-brand-500" />
                    Kontakt w sprawie oferty
                  </p>
                  <h2 className="font-display fluid-h2 text-ink-950 max-w-[22ch]">
                    {offer.agentName
                      ? `Porozmawiaj z ${firstNameInstrumental(offer.agentName)} o tej nieruchomości.`
                      : "Porozmawiajmy o tej nieruchomości."}
                  </h2>
                  <p className="mt-5 text-[15.5px] leading-[1.7] text-ink-600">
                    Zostaw namiary, a oddzwonimy. Możesz od razu zaznaczyć, czy chcesz umówić
                    prezentację, otrzymać komplet materiałów, czy po prostu dopytać o szczegóły.
                  </p>
                </Reveal>
                <Reveal delay={120} className="max-w-3xl">
                  <OfferContactForm
                    offerId={offer.id}
                    galacticaOfferId={offer.refNumber}
                    offerTitle={offer.title}
                    refNumber={offer.refNumber}
                    agentName={offer.agentName}
                    agentEmail={offer.agentEmail}
                    agentPhone={offer.agentPhone || offer.agentPhoneOffice}
                  />
                </Reveal>
              </>
            )}
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="container-xl">
            <Reveal className="mb-12 md:mb-14">
              <p className="eyebrow flex items-center gap-3 mb-5">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Portfolio
              </p>
              <h2 className="font-display fluid-display text-ink-950 max-w-[18ch]">
                Inne oferty, które mogą Cię zainteresować
              </h2>
            </Reveal>

            <RelatedOffersWithPlayback offers={others} />

            <Reveal delay={200} className="mt-12 text-center md:text-left">
              <Link
                href="/oferty"
                className="inline-flex items-center gap-2 text-[14px] font-medium text-ink-900 hover:text-brand-600 transition-colors"
              >
                Wróć do pełnego katalogu
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </Reveal>
          </div>
        </section>
      </main>
      </GalleryLightboxProvider>
      <OfferStickyCta
        priceFrom={offer.priceFrom}
        priceLabel={offer.priceLabel}
        area={offer.area}
        rooms={offer.rooms}
        kind={offer.kind}
        title={offer.title}
        refNumber={offer.refNumber}
        agentName={offer.agentName}
        agentPhone={offer.agentPhone || offer.agentPhoneOffice}
        agentPhotoUrl={offer.agentPhotoUrl}
      />
      <Footer />
      {buildOfferJsonLd(offer).map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}

/** Pojedynczy fakt w premium pasku ceny (etykieta nad wartością, display font). */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-500">{label}</dt>
      <dd className="mt-0.5 font-display text-[18px] leading-tight text-ink-950">{value}</dd>
    </div>
  );
}

