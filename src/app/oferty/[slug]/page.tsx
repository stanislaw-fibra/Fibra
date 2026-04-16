import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { priceFormat } from "@/lib/offers";
import type { Offer } from "@/lib/offers";
import { getAllOffers, getOfferBySlug } from "@/lib/offers-query";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { OfferVideo } from "@/components/media/OfferVideo";
import { OfferGallery } from "@/components/offers/OfferGallery";
import { OfferStickyCta } from "@/components/offers/OfferStickyCta";
import { OfferAgentMini } from "@/components/offers/OfferAgentMini";
import { OfferDetailParams } from "@/components/offers/OfferDetailParams";
import { RelatedOffersWithPlayback } from "@/components/offers/RelatedOffersWithPlayback";

export const revalidate = 60;

export async function generateStaticParams() {
  const offers = await getAllOffers();
  return offers.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer) return { title: "Oferta niedostępna" };
  return {
    title: `${offer.title} — Fibra Nieruchomości`,
    description: offer.excerpt,
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

  const all = await getAllOffers();
  const others = all.filter((o) => o.slug !== slug).slice(0, 4);
  const gallery = offer.gallery?.length ? offer.gallery : [offer.poster];
  const kontaktMaterials = `/kontakt?temat=materiały&oferta=${encodeURIComponent(offer.slug)}`;
  const fullDesc = offer.fullDescription?.trim();
  const heroStreamId = offer.streamIdLong ?? offer.streamId;

  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px] pb-28 md:pb-32">
        <section className="relative py-10 md:py-16 border-b border-ink-200/80">
          <div className="container-xl">
            <nav className="text-[13px] text-ink-500 mb-8 flex flex-wrap items-center gap-2">
              <Link href="/" className="hover:text-brand-500 transition-colors">
                Strona główna
              </Link>
              <span aria-hidden>/</span>
              <Link href="/oferty" className="hover:text-brand-500 transition-colors">
                Oferty
              </Link>
              <span aria-hidden>/</span>
              <span className="text-ink-900 font-medium line-clamp-1">{offer.title}</span>
            </nav>

            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <div className="lg:col-span-5 order-1 lg:sticky lg:top-[88px]">
                <div className="relative aspect-[9/15] w-full max-w-[520px] mx-auto lg:mx-0 overflow-hidden rounded-[var(--radius-lg)] bg-ink-900 shadow-[var(--shadow-cinematic)] ring-1 ring-ink-200/60">
                  {heroStreamId ? (
                    <OfferVideo
                      title={offer.title}
                      poster={offer.poster}
                      streamId={heroStreamId}
                      videoSrc={offer.videoSrc}
                      priority
                    />
                  ) : (
                    <Image
                      src={offer.poster}
                      alt={offer.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 520px"
                      priority
                      unoptimized
                    />
                  )}
                  <div className="absolute inset-0 grad-btm pointer-events-none z-[2]" />
                  <div className="pointer-events-none absolute top-4 left-4 right-4 flex gap-2 flex-wrap z-[3]">
                    {offer.isExclusive && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-400 text-ink-950 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em]">
                        Exclusive
                      </span>
                    )}
                    {offer.isNew && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md text-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em]">
                        Nowość
                      </span>
                    )}
                    {offer.statusOferty && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-950/55 backdrop-blur-md text-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em]">
                        {statusLabel(offer.statusOferty)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-center lg:text-left text-[12px] text-ink-500 max-w-[520px] mx-auto lg:mx-0">
                  Film orientacyjny — pełna dokumentacja i rzuty wysyłamy po pierwszym kontakcie.
                </p>
              </div>

              <div className="lg:col-span-7 order-2">
                <Reveal>
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    {offer.refNumber && (
                      <span className="text-[11px] uppercase tracking-[0.16em] text-ink-500 bg-ink-100 px-3 py-1.5 rounded-full">
                        Ref. {offer.refNumber}
                      </span>
                    )}
                    <span className="text-[11px] uppercase tracking-[0.16em] text-ink-500">
                      {offer.city}
                      {offer.district ? ` · ${offer.district}` : ""} · {offer.kindLabel}
                    </span>
                  </div>
                  <h1 className="font-display text-[clamp(2.2rem,4.8vw,3.75rem)] leading-[1.02] text-ink-950">
                    {offer.title}
                  </h1>
                  {offer.subtitle && (
                    <p className="mt-5 text-[17px] md:text-[18px] text-ink-600 max-w-2xl leading-relaxed">
                      {offer.subtitle}
                    </p>
                  )}
                </Reveal>

                <Reveal delay={100} className="mt-10 grid sm:grid-cols-2 gap-4">
                  <SpecCard
                    label={offer.kind === "grunt" ? "Powierzchnia działki" : "Powierzchnia użytkowa"}
                    value={`${offer.area} m²`}
                  />
                  {offer.rooms != null && <SpecCard label="Liczba pokoi" value={String(offer.rooms)} />}
                  <SpecCard label="Cena" value={priceFormat(offer.priceFrom)} />
                  {offer.pietro && <SpecCard label="Piętro / budynek" value={offer.pietro} />}
                  {offer.rokBudowy != null && <SpecCard label="Rok budowy" value={String(offer.rokBudowy)} />}
                  {offer.miejscParkingowych != null && (
                    <SpecCard label="Miejsca parkingowe" value={String(offer.miejscParkingowych)} />
                  )}
                  {offer.powDzialkiM2 != null && offer.kind !== "grunt" && (
                    <SpecCard label="Działka" value={`${offer.powDzialkiM2.toLocaleString("pl-PL")} m²`} />
                  )}
                  {offer.energetyka && <SpecCard label="Energetyka" value={offer.energetyka} />}
                </Reveal>

                {fullDesc ? (
                  <Reveal delay={180} className="mt-10 max-w-3xl">
                    <p className="eyebrow flex items-center gap-3 mb-4">
                      <span className="inline-block w-8 h-px bg-brand-500" />
                      Opis
                    </p>
                    <div className="text-[16px] md:text-[17px] leading-[1.75] text-ink-700 whitespace-pre-wrap">
                      {fullDesc}
                    </div>
                  </Reveal>
                ) : (
                  <Reveal delay={180} className="mt-10 max-w-3xl space-y-5">
                    {(offer.body?.length ? offer.body : [offer.excerpt]).map((p, i) => (
                      <p key={i} className="text-[16px] md:text-[17px] leading-[1.7] text-ink-700">
                        {p}
                      </p>
                    ))}
                  </Reveal>
                )}

                <Reveal delay={260} className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/kontakt"
                    className="inline-flex items-center gap-2 rounded-full bg-ink-950 hover:bg-brand-500 text-white px-7 py-3.5 text-[14px] font-medium transition-colors"
                  >
                    Umów rozmowę lub prezentację
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link
                    href={kontaktMaterials}
                    className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-paper hover:border-brand-500 hover:text-brand-600 text-ink-900 px-7 py-3.5 text-[14px] font-medium transition-colors"
                  >
                    Poproś o materiały (rzuty, portfolio)
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M7 2v8M3 7l4 3 4-3M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-16 border-b border-ink-200/70 bg-paper">
          <div className="container-xl grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <h2 className="font-display text-[clamp(1.6rem,3vw,2.25rem)] leading-tight text-ink-950 max-w-[22ch]">
                Masz pytania? Zadzwoń bezpośrednio lub zostaw numer — oddzwonimy.
              </h2>
              <p className="mt-4 text-[15px] text-ink-600 max-w-md leading-relaxed">
                Chętnie doprecyzujemy warunki, terminy oglądania i komplet dokumentów do tej oferty.
              </p>
              <a
                href="tel:+48510777200"
                className="mt-6 inline-flex font-display text-[22px] text-brand-600 hover:text-brand-500 transition-colors"
              >
                510 777 200
              </a>
            </div>
            <div className="lg:col-span-7 rounded-[var(--radius-lg)] border border-ink-200/80 bg-paper-warm p-6 md:p-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-500 mb-4">
                Krótki kontakt
              </p>
              <OfferAgentMini offerTitle={offer.title} />
            </div>
          </div>
        </section>

        <OfferDetailParams offer={offer} />

        <section className="py-20 md:py-28">
          <div className="container-xl">
            <Reveal className="mb-10 md:mb-12">
              <p className="eyebrow flex items-center gap-3 mb-5">
                <span className="inline-block w-8 h-px bg-brand-500" />
                Galeria
              </p>
              <h2 className="font-display fluid-h2 text-ink-950 max-w-[20ch]">
                Wnętrza, detale, kontekst miejsca.
              </h2>
              <p className="mt-4 text-[15px] text-ink-600 max-w-2xl">
                Zdjęcia poglądowe — docelowo zastąpi je zestaw z sesji i materiałów z systemu (Galactica + Stream).
              </p>
            </Reveal>
            <Reveal delay={120}>
              <OfferGallery images={gallery} title={offer.title} />
            </Reveal>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-paper-warm border-y border-ink-200/60">
          <div className="container-xl">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
              <Reveal className="lg:col-span-5">
                <p className="eyebrow flex items-center gap-3 mb-5">
                  <span className="inline-block w-8 h-px bg-brand-500" />
                  Streszczenie
                </p>
                <h2 className="font-display fluid-h2 text-ink-950 max-w-[14ch]">{offer.tagline}</h2>
                <p className="mt-6 text-[16px] leading-[1.65] text-ink-700 max-w-md">{offer.excerpt}</p>
              </Reveal>
              <Reveal delay={140} className="lg:col-span-7">
                <div className="bg-paper rounded-[var(--radius-lg)] p-8 md:p-10 shadow-soft ring-1 ring-ink-200/60">
                  <p className="eyebrow mb-6">Dane do wglądu po kontakcie</p>
                  <ul className="space-y-5">
                    {[
                      ["Karta oferty PDF", "Parametry techniczne, rzuty 2D, opis prawny."],
                      ["Spacer wideo / 3D", "Matterport lub dodatkowe ujęcia — na życzenie."],
                      ["Harmonogram prezentacji", "Stacjonarnie, zdalnie lub dla doradcy B2B."],
                      ["Źródło danych", "Docelowo synchronizacja z Galacticą (jedna prawda)."],
                    ].map(([t, d]) => (
                      <li key={t} className="flex items-start gap-4">
                        <span className="mt-1 inline-flex w-6 h-6 items-center justify-center rounded-full bg-brand-500/12 text-brand-600 shrink-0">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-[15px] font-medium text-ink-950">{t}</p>
                          <p className="text-[13.5px] text-ink-600 mt-0.5 leading-[1.55]">{d}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
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
      <OfferStickyCta priceFrom={offer.priceFrom} title={offer.title} />
      <Footer />
    </>
  );
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-ink-200/80 bg-paper px-5 py-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
      <p className="mt-2 font-display text-[20px] md:text-[22px] text-ink-950 leading-tight">{value}</p>
    </div>
  );
}
