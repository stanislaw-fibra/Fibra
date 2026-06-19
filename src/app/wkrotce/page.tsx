import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/Logo";
import { safeSiteGateNext } from "@/lib/site-gate";
import { isLaunched, SITE_LAUNCH_ISO } from "@/lib/site-launch";
import { Countdown } from "./Countdown";
import { siteGateAction } from "./actions";

const LAUNCH_LABEL = new Intl.DateTimeFormat("pl-PL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
}).format(new Date(SITE_LAUNCH_ISO));

export const metadata: Metadata = {
  title: "Premiera już wkrótce - Fibra",
  robots: { index: false, follow: false },
};

export default async function WkrotcePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeSiteGateNext(sp.next);
  const hasError = sp.error === "1";
  const configError = sp.error === "config";

  // Po premierze bramka jest zdjęta - nie pokazujemy już licznika, wpuszczamy.
  if (isLaunched()) {
    redirect(next);
  }

  return (
    <div className="grain-on-dark relative min-h-screen bg-ink-950 text-white">
      <div className="grad-radial-hero pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="container-xl py-8">
          <Logo variant="paper" href={null} />
        </header>

        <main className="container-xl flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[460px] text-center">
            <p className="eyebrow eyebrow-on-dark inline-flex items-center justify-center gap-3">
              <span className="inline-block h-px w-8 bg-accent-400" />
              Fibra Nieruchomości
            </p>
            <h1 className="mt-4 font-display text-[2.2rem] leading-[1.05] text-white sm:text-[2.8rem]">
              Premiera strony{" "}
              <em className="italic text-accent-400">już wkrótce</em>
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-ink-300">
              Nowa strona Fibry rusza{" "}
              <span className="text-white">{LAUNCH_LABEL}</span>. Odliczamy do
              startu.
            </p>

            <div className="mt-9">
              <Countdown next={next} />
            </div>

            <div className="mx-auto mt-12 max-w-[400px] rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left shadow-[var(--shadow-cinematic)] sm:p-7">
              <p className="mb-5 text-center text-[12.5px] uppercase tracking-[0.18em] text-ink-400">
                Masz wcześniejszy dostęp?
              </p>
              {hasError && (
                <p className="mb-5 rounded-lg border border-accent-400/30 bg-accent-400/10 px-4 py-3 text-[13.5px] text-accent-400">
                  Nieprawidłowe hasło. Sprawdź pisownię i spróbuj ponownie.
                </p>
              )}
              {configError && (
                <p className="mb-5 rounded-lg border border-accent-400/30 bg-accent-400/10 px-4 py-3 text-[13.5px] text-accent-400">
                  Bramka nie jest jeszcze skonfigurowana. Napisz do nas, pomożemy
                  od ręki.
                </p>
              )}

              <form action={siteGateAction} className="space-y-5">
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

            <p className="mt-6 text-center text-[12.5px] leading-relaxed text-ink-400">
              Kontakt:{" "}
              <a
                href="mailto:biuro@grupafibra.pl"
                className="text-brand-300 underline-offset-2 hover:underline"
              >
                biuro@grupafibra.pl
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
