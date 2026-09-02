import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/Logo";
import { isZamyslowGatedPath } from "@/lib/zamyslow-gate";
import { isZamyslowLaunched, ZAMYSLOW_LAUNCH_ISO } from "@/lib/zamyslow-launch";
import { Countdown } from "./Countdown";
import { zamyslowGateAction } from "./actions";

const LAUNCH_AT = new Date(ZAMYSLOW_LAUNCH_ISO);

/** np. „poniedziałek, 7 września 2026" - zawsze w czasie polskim. */
const LAUNCH_DATE = new Intl.DateTimeFormat("pl-PL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Warsaw",
}).format(LAUNCH_AT);

/** np. „16:00". */
const LAUNCH_TIME = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
}).format(LAUNCH_AT);

export const metadata: Metadata = {
  title: "Osiedle Zamysłów - przedsprzedaż z pierwszeństwem zakupu",
  robots: { index: false, follow: false },
};

// Bramka musi liczyć czas przy każdym wejściu - inaczej po godzinie otwarcia
// dałoby się trafić na zapisaną w cache wersję z licznikiem zamiast wpuszczenia.
export const dynamic = "force-dynamic";

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

  // Po godzinie otwarcia bramka jest zdjęta - nie pokazujemy już licznika,
  // tylko wpuszczamy odwiedzającego tam, dokąd szedł.
  if (isZamyslowLaunched()) {
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
          <div className="w-full max-w-[520px] text-center">
            <p className="eyebrow eyebrow-on-dark inline-flex items-center justify-center gap-3">
              <span className="inline-block h-px w-8 bg-accent-400" />
              Osiedle Zamysłów · Rybnik
            </p>
            <h1 className="mt-4 font-display text-[2.2rem] leading-[1.05] text-white sm:text-[2.8rem]">
              Oferta w fazie <em className="italic text-accent-400">przedsprzedaży</em>
            </h1>
            <p className="mx-auto mt-4 max-w-[27rem] text-[15px] leading-relaxed text-ink-300">
              Strona inwestycji jest w tej chwili dostępna dla osób, które uzyskały
              pierwszeństwo zakupu.
            </p>

            <div className="mt-11">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink-400">
                Otwarcie dla wszystkich
              </p>
              <p className="mt-2.5 font-display text-[1.35rem] leading-none text-white sm:text-[1.5rem]">
                {LAUNCH_DATE}, godz. {LAUNCH_TIME}
              </p>

              <div className="mt-7">
                <Countdown next={next} />
              </div>
            </div>

            <div className="mx-auto mt-12 max-w-[420px] rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left shadow-[var(--shadow-cinematic)] sm:p-7">
              <p className="font-display text-[1.3rem] leading-tight text-white">
                Masz hasło dostępu?
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-300">
                Osoby z pierwszeństwem zakupu dostały hasło od swojego opiekuna.
                Wpisz je poniżej, żeby zobaczyć pełną ofertę.
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

            <p className="mx-auto mt-6 max-w-[420px] text-[12.5px] leading-relaxed text-ink-400">
              Nie masz hasła, a chcesz dołączyć do przedsprzedaży? Napisz na{" "}
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
            <p>Osiedle Zamysłów · przedsprzedaż z pierwszeństwem zakupu</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
