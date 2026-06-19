"use client";

import { useEffect, useState } from "react";
import { SITE_LAUNCH_AT } from "@/lib/site-launch";

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Licznik do publicznej premiery. Po dojściu do zera bramka jest już zdjęta po
 * stronie serwera (middleware), więc po prostu wchodzimy na docelową stronę.
 */
export function Countdown({ next }: { next: string }) {
  // null do pierwszego renderu po stronie klienta - unika mismatchu hydratacji.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const left = SITE_LAUNCH_AT - Date.now();
      setRemaining(left);
      if (left <= 0) {
        window.location.href = next || "/";
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [next]);

  const { days, hours, minutes, seconds } = split(remaining ?? 0);
  const units = [
    { label: "dni", value: days },
    { label: "godz", value: hours },
    { label: "min", value: minutes },
    { label: "sek", value: seconds },
  ];

  return (
    <div
      className="flex items-stretch justify-center gap-2.5 sm:gap-3"
      aria-live="off"
    >
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <div className="flex h-[78px] min-w-[68px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 shadow-[var(--shadow-cinematic)] sm:h-[88px] sm:min-w-[80px]">
            <span className="font-display text-[2.1rem] leading-none tabular-nums text-white sm:text-[2.6rem]">
              {remaining === null ? "--" : String(u.value).padStart(2, "0")}
            </span>
          </div>
          <span className="mt-2.5 text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink-400">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}
