import Link from "next/link";
import { createOfferAction } from "@/app/panel/actions/offers";
import { OfferFormFields } from "@/app/panel/_components/OfferFormFields";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type Props = { searchParams?: Promise<{ error?: string }> };

export default async function PanelOfferNewPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const admin = createSupabaseAdmin();
  const { data: agents } = await admin.from("agents").select("id, name").order("name", { ascending: true });

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <Link href="/panel/oferty" className="text-[13px] text-ink-400 hover:text-white transition-colors">
          ← Lista ofert
        </Link>
        <h1 className="mt-4 font-display text-[2rem] text-white leading-tight">Nowa oferta</h1>
        <p className="mt-2 text-[14px] text-ink-400">Zostanie utworzony identyfikator <code className="text-ink-300">MANUAL-…</code> (UUID).</p>
      </div>

      {sp.error && (
        <p className="mb-6 text-[13px] text-accent-400 border border-accent-400/25 rounded-lg px-4 py-3 bg-accent-400/10">{sp.error}</p>
      )}

      <div className="rounded-[var(--radius-md)] border border-white/10 bg-paper p-6 md:p-8">
        <OfferFormFields action={createOfferAction} agents={agents ?? []} submitLabel="Utwórz ofertę" />
      </div>
    </div>
  );
}
