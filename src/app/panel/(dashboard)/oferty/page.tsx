import Image from "next/image";
import Link from "next/link";
import { toggleOfferActiveAction } from "@/app/panel/actions/offers";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { priceFormat } from "@/lib/offers";

type Search = {
  category?: string;
  listing?: string;
  active?: string;
  source?: string;
  q?: string;
  error?: string;
};

type OfferRow = {
  id: string;
  galactica_offer_id: string;
  title: string | null;
  category: string;
  listing_type: string;
  price: number | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
  offer_images: { image_url: string; order_index: number; is_primary: boolean | null }[] | null;
  offer_media: { cloudflare_video_short_id: string | null } | { cloudflare_video_short_id: string | null }[] | null;
};

function escapeIlike(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function hasShortStreamVideo(row: OfferRow) {
  const m = row.offer_media;
  const o = Array.isArray(m) ? m[0] : m;
  return Boolean(o?.cloudflare_video_short_id?.trim());
}

function thumbUrl(images: OfferRow["offer_images"]) {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => {
    const pa = a.is_primary ? 1 : 0;
    const pb = b.is_primary ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return (a.order_index ?? 0) - (b.order_index ?? 0);
  });
  return sorted[0]?.image_url ?? null;
}

const CAT_LABEL: Record<string, string> = {
  mieszkania: "Mieszkania",
  domy: "Domy",
  dzialki: "Działki",
  lokale: "Lokale",
};

const LIST_LABEL: Record<string, string> = {
  sprzedaz: "Sprzedaż",
  wynajem: "Wynajem",
};

const selectDark =
  "panel-select panel-select--dark mt-2 w-full rounded-[var(--radius-sm)] border border-white/15 bg-ink-900/80 py-2.5 pl-3 pr-9 text-[13px] text-white outline-none transition-colors focus:border-brand-400 hover:border-white/25";

function wynikiPhrase(n: number) {
  if (n === 1) return "1 wynik";
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} wyniki`;
  return `${n} wyników`;
}

function EditPencil({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 17l-4 1 1-4 11.5-11.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = { searchParams?: Promise<Search> };

export default async function PanelOffersPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const category = sp.category ?? "all";
  const listing = sp.listing ?? "all";
  const active = sp.active ?? "all";
  const source = sp.source ?? "all";
  const q = (sp.q ?? "").trim();

  const admin = createSupabaseAdmin();
  let query = admin
    .from("offers")
    .select(
      "id, galactica_offer_id, title, category, listing_type, price, city, is_active, created_at, offer_images ( image_url, order_index, is_primary ), offer_media ( cloudflare_video_short_id )",
    )
    .order("created_at", { ascending: false })
    .limit(400);

  if (category !== "all") query = query.eq("category", category);
  if (listing !== "all") query = query.eq("listing_type", listing);
  if (active === "true") query = query.eq("is_active", true);
  if (active === "false") query = query.eq("is_active", false);
  if (source === "manual") query = query.ilike("galactica_offer_id", "MANUAL-%");
  if (source === "galactica") query = query.not("galactica_offer_id", "ilike", "MANUAL-%");

  if (q.length) {
    const pat = `%${escapeIlike(q)}%`;
    query = query.or(`title.ilike.${pat},advertisement_text.ilike.${pat},city.ilike.${pat}`);
  }

  const { data: rows, error } = await query;
  if (error) {
    return (
      <div className="max-w-3xl">
        <h1 className="font-display text-2xl text-white mb-4">Oferty</h1>
        <p className="text-[14px] text-accent-400 border border-accent-400/30 rounded-lg px-4 py-3 bg-accent-400/10">{error.message}</p>
      </div>
    );
  }

  const list = (rows ?? []) as OfferRow[];

  return (
    <div className="max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
        <div>
          <h1 className="font-display text-[2rem] md:text-[2.25rem] text-white leading-tight">Oferty</h1>
          <p className="mt-2 text-[14px] text-ink-400">Lista aktualnych ofert Grupy Fibra. {wynikiPhrase(list.length)}.</p>
        </div>
        <Link
          href="/panel/oferty/nowa"
          className="inline-flex justify-center rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[14px] font-medium px-6 py-3 transition-colors shrink-0"
        >
          Dodaj ofertę
        </Link>
      </div>

      {sp.error && (
        <p className="mb-6 text-[13px] text-accent-400 border border-accent-400/25 rounded-lg px-4 py-3 bg-accent-400/10">{sp.error}</p>
      )}

      <form method="get" className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] p-5 mb-8 space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Kategoria</span>
            <select name="category" defaultValue={category} className={selectDark}>
              <option value="all">Wszystkie</option>
              <option value="mieszkania">Mieszkania</option>
              <option value="domy">Domy</option>
              <option value="dzialki">Działki</option>
              <option value="lokale">Lokale</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Typ</span>
            <select name="listing" defaultValue={listing} className={selectDark}>
              <option value="all">Wszystkie</option>
              <option value="sprzedaz">Sprzedaż</option>
              <option value="wynajem">Wynajem</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Status</span>
            <select name="active" defaultValue={active} className={selectDark}>
              <option value="all">Wszystkie</option>
              <option value="true">Aktywne</option>
              <option value="false">Nieaktywne</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Źródło</span>
            <select name="source" defaultValue={source} className={selectDark}>
              <option value="all">Wszystkie</option>
              <option value="manual">Ręczne (MANUAL-)</option>
              <option value="galactica">Galactica / import</option>
            </select>
          </label>
        </div>
        <label className="block max-w-xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Szukaj (tytuł, reklama, miasto)</span>
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="np. Rybnik, 3 pokoje…"
            className="mt-2 w-full rounded-[var(--radius-sm)] border border-white/15 bg-ink-900/80 px-3 py-2.5 text-[13px] text-white outline-none transition-colors focus:border-brand-400 hover:border-white/25 placeholder:text-ink-600"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-full bg-white/10 hover:bg-white/15 text-white text-[13px] font-medium px-5 py-2.5 transition-colors"
          >
            Filtruj
          </button>
          <Link
            href="/panel/oferty"
            className="inline-flex items-center rounded-full border border-white/15 text-ink-300 hover:text-white text-[13px] font-medium px-5 py-2.5 transition-colors"
          >
            Wyczyść
          </Link>
        </div>
      </form>

      <div className="rounded-[var(--radius-md)] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] min-w-[820px]">
            <thead className="bg-white/[0.04] text-ink-400 uppercase tracking-[0.08em] text-[10px]">
              <tr>
                <th className="px-4 py-3 w-[72px]" />
                <th className="px-4 py-3 font-medium min-w-[200px]">Oferta</th>
                <th className="px-4 py-3 font-medium">Kategoria</th>
                <th className="px-4 py-3 font-medium">Cena</th>
                <th className="px-4 py-3 font-medium">Źródło</th>
                <th className="px-4 py-3 font-medium text-center w-[72px]" title="Krótki film (Stream)">
                  Film
                </th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-[120px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {list.map((row) => {
                const thumb = thumbUrl(row.offer_images);
                const manual = row.galactica_offer_id.startsWith("MANUAL-");
                const hasVideo = hasShortStreamVideo(row);
                return (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 align-middle">
                      <Link href={`/panel/oferty/${row.id}`} className="block relative w-14 h-14 rounded-md overflow-hidden bg-ink-800 shrink-0">
                        {thumb ? (
                          <Image src={thumb} alt="" fill className="object-cover" sizes="56px" unoptimized />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-ink-600">brak</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/panel/oferty/${row.id}`}
                            className="font-medium text-white hover:text-accent-400 transition-colors line-clamp-2"
                          >
                            {row.title ?? "-"}
                          </Link>
                          <p className="text-ink-500 mt-0.5">{row.city ?? "-"}</p>
                        </div>
                        <Link
                          href={`/panel/oferty/${row.id}`}
                          className="shrink-0 rounded-lg p-2 text-ink-500 hover:bg-white/[0.08] hover:text-accent-400 transition-colors"
                          aria-label={`Edytuj: ${row.title ?? "oferta"}`}
                          title="Edytuj"
                        >
                          <EditPencil />
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-ink-300">
                      {CAT_LABEL[row.category] ?? row.category}
                      <span className="text-ink-600"> · </span>
                      {LIST_LABEL[row.listing_type] ?? row.listing_type}
                    </td>
                    <td className="px-4 py-3 align-middle text-ink-200 tabular-nums">{row.price != null ? priceFormat(row.price) : "-"}</td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={
                          manual
                            ? "inline-flex rounded-md border border-accent-400/40 text-accent-400 px-2 py-0.5 text-[11px] font-medium"
                            : "inline-flex rounded-md border border-white/15 text-ink-400 px-2 py-0.5 text-[11px] font-medium"
                        }
                      >
                        {manual ? "Ręczna" : "Import"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      {hasVideo ? (
                        <span className="inline-flex text-emerald-400/90" title="Ma krótki film (homepage)">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M4 8a2 2 0 0 1 2-2h2l2-2h4l2 2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-ink-600 text-[11px]" title="Brak krótkiego filmu - nie widać na stronie głównej">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className={row.is_active ? "text-emerald-400/90" : "text-ink-500"}>{row.is_active ? "Aktywna" : "Ukryta"}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <form action={toggleOfferActiveAction} className="inline">
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="active" value={row.is_active ? "false" : "true"} />
                        <button
                          type="submit"
                          className="text-[12px] font-medium text-ink-400 hover:text-white border border-white/15 rounded-lg px-2.5 py-1.5 transition-colors"
                        >
                          {row.is_active ? "Ukryj" : "Pokaż"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <p className="px-4 py-12 text-center text-ink-500 text-[14px]">Brak ofert dla wybranych filtrów.</p>}
      </div>
    </div>
  );
}
