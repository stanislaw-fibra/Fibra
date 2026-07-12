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

      <div className="mb-8 rounded-[var(--radius-md)] border border-brand-300/30 bg-brand-300/[0.06] px-5 py-4">
        <p className="text-[13px] font-semibold text-brand-200">Zdjęcia, rzuty i filmy dodajesz w następnym kroku</p>
        <p className="mt-1.5 text-[13px] text-ink-300 leading-relaxed">
          Najpierw zapisz podstawowe dane poniżej (wymagane: kategoria, typ i tytuł). Po kliknięciu
          „Utwórz ofertę” od razu przejdziesz do edycji tej oferty, gdzie wgrasz galerię zdjęć, rzut
          oraz filmy. Multimediów nie da się wgrać wcześniej, bo pliki są przypisywane do konkretnej oferty.
        </p>
        <p className="mt-2 text-[13px] text-ink-300 leading-relaxed">
          Chcesz dodać ofertę „na próbę”? Ustaw ją jako <strong className="text-white">niewidoczną na stronie</strong>{" "}
          (przełącznik widoczności w formularzu). Wtedy spokojnie uzupełnisz zdjęcia i filmy, a oferta
          pojawi się publicznie dopiero, gdy sam ją włączysz.
        </p>
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
