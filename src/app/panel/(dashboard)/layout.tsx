import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/panel/actions/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const NAV_ADMIN = [
  { href: "/panel/oferty", label: "Oferty" },
  { href: "/panel/zespol", label: "Zespół (O Fibrze)" },
  { href: "/", label: "Strona główna Fibry" },
] as const;

const NAV_AGENT = [
  { href: "/panel/oferty", label: "Moje oferty" },
  { href: "/", label: "Strona główna Fibry" },
] as const;

export default async function PanelDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/panel/login");
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawAgentId = meta.agent_id;
  const agentId = typeof rawAgentId === "string" && rawAgentId.trim() ? rawAgentId.trim() : null;
  const isAdmin = !agentId;
  const nav = isAdmin ? NAV_ADMIN : NAV_AGENT;

  // Dla agenta — dociągnij jego imię/slug żeby pokazać w panelu.
  let agentLabel: { name: string; slug?: string | null } | null = null;
  if (agentId) {
    const admin = createSupabaseAdmin();
    const { data } = await admin.from("agents").select("name, slug").eq("id", agentId).maybeSingle();
    if (data?.name) agentLabel = { name: data.name, slug: data.slug ?? null };
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-white/10 bg-ink-900/90">
        <div className="p-6 border-b border-white/10">
          <p className="font-display text-[1.35rem] text-white leading-none">Fibra</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-500">
            {isAdmin ? "Panel administratora" : "Panel agenta"}
          </p>
        </div>
        {/* Agent — quick access do swojego publicznego profilu. */}
        {agentLabel ? (
          <div className="px-4 pt-4 pb-2">
            <div className="rounded-[var(--radius-sm)] border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-2.5">
              <p className="text-[10.5px] uppercase tracking-[0.14em] text-emerald-300/80">
                Zalogowany jako
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-white truncate">{agentLabel.name}</p>
              {agentLabel.slug ? (
                <Link
                  href={`/agent/${agentLabel.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-[11.5px] text-emerald-200 hover:text-white transition-colors underline-offset-2 hover:underline"
                >
                  Mój publiczny profil
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M4 10L10 4M10 4H5M10 4V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 text-[13px] font-medium text-ink-200 hover:bg-white/5 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-[12px] text-ink-500 truncate">{user.email}</div>
        <div className="p-4 pt-0">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg border border-white/15 px-3 py-2 text-[12px] font-medium text-ink-200 hover:bg-white/5 hover:text-white transition-colors"
            >
              Wyloguj
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between gap-4 px-4 py-3 border-b border-white/10 bg-ink-900/80">
          <p className="font-display text-[1.1rem] text-white">Fibra</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[12px] text-ink-400 hover:text-white">
              Start
            </Link>
            <Link href="/panel/oferty" className="text-[12px] text-ink-200 hover:text-white">
              Oferty
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-[12px] text-ink-400 hover:text-white">
                Wyloguj
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-5 md:p-10 lg:p-12 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
