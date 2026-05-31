"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ToastKind = "saved" | "uploaded" | "videoSaved" | "error" | null;

type Props = {
  /** ID formularza (atrybut `form="..."` na przycisku w sticky bar). */
  formId: string;
  /** Tytuł oferty pokazany w pasku górnym - żeby od razu było wiadomo, co się edytuje. */
  title: string;
  /** Sub-tekst (np. ID Galactica) pomocny technicznie. */
  subtitle?: string;
  /** Treść strony - sekcje formularza, zdjęcia, rzuty, video. */
  children: React.ReactNode;
};

/**
 * Powłoka strony edycji oferty w panelu admina.
 *
 * Klient zwracał uwagę, że w panelu „nie ma nigdzie zapisz", można dodać plik i wyjść w przekonaniu,
 * że coś już zostało utrwalone. Dlatego ta powłoka wprowadza trzy rzeczy, które jednoznacznie
 * komunikują stan zapisu:
 *
 * 1. **Sticky bar u góry** z dużym, kontrastowym przyciskiem „Zapisz zmiany". Przycisk jest
 *    związany z formularzem przez atrybut `form="…"`, więc działa nawet gdy user przewinął na sam dół.
 * 2. **Sticky bar u dołu** (mobile-first), żeby na telefonie nie trzeba było skakać do góry.
 * 3. **Duży toast** po zapisie, znikający dopiero po kliknięciu „OK" lub po 6 sekundach.
 *    Toast jest karmiony query-paramem `?saved=1` / `?uploaded=1` / `?videoSaved=1`, który ustawia
 *    server action po sukcesie.
 * 4. **Tracking dirty state** - po zmianie dowolnego pola pasek z czerwoną kropką sygnalizuje
 *    „Masz niezapisane zmiany". Ostrzeżenie `beforeunload` chroni przed wyjściem bez zapisu.
 */
export function PanelEditShell({ formId, title, subtitle, children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ kind: ToastKind; key: number } | null>(null);
  const dismissTimer = useRef<number | null>(null);

  // Detekcja toastów z query stringa po server-action redirect.
  useEffect(() => {
    const s = searchParams;
    let kind: ToastKind = null;
    if (s.get("saved") === "1") kind = "saved";
    else if (s.get("uploaded") === "1") kind = "uploaded";
    else if (s.get("videoSaved") === "1") kind = "videoSaved";
    else if (s.get("error")) kind = "error";

    if (!kind) return;
    setToast({ kind, key: Date.now() });
    setDirty(false);
    setSubmitting(false);
    if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
    dismissTimer.current = window.setTimeout(() => {
      setToast((t) => (t ? null : t));
      // wyczyść query string żeby toast nie wracał po refreshu
      const url = new URL(window.location.href);
      ["saved", "uploaded", "videoSaved", "error"].forEach((k) => url.searchParams.delete(k));
      router.replace(url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : ""), {
        scroll: false,
      });
    }, 6000);
    return () => {
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
    };
  }, [searchParams, router]);

  // Dirty tracking - bind do submitu i zmiany dowolnego pola w formularzu z `formId`.
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const onChange = () => setDirty(true);
    const onSubmit = () => setSubmitting(true);

    form.addEventListener("input", onChange);
    form.addEventListener("change", onChange);
    form.addEventListener("submit", onSubmit);
    return () => {
      form.removeEventListener("input", onChange);
      form.removeEventListener("change", onChange);
      form.removeEventListener("submit", onSubmit);
    };
  }, [formId]);

  // beforeunload - ostrzeżenie przed zamknięciem karty z niezapisanymi zmianami.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const errorMsg = searchParams.get("error");
  const toastKind = toast?.kind;

  return (
    <div className="relative pb-32 md:pb-24">
      {/* TOP STICKY BAR - pokazuje co edytujesz + duży primary „Zapisz zmiany". */}
      <div className="sticky top-0 z-30 -mx-5 mb-8 border-b border-white/10 bg-ink-900/95 backdrop-blur-xl px-5 py-3 md:-mx-10 md:px-10 lg:-mx-12 lg:px-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-300">Edycja oferty</p>
            <p className="mt-0.5 truncate font-display text-[18px] sm:text-[20px] text-white leading-tight">{title}</p>
            {subtitle ? (
              <p className="mt-0.5 truncate font-mono text-[11px] text-ink-300">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {dirty && !submitting ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1.5 text-[12px] font-semibold text-amber-300 border border-amber-300/40">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />
                Niezapisane zmiany
              </span>
            ) : null}
            <button
              type="submit"
              form={formId}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(242,101,34,0.65)] transition-all hover:bg-accent-400 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Zapisz wszystkie zmiany w ofercie"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
                    <path
                      d="M14 8a6 6 0 0 0-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Zapisuję…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M3 8.5L6.5 12 13 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Zapisz zmiany
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {toastKind && (
        <Toast
          key={toast?.key}
          kind={toastKind}
          errorMsg={errorMsg}
          onDismiss={() => setToast(null)}
        />
      )}

      {children}

      {/* BOTTOM STICKY BAR - duplikuje przycisk u dołu na mobile / dłuższych formularzach. */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-ink-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)] md:left-[240px]">
        <div className="px-5 md:px-10 lg:px-12 py-3 flex items-center justify-between gap-3">
          <p className="text-[12px] text-ink-300 hidden sm:block">
            {dirty && !submitting
              ? "Masz niezapisane zmiany - kliknij Zapisz, żeby utrwalić."
              : submitting
                ? "Zapisywanie…"
                : "Wszystkie zmiany zapisane."}
          </p>
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(242,101,34,0.65)] transition-all hover:bg-accent-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Zapisuję…" : "Zapisz zmiany"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({
  kind,
  errorMsg,
  onDismiss,
}: {
  kind: NonNullable<ToastKind>;
  errorMsg: string | null;
  onDismiss: () => void;
}) {
  const isError = kind === "error";
  const headline =
    kind === "saved"
      ? "Zapisano zmiany w ofercie"
      : kind === "uploaded"
        ? "Dodano zdjęcie"
        : kind === "videoSaved"
          ? "Zapisano ustawienia wideo"
          : "Coś poszło nie tak";
  const body =
    kind === "saved"
      ? "Wszystkie pola, które zmieniłeś, są już w bazie. Strona oferty będzie zaktualizowana w ciągu kilku sekund."
      : kind === "uploaded"
        ? "Nowe zdjęcie dołączone do oferty. Możesz dodać kolejne lub przejść do edycji innych pól."
        : kind === "videoSaved"
          ? "Powiązanie z filmem Cloudflare zostało zaktualizowane."
          : errorMsg || "Spróbuj ponownie. Jeśli błąd się powtarza, skontaktuj się z administratorem.";

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "mb-8 flex items-start gap-4 rounded-[var(--radius-md)] border p-5 shadow-[var(--shadow-soft)] animate-[panel-toast-in_320ms_cubic-bezier(.2,.8,.2,1)_both]",
        isError
          ? "border-accent-400/40 bg-accent-400/10 text-accent-200"
          : "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isError ? "bg-accent-400/20" : "bg-emerald-400/20",
        ].join(" ")}
      >
        {isError ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M10 5v6m0 3.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M5 10.5L8.5 14 15 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-tight">{headline}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed opacity-90">{body}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="-mr-1 -mt-1 rounded-full p-2 text-current opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
        aria-label="Zamknij komunikat"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
