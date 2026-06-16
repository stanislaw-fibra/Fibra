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

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
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

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!SITE_KEY) return;
    let active = true;
    loadTurnstileScript()
      .then(() => {
        if (!active || !containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (t: string) => setToken(t),
          "error-callback": () => setToken(""),
          "expired-callback": () => setToken(""),
          "timeout-callback": () => setToken(""),
          theme: "auto",
          action: "lead",
        });
      })
      .catch(() => {
        // Sieć do Cloudflare padła - serwer i tak jest fail-open, więc nie
        // blokujemy użytkownika. Zostawiamy honeypot + pułapkę czasową.
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
  }, []);

  // Gotowość do wysyłki: Turnstile wyłączony → zawsze; włączony → dopiero z tokenem.
  const ready = !SITE_KEY || Boolean(token);

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
        {SITE_KEY ? <div ref={containerRef} className="mt-4" /> : null}
      </>
    ),
    [],
  );

  return {
    guards,
    getGuardData,
    resetGuards,
    ready,
    turnstileEnabled: Boolean(SITE_KEY),
  };
}

/** Komunikat pokazywany, gdy Turnstile jeszcze się nie zweryfikował. */
export const GUARD_NOT_READY_MESSAGE =
  "Trwa weryfikacja antyspamowa - spróbuj ponownie za chwilę.";
