import Link from "next/link";
import { addKnownTeamMemberAction } from "@/app/panel/actions/team";
import { TeamMemberEditor } from "@/app/panel/_components/TeamMemberEditor";
import { TeamPanelGlobalDropGuard } from "@/app/panel/_components/TeamPanelGlobalDropGuard";
import { listKnownTeamMembers } from "@/lib/team-defaults";
import { checkTeamSchemaReady, getAdminTeamMembers } from "@/lib/team-query";

type Props = {
  searchParams?: Promise<{ saved?: string; error?: string; warn?: string }>;
};

const MIGRATION_SQL = `-- Wklej do Supabase SQL Editor i kliknij Run
alter table public.agents
  add column if not exists cloudflare_video_id text,
  add column if not exists bio_long text,
  add column if not exists team_role text,
  add column if not exists team_order int not null default 100,
  add column if not exists is_team_visible boolean not null default false;

create index if not exists agents_team_visible_order_idx
  on public.agents (is_team_visible, team_order)
  where is_team_visible = true;`;

export default async function PanelTeamPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const [members, schema] = await Promise.all([getAdminTeamMembers(), checkTeamSchemaReady()]);

  const existingNamesLower = new Set(members.map((m) => m.name.trim().toLowerCase()));
  const known = listKnownTeamMembers();
  const missingKnown = known.filter((k) => !existingNamesLower.has(k.name.toLowerCase()));

  return (
    <div className="max-w-5xl">
      {/* Globalny strażnik - przechwytuje "puszczone obok dropzone'u" pliki, żeby przeglądarka
          ich nie otwierała w nowej karcie (problem klienta: drag-drop tylko odświeżał stronę). */}
      <TeamPanelGlobalDropGuard />

      <Link href="/panel" className="text-[13px] text-ink-300 hover:text-white transition-colors">
        ← Panel
      </Link>
      <div className="mt-4 mb-8">
        <h1 className="font-display text-[2rem] text-white leading-tight">Zespół na stronie „O Fibrze"</h1>
        <p className="mt-2 text-[14px] text-ink-200 max-w-[64ch] leading-relaxed">
          Tu edytujesz osoby pokazywane w sekcji „Ludzie Fibry": Bartosza, Justynę, Arkadiusza i każdą inną osobę,
          którą oznaczysz jako widoczną w zespole. Każda karta ma własne pole na opis oraz drag-drop pionowego
          filmu z autoprezentacją (Cloudflare Stream). Jeśli filmu nie ma, wyświetlamy zdjęcie jako fallback.
        </p>
      </div>

      {/* WAŻNY BANNER: migracja bazy. Jeżeli kolumn brakuje - pokazujemy 3-krokową instrukcję
          z gotowym SQL do skopiowania. Bez tego admin nie wgra filmów ani nie zapisze ról. */}
      {!schema.ready ? (
        <section className="mb-10 rounded-[var(--radius-md)] border-2 border-amber-400/70 bg-amber-300/[0.08] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span aria-hidden className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-300/30 text-amber-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v5m0 3.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10.3 3.6L2.5 17.4A2 2 0 0 0 4.3 20.4h15.4a2 2 0 0 0 1.8-3l-7.8-13.8a2 2 0 0 0-3.4 0z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-[1.35rem] text-white leading-tight">Wymagana migracja bazy</h2>
              <p className="mt-2 text-[13.5px] text-amber-100/95 leading-relaxed max-w-[72ch]">
                Aby pełna funkcjonalność panelu zespołu (rola, kolejność, widoczność, drag-drop wideo)
                działała, musisz raz uruchomić migrację SQL w Supabase. Brakujące kolumny:{" "}
                <span className="font-mono text-amber-200">{schema.missing.join(", ")}</span>.
              </p>

              <ol className="mt-4 space-y-2.5 text-[13.5px] text-amber-50/95 leading-relaxed list-decimal list-inside">
                <li>
                  Otwórz{" "}
                  <a
                    href="https://supabase.com/dashboard/project/yrkvochsziertbvzbnol/sql/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-white"
                  >
                    Supabase SQL Editor →
                  </a>
                </li>
                <li>Skopiuj poniższy fragment SQL i wklej do edytora.</li>
                <li>Kliknij <strong className="text-white">Run</strong>. Odśwież tę stronę.</li>
              </ol>

              <pre className="mt-4 max-w-full overflow-x-auto rounded-lg border border-white/10 bg-ink-950/80 p-4 text-[12px] leading-relaxed text-emerald-100 font-mono whitespace-pre">
{MIGRATION_SQL}
              </pre>

              <p className="mt-3 text-[12.5px] text-amber-100/90">
                Bez tej migracji panel nadal działa w trybie ograniczonym - opis (kolumna <code>bio</code>)
                zapisuje się normalnie, ale rola, pozycja, widoczność i wgrywanie wideo wymagają nowych kolumn.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {sp.error ? (
        <p className="mb-6 rounded-[var(--radius-sm)] border border-accent-400/30 bg-accent-400/10 px-4 py-3 text-[13.5px] text-accent-200">
          {sp.error}
        </p>
      ) : null}
      {sp.warn ? (
        <p className="mb-6 rounded-[var(--radius-sm)] border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-[13.5px] text-amber-100 leading-relaxed">
          {sp.warn}
        </p>
      ) : null}

      {missingKnown.length > 0 ? (
        <section className="mb-10 rounded-[var(--radius-md)] border border-amber-300/30 bg-amber-300/[0.06] p-5 sm:p-6">
          <h2 className="font-display text-[1.25rem] text-white leading-tight">Brakujące osoby</h2>
          <p className="mt-2 text-[13.5px] text-amber-100/85 max-w-[64ch] leading-relaxed">
            Tych osób nie ma jeszcze w bazie. Kliknij „Dodaj do bazy", żeby utworzyć rekord
            z domyślnym opisem (możesz go edytować od razu po kliknięciu) i włączyć je w pełnej karcie poniżej.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {missingKnown.map((m) => (
              <form key={m.key} action={addKnownTeamMemberAction} className="rounded-[var(--radius-sm)] border border-white/10 bg-ink-900/60 p-4">
                <input type="hidden" name="key" value={m.key} />
                <p className="text-[15px] font-semibold text-white leading-tight">{m.name}</p>
                <p className="mt-1 text-[12.5px] text-ink-200 leading-snug">{m.defaults.role}</p>
                <button
                  type="submit"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-[12.5px] font-semibold px-4 py-2 transition-colors shadow-[0_8px_20px_-10px_rgba(16,185,129,0.55)]"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  Dodaj do bazy
                </button>
              </form>
            ))}
          </div>
        </section>
      ) : null}

      {members.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-white/10 bg-white/5 px-6 py-10 text-[14px] text-ink-200 leading-relaxed">
          Nie znaleziono żadnych agentów. Najpierw dodaj agentów przez przycisk „Dodaj do bazy" powyżej
          (Bartosz / Justyna / Arkadiusz) lub bezpośrednio w Supabase (tabela <code>agents</code>) -
          potem wrócą tutaj jako edytowalne karty zespołu.
        </p>
      ) : (
        <div className="space-y-8">
          {members.map((m) => (
            <TeamMemberEditor
              key={m.id}
              id={m.id}
              name={m.name}
              role={m.role}
              bio={m.bio}
              order={m.order}
              isVisible={m.isVisible}
              videoId={m.cloudflareVideoId}
              photoUrl={m.photoUrl}
              justSaved={sp.saved === m.id}
              videoEnabled={schema.ready}
              slug={m.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
