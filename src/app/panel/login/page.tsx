import Link from "next/link";
import { loginAction } from "@/app/panel/actions/auth";

type Props = { searchParams?: Promise<{ error?: string; next?: string }> };

export default async function PanelLoginPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const err = sp.error;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <p className="eyebrow eyebrow-on-dark mb-3 text-center">Fibra</p>
        <h1 className="font-display text-[2rem] leading-tight text-white text-center mb-10">Panel administracyjny</h1>

        <form action={loginAction} className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-8 space-y-5">
          {err && (
            <p className="text-[13px] text-accent-400 bg-accent-400/10 border border-accent-400/25 rounded-[var(--radius-sm)] px-3 py-2">
              {err}
            </p>
          )}
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">E-mail</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-[var(--radius-sm)] border border-white/15 bg-ink-900/80 px-4 py-3 text-[14px] text-white outline-none focus:border-brand-400"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">Hasło</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-[var(--radius-sm)] border border-white/15 bg-ink-900/80 px-4 py-3 text-[14px] text-white outline-none focus:border-brand-400"
            />
          </label>
          <input type="hidden" name="next" value={sp.next ?? "/panel/oferty"} />
          <button
            type="submit"
            className="w-full rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[14px] font-medium py-3.5 transition-colors"
          >
            Zaloguj
          </button>
        </form>

        <p className="mt-10 text-center text-[13px] text-ink-500">
          <Link href="/" className="text-white/70 hover:text-accent-400 transition-colors">
            ← Wróć na stronę
          </Link>
        </p>
      </div>
    </div>
  );
}
