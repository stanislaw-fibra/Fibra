"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DEBOUNCE_MS = 30_000;

type Status = "idle" | "loading" | "success" | "error";

type ImportResult = {
  status?: "success" | "partial" | "failed" | "skipped";
  offers_created?: number;
  offers_updated?: number;
  offers_deleted?: number;
  offers_skipped?: number;
  message?: string;
  error?: string;
};

function pluralOffers(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return "oferta";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "oferty";
  return "ofert";
}

/**
 * Ręczny trigger importu z Galactiki (`POST /api/import?skipImages=1`). Autoryzacja
 * poprzez sesję zalogowanego admina (cookie). Debounce 30 s chroni przed spamowaniem.
 */
export function RefreshOffersButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [lastRunAt, setLastRunAt] = useState<number>(0);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (lastRunAt === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lastRunAt]);

  const msSinceLastRun = lastRunAt === 0 ? Infinity : now - lastRunAt;
  const disabledByDebounce = msSinceLastRun < DEBOUNCE_MS;
  const cooldownSec = disabledByDebounce
    ? Math.max(1, Math.ceil((DEBOUNCE_MS - msSinceLastRun) / 1000))
    : 0;

  const disabled = status === "loading" || disabledByDebounce;

  const handleClick = useCallback(async () => {
    if (disabled) return;
    setStatus("loading");
    setMessage("Importuję oferty...");

    try {
      const res = await fetch("/api/import?skipImages=1", {
        method: "POST",
        headers: { accept: "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as ImportResult;

      if (!res.ok) {
        const errMsg = data.error || data.message || `Błąd ${res.status}`;
        setStatus("error");
        setMessage(errMsg);
        setLastRunAt(Date.now());
        return;
      }

      const c = data.offers_created ?? 0;
      const u = data.offers_updated ?? 0;
      const d = data.offers_deleted ?? 0;
      const updatedTotal = c + u;
      const summary =
        data.status === "skipped"
          ? "Brak nowych danych — nic nie zmieniono."
          : `Zaktualizowano ${updatedTotal} ${pluralOffers(updatedTotal)}, ${c} ${c === 1 ? "nowa" : "nowych"}, ${d} ${d === 1 ? "usunięta" : pluralOffers(d) === "oferty" ? "usunięte" : "usuniętych"}.`;

      setStatus("success");
      setMessage(summary);
      setLastRunAt(Date.now());
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus("error");
      setMessage(`Nie udało się uruchomić importu: ${msg}`);
      setLastRunAt(Date.now());
    }
  }, [disabled, router]);

  const label = (() => {
    if (status === "loading") return "Importuję...";
    if (disabledByDebounce) return `Poczekaj ${cooldownSec}s`;
    return "Odśwież oferty";
  })();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-[13px] font-medium text-ink-200 transition-colors hover:bg-white/[0.09] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        aria-live="polite"
        title="Uruchom import ofert z Galactiki (bez zdjęć)"
      >
        {status === "loading" ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="animate-spin"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 12a8 8 0 0 1 14-5.3L20 4M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 20M4 20v-5h5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {label}
      </button>
      {message && status !== "idle" && (
        <p
          className={[
            "max-w-md rounded-lg px-3 py-2 text-[12px] leading-snug",
            status === "error"
              ? "border border-accent-400/30 bg-accent-400/10 text-accent-300"
              : status === "success"
                ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : "border border-white/10 bg-white/[0.04] text-ink-300",
          ].join(" ")}
        >
          {message}
        </p>
      )}
    </div>
  );
}
