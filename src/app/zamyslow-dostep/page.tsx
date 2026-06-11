import type { Metadata } from "next";
import { Logo } from "@/components/site/Logo";
import { isZamyslowGatedPath } from "@/lib/zamyslow-gate";
import { zamyslowGateAction } from "./actions";

export const metadata: Metadata = {
  title: "Zamysłów - dostęp",
  robots: { index: false, follow: false },
};

export default async function ZamyslowGatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const next =
    typeof sp.next === "string" && isZamyslowGatedPath(sp.next) ? sp.next : "/zamyslow";
  const hasError = sp.error === "1";
  const configError = sp.error === "config";

  return (
    <div className="grain-on-dark relative min-h-screen bg-ink-950 text-white">
      <div className="grad-radial-hero pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="container-xl py-8">
          <Logo variant="paper" href={null} />
        </header>

        <main className="container-xl flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[440px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 shadow-[var(--shadow-cinematic)] sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">
                Projekt Zamysłów
              </p>
              <h1 className="mt-3 font-display text-[2rem] leading-[1.05] text-white sm:text-[2.3rem]">
                Dostęp do materiałów
              </h1>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-300">
                Ta sekcja jest w przygotowaniu. Podaj hasło dostępu, aby zobaczyć materiały
                projektu Zamysłów.
              </p>

              {hasError && (
                <p className="mt-5 rounded-lg border border-accent-400/30 bg-accent-400/10 px-4 py-3 text-[13.5px] text-accent-400">
                  Nieprawidłowe hasło. Sprawdź pisownię i spróbuj ponownie.
                </p>
              )}
              {configError && (
                <p className="mt-5 rounded-lg border border-accent-400/30 bg-accent-400/10 px-4 py-3 text-[13.5px] text-accent-400">
                  Bramka nie jest jeszcze skonfigurowana. Napisz do nas, pomożemy od ręki.
                </p>
              )}

              <form action={zamyslowGateAction} className="mt-6 space-y-5">
                <input type="hidden" name="next" value={next} />

                <div>
                  <label
                    htmlFor="password"
                    className="block text-[12px] font-medium text-ink-200"
                  >
                    Hasło dostępu
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="off"
                    autoFocus
                    placeholder="Wpisz hasło"
                    className="mt-1.5 w-full rounded-lg border border-white/12 bg-ink-950/40 px-3.5 py-2.5 text-[14.5px] text-white placeholder:text-ink-500 outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400/40"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-500 px-4 py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-brand-400"
                >
                  Wejdź
                </button>
              </form>
            </div>

            <p className="mt-5 text-center text-[12.5px] leading-relaxed text-ink-400">
              Problem z dostępem? Napisz na{" "}
              <a
                href="mailto:biuro@grupafibra.pl"
                className="text-brand-300 underline-offset-2 hover:underline"
              >
                biuro@grupafibra.pl
              </a>
            </p>
          </div>
        </main>

        <footer className="hairline-dark-t">
          <div className="container-xl flex flex-col gap-2 py-8 text-[12.5px] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-[1.3rem] leading-none text-white">Fibra</p>
            <p>Projekt Zamysłów - materiały w przygotowaniu</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
