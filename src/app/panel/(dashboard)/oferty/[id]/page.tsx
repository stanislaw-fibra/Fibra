import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteOfferImageAction, updateOfferAction } from "@/app/panel/actions/offers";
import { OfferFilmSection } from "@/app/panel/_components/OfferFilmSection";
import { OfferFormFields } from "@/app/panel/_components/OfferFormFields";
import { OfferImageUploadForm } from "@/app/panel/_components/OfferImageUploadForm";
import { cloudflareStreamIframeUrl } from "@/lib/cloudflare-stream";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; saved?: string; uploaded?: string; videoSaved?: string }>;
};

type OfferRecord = {
  id: string;
  galactica_offer_id: string;
  category: string;
  listing_type: string;
  title: string | null;
  advertisement_text: string | null;
  description: string | null;
  price: number | null;
  city: string | null;
  district: string | null;
  area_usable: number | null;
  area_total: number | null;
  area_plot: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  floors_total: number | null;
  year_built: number | null;
  parking_spaces: number | null;
  heating: string | null;
  building_material: string | null;
  building_state: string | null;
  property_state: string | null;
  kitchen_type: string | null;
  market_type: string | null;
  virtual_tour_url: string | null;
  is_active: boolean;
  is_exclusive: boolean | null;
  is_price_negotiable: boolean | null;
  has_balcony: boolean | null;
  has_terrace: boolean | null;
  has_basement: boolean | null;
  has_garden: boolean | null;
  has_loggia: boolean | null;
  has_elevator: boolean | null;
  has_air_conditioning: boolean | null;
  agent_id: string | null;
};

type ImageRow = {
  id: string;
  image_url: string;
  order_index: number;
  is_primary: boolean | null;
};

type OfferMediaRow = {
  cloudflare_video_short_id: string | null;
  cloudflare_video_long_id: string | null;
};

export default async function PanelOfferEditPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  const admin = createSupabaseAdmin();
  const { data: offer, error: offerErr } = await admin.from("offers").select("*").eq("id", id).maybeSingle();
  if (offerErr || !offer) notFound();

  const row = offer as OfferRecord;

  const [{ data: agents }, { data: images, error: imgErr }, { data: media, error: mediaErr }] = await Promise.all([
    admin.from("agents").select("id, name").order("name", { ascending: true }),
    admin.from("offer_images").select("id, image_url, order_index, is_primary").eq("offer_id", id).order("order_index", { ascending: true }),
    admin.from("offer_media").select("cloudflare_video_short_id, cloudflare_video_long_id").eq("offer_id", id).maybeSingle(),
  ]);

  if (imgErr) {
    return (
      <div className="max-w-3xl">
        <p className="text-accent-400">{imgErr.message}</p>
      </div>
    );
  }

  if (mediaErr) {
    return (
      <div className="max-w-3xl">
        <p className="text-accent-400">{mediaErr.message}</p>
      </div>
    );
  }

  const sortedImages = (images ?? []) as ImageRow[];
  const mediaRow = (media ?? null) as OfferMediaRow | null;
  const shortIframeSrc = mediaRow?.cloudflare_video_short_id
    ? cloudflareStreamIframeUrl(mediaRow.cloudflare_video_short_id)
    : null;
  const longIframeSrc = mediaRow?.cloudflare_video_long_id
    ? cloudflareStreamIframeUrl(mediaRow.cloudflare_video_long_id)
    : null;

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <Link href="/panel/oferty" className="text-[13px] text-ink-400 hover:text-white transition-colors">
          ← Lista ofert
        </Link>
        <h1 className="mt-4 font-display text-[2rem] text-white leading-tight">Edycja oferty</h1>
        <p className="mt-2 text-[13px] text-ink-500 font-mono break-all">{row.galactica_offer_id}</p>
      </div>

      {sp.saved === "1" && (
        <p className="mb-4 text-[13px] text-emerald-400/90 border border-emerald-400/25 rounded-lg px-4 py-3 bg-emerald-400/10">Zapisano zmiany.</p>
      )}
      {sp.uploaded === "1" && (
        <p className="mb-4 text-[13px] text-emerald-400/90 border border-emerald-400/25 rounded-lg px-4 py-3 bg-emerald-400/10">Dodano zdjęcie.</p>
      )}
      {sp.videoSaved === "1" && (
        <p className="mb-4 text-[13px] text-emerald-400/90 border border-emerald-400/25 rounded-lg px-4 py-3 bg-emerald-400/10">
          Zapisano ustawienia wideo.
        </p>
      )}
      {sp.error && (
        <p className="mb-4 text-[13px] text-accent-400 border border-accent-400/25 rounded-lg px-4 py-3 bg-accent-400/10">{sp.error}</p>
      )}

      <section className="rounded-[var(--radius-md)] border border-white/10 bg-paper p-6 md:p-8 mb-10">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500 mb-6">Dane oferty</h2>
        <OfferFormFields
          action={updateOfferAction}
          agents={agents ?? []}
          submitLabel="Zapisz zmiany"
          defaults={{
            id: row.id,
            galactica_offer_id: row.galactica_offer_id,
            category: row.category,
            listing_type: row.listing_type,
            title: row.title ?? "",
            advertisement_text: row.advertisement_text ?? "",
            description: row.description ?? "",
            price: row.price,
            city: row.city ?? "",
            district: row.district ?? "",
            area_usable: row.area_usable,
            area_total: row.area_total,
            area_plot: row.area_plot,
            rooms: row.rooms,
            bedrooms: row.bedrooms,
            bathrooms: row.bathrooms,
            floor: row.floor,
            floors_total: row.floors_total,
            year_built: row.year_built,
            parking_spaces: row.parking_spaces,
            heating: row.heating ?? "",
            building_material: row.building_material ?? "",
            building_state: row.building_state ?? "",
            property_state: row.property_state ?? "",
            kitchen_type: row.kitchen_type ?? "",
            market_type: row.market_type ?? "",
            virtual_tour_url: row.virtual_tour_url ?? "",
            is_active: row.is_active,
            is_exclusive: !!row.is_exclusive,
            is_price_negotiable: !!row.is_price_negotiable,
            has_balcony: !!row.has_balcony,
            has_terrace: !!row.has_terrace,
            has_basement: !!row.has_basement,
            has_garden: !!row.has_garden,
            has_loggia: !!row.has_loggia,
            has_elevator: !!row.has_elevator,
            has_air_conditioning: !!row.has_air_conditioning,
            agent_id: row.agent_id ?? "",
          }}
        />
      </section>

      <section className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500 mb-2">Zdjęcia oferty</h2>
        <p className="text-[13px] text-ink-400 mb-6">
          Galeria na stronie www — pliki w Supabase (<code className="text-ink-200">offer-images</code>), powiązane z tą ofertą.
        </p>

        <OfferImageUploadForm offerId={row.id} galacticaOfferId={row.galactica_offer_id} />

        {sortedImages.length === 0 ? (
          <p className="text-[13px] text-ink-500">Brak zdjęć.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {sortedImages.map((im) => (
              <li key={im.id} className="rounded-lg border border-white/10 overflow-hidden bg-ink-900/50">
                <div className="relative aspect-[4/3] bg-ink-800">
                  <Image src={im.image_url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" unoptimized />
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2 text-[12px] text-ink-400">
                  <span>
                    #{im.order_index}
                    {im.is_primary ? " · główne" : ""}
                  </span>
                  <form action={deleteOfferImageAction}>
                    <input type="hidden" name="image_id" value={im.id} />
                    <input type="hidden" name="offer_id" value={row.id} />
                    <button type="submit" className="text-accent-400 hover:text-accent-300 transition-colors">
                      Usuń
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <OfferFilmSection
        offerId={row.id}
        shortVideoId={mediaRow?.cloudflare_video_short_id ?? null}
        longVideoId={mediaRow?.cloudflare_video_long_id ?? null}
        shortPreviewSrc={shortIframeSrc}
        longPreviewSrc={longIframeSrc}
      />
    </div>
  );
}
