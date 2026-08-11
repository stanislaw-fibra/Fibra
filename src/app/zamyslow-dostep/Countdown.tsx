"use client";

import { useEffect, useRef, useState } from "react";
import { ZAMYSLOW_LAUNCH_AT } from "@/lib/zamyslow-launch";

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const PLURAL = new Intl.PluralRules("pl-PL");

/** „2 dni", „21 godzin" - do wersji czytanej przez czytnik ekranu. */
function plural(value: number, forms: [string, string, string]) {
  const rule = PLURAL.select(value);
  const word = rule === "one" ? forms[0] : rule === "few" ? forms[1] : forms[2];
  return `${value} ${word}`;
}

/**
 * Licznik do publicznego otwarcia stron Zamysłowa. Po dojściu do zera bramka
 * jest już zdjęta po stronie serwera (middleware), więc po prostu wchodzimy na
 * stronę inwestycji.
 */
export function Countdown({ next }: { next: string }) {
  // null do pierwszego renderu po stronie klienta - unika mismatchu hydratacji.
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Wchodzimy automatycznie tylko wtedy, gdy licznik zszedł do zera na oczach
  // odwiedzającego. Gdyby zegar przeglądarki się spieszył, serwer wciąż
  // odsyłałby tu z powrotem - zamiast pętli przekierowań dajemy wtedy przycisk.
  const wasCountingDown = useRef(false);

  useEffect(() => {
    const tick = () => {
      const left = ZAMYSLOW_LAUNCH_AT - Date.now();
      if (left > 0) {
        wasCountingDown.current = true;
        setRemaining(left);
        return;
      }
      setRemaining(0);
      setIsOpen(true);
      if (wasCountingDown.current) {
        wasCountingDown.current = false;
        window.location.href = next;
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [next]);

  if (isOpen) {
    return (
      <div className="text-center">
        <p className="text-[15px] leading-relaxed text-ink-200">
          Dostęp jest już otwarty dla wszystkich.
        </p>
        <a
          href={next}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-brand-400"
        >
          Przejdź do oferty
        </a>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = split(remaining ?? 0);
  const units = [
    { key: "d", label: "dni", value: days },
    { key: "h", label: "godz.", value: hours },
    { key: "m", label: "min", value: minutes },
    { key: "s", label: "sek", value: seconds },
  ];

  return (
    <div>
      {remaining !== null && (
        <p className="sr-only" aria-live="off">
          {`Do otwarcia zostało ${plural(days, ["dzień", "dni", "dni"])}, ${plural(
            hours,
            ["godzina", "godziny", "godzin"],
          )} i ${plural(minutes, ["minuta", "minuty", "minut"])}.`}
        </p>
      )}

      <div
        className="flex items-start justify-center gap-2 sm:gap-3"
        aria-hidden="true"
      >
        {units.map((u) => (
          <div key={u.key} className="flex flex-col items-center">
            <div className="flex h-[76px] min-w-[70px] items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.015] px-3 shadow-[var(--shadow-cinematic)] sm:h-[92px] sm:min-w-[86px] sm:px-4">
              <span className="font-display text-[2.15rem] leading-none tabular-nums text-white sm:text-[2.7rem]">
                {remaining === null ? "--" : String(u.value).padStart(2, "0")}
              </span>
            </div>
            <span className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400 sm:text-[10.5px]">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
