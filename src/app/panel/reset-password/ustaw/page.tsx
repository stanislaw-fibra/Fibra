import Link from "next/link";
import { redirect } from "next/navigation";
import { updatePasswordAction } from "@/app/panel/actions/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

type Props = { searchParams?: Promise<{ error?: string }> };

export default async function PanelResetSetPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const err = sp.error;

  // Strona ma sens tylko z sesją recovery ustawioną przez /confirm. Bez niej
  // (wejście z palca, wygasły link) odsyłamy do prośby o nowy link.
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/panel/reset-password?error=${encodeURIComponent("Link wygasł lub jest nieprawidłowy. Poproś o nowy.")}`,
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <p className="eyebrow eyebrow-on-dark mb-3 text-center">Fibra</p>
        <h1 className="font-display text-[2rem] leading-tight text-white text-center mb-10">Nowe hasło</h1>

        <form
          action={updatePasswordAction}
          className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-8 space-y-5"
        >
          {err && (
            <p className="text-[13px] text-accent-400 bg-accent-400/10 border border-accent-400/25 rounded-[var(--radius-sm)] px-3 py-2">
              {err}
            </p>
          )}
          <p className="text-[13px] text-ink-300 leading-relaxed">
            Ustawiasz nowe hasło dla konta <span className="text-white">{user.email}</span>.
          </p>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">Nowe hasło</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-2 w-full rounded-[var(--radius-sm)] border border-white/15 bg-ink-900/80 px-4 py-3 text-[14px] text-white outline-none focus:border-brand-400"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">Powtórz hasło</span>
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-2 w-full rounded-[var(--radius-sm)] border border-white/15 bg-ink-900/80 px-4 py-3 text-[14px] text-white outline-none focus:border-brand-400"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[14px] font-medium py-3.5 transition-colors"
          >
            Zapisz hasło
          </button>
        </form>

        <p className="mt-10 text-center text-[13px] text-ink-500">
          <Link href="/panel/login" className="text-white/70 hover:text-accent-400 transition-colors">
            ← Wróć do logowania
          </Link>
        </p>
      </div>
    </div>
  );
}
