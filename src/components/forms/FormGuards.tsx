"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Wspólna ochrona antybotowa formularzy (klient). Jeden hook dokłada do każdego
 * formularza:
 *   - honeypot (ukryte pole-pułapka),
 *   - znacznik czasu montażu (pułapka czasowa po stronie serwera),
 *   - widget Cloudflare Turnstile (gdy ustawiony NEXT_PUBLIC_TURNSTILE_SITE_KEY).
 *
 * Użycie:
 *   const { guards, getGuardData, ready } = useFormGuards();
 *   ...w <form>:  {guards}
 *   ...w submit:  if (!ready) return;  await submitLead({ ...payload, ...getGuardData() });
 *
 * Gdy site key NIE jest ustawiony (np. lokalnie / zanim klient skonfiguruje),
 * Turnstile się nie renderuje, a `ready` jest zawsze true - formularze działają
 * normalnie, chronione honeypotem + pułapką czasową + rate-limitem na serwerze.
 */

// Prawdziwy klucz produkcyjny (z env). Poza produkcją (localhost, *.vercel.app)
// używamy testowego klucza Cloudflare, który ZAWSZE przechodzi - dzięki temu dev
// i preview nie wpadają w błąd 110200 (domena spoza allowlisty sitekey), a formularze
// działają end-to-end. Serwer (/api/leads) pomija weryfikację Turnstile poza prod.
const REAL_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const TEST_SITE_KEY = "1x00000000000000000000AA";
const PROD_HOSTS = new Set(["fibra.pl", "www.fibra.pl"]);

/** Czy Turnstile jest w ogóle skonfigurowany (steruje renderem widgetu i `ready`). */
const TURNSTILE_ENABLED = Boolean(REAL_SITE_KEY);

/** Klucz do renderu widgetu: prawdziwy tylko na hoście produkcyjnym, inaczej testowy. */
function resolveSiteKey(): string {
  if (typeof window !== "undefined" && !PROD_HOSTS.has(window.location.hostname)) {
    return TEST_SITE_KEY;
  }
  return REAL_SITE_KEY ?? "";
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type GuardData = {
  hp: string;
  ts: number;
  turnstile_token: string;
};

let scriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile script failed to load"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function useFormGuards() {
  const mountedAtRef = useRef<number>(0);
  const hpRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const [turnstileError, setTurnstileError] = useState(false);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!TURNSTILE_ENABLED) return;
    let active = true;
    loadTurnstileScript()
      .then(() => {
        if (!active || !containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: resolveSiteKey(),
          callback: (t: string) => {
            setToken(t);
            setTurnstileError(false);
          },
          "error-callback": () => {
            setToken("");
            setTurnstileError(true);
          },
          "expired-callback": () => setToken(""),
          "timeout-callback": () => {
            setToken("");
            setTurnstileError(true);
          },
          theme: "auto",
          action: "lead",
        });
      })
      .catch(() => {
        // Skrypt CF się nie wczytał (np. AdBlock). Pokazujemy czytelny komunikat
        // z opcją ponowienia zamiast martwego przycisku.
        setTurnstileError(true);
      });
    return () => {
      active = false;
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  const getGuardData = useCallback(
    (): GuardData => ({
      hp: hpRef.current?.value ?? "",
      ts: mountedAtRef.current || Date.now(),
      turnstile_token: token,
    }),
    [token],
  );

  const resetGuards = useCallback(() => {
    if (window.turnstile && widgetIdRef.current) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // ignore
      }
    }
    setToken("");
    setTurnstileError(false);
  }, []);

  // Gotowość do wysyłki: Turnstile wyłączony → zawsze; włączony → dopiero z tokenem.
  const ready = !TURNSTILE_ENABLED || Boolean(token);

  const guards = useMemo(
    () => (
      <>
        {/* Honeypot - poza ekranem, niedostępny dla klawiatury i autouzupełniania. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        >
          <label>
            Nie wypełniaj tego pola
            <input
              ref={hpRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </label>
        </div>
        {TURNSTILE_ENABLED ? (
          <div className="mt-4">
            <div ref={containerRef} />
            {turnstileError ? (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
                Weryfikacja antyspamowa nie odpowiada.{" "}
                <button
                  type="button"
                  onClick={resetGuards}
                  className="font-medium text-brand-600 underline underline-offset-2 transition-colors hover:text-brand-500"
                >
                  Spróbuj ponownie
                </button>{" "}
                lub zadzwoń:{" "}
                <a href="tel:+48510777200" className="font-medium text-brand-600 hover:text-brand-500">
                  510 777 200
                </a>
                .
              </p>
            ) : null}
          </div>
        ) : null}
      </>
    ),
    [turnstileError, resetGuards],
  );

  return {
    guards,
    getGuardData,
    resetGuards,
    ready,
    turnstileEnabled: TURNSTILE_ENABLED,
  };
}

/** Komunikat pokazywany, gdy Turnstile jeszcze się nie zweryfikował. */
export const GUARD_NOT_READY_MESSAGE =
  "Trwa weryfikacja antyspamowa - spróbuj ponownie za chwilę.";
