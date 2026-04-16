import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/panel/actions/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

const NAV = [
  { href: "/panel/oferty", label: "Oferty" },
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

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-white/10 bg-ink-900/90">
        <div className="p-6 border-b border-white/10">
          <p className="font-display text-[1.35rem] text-white leading-none">Fibra</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-500">Panel</p>
        </div>
        {/* TODO: przycisk „Odśwież oferty z Galactiki” — ręczny trigger importu XML (cron / worker), gdy importer będzie gotowy. */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => (
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
