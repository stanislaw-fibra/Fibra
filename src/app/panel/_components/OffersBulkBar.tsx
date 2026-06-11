"use client";

import { useEffect, useState } from "react";

/**
 * Pasek masowych akcji nad listą ofert. Sam pasek jest <form id="offers-bulk">, a checkboxy
 * w wierszach tabeli są z nim spięte atrybutem `form="offers-bulk"` (HTML pozwala wiązać
 * kontrolki z formularzem-nie-przodkiem). Dzięki temu nie ma zagnieżdżonych <form> z
 * pojedynczym przyciskiem „Ukryj/Pokaż" w wierszach.
 *
 * Dwa przyciski submit przekazują różne `hidden` (true = wygaś, false = przywróć) i wołają
 * tę samą akcję serwerową przez `formAction`.
 */
export function OffersBulkBar({
  action,
  returnTo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  returnTo: string;
}) {
  const [count, setCount] = useState(0);

  function boxes(): HTMLInputElement[] {
    if (typeof document === "undefined") return [];
    return Array.from(document.querySelectorAll<HTMLInputElement>('input[data-bulk-offer="1"]'));
  }

  useEffect(() => {
    const recount = () => setCount(boxes().filter((b) => b.checked).length);
    document.addEventListener("change", recount);
    recount();
    return () => document.removeEventListener("change", recount);
  }, []);

  function selectAll(checked: boolean) {
    for (const b of boxes()) b.checked = checked;
    setCount(checked ? boxes().length : 0);
  }

  const disabled = count === 0;

  return (
    <form
      id="offers-bulk"
      className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] px-5 py-4 mb-4"
    >
      <input type="hidden" name="returnTo" value={returnTo} />

      <label className="inline-flex items-center gap-2 text-[13px] text-ink-200 cursor-pointer select-none">
        <input
          type="checkbox"
          onChange={(e) => selectAll(e.currentTarget.checked)}
          className="h-4 w-4 rounded border-white/25 bg-ink-900 accent-brand-500"
        />
        Zaznacz wszystkie
      </label>

      <span className="text-[13px] text-ink-400 tabular-nums">
        Zaznaczono: <strong className="text-white">{count}</strong>
      </span>

      <div className="flex flex-wrap gap-2 ml-auto">
        <button
          type="submit"
          formAction={action}
          name="hidden"
          value="true"
          disabled={disabled}
          className="rounded-full bg-accent-500/90 hover:bg-accent-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-medium px-5 py-2.5 transition-colors"
          title="Ukryj zaznaczone oferty ze strony (import ich nie przywróci)"
        >
          Wygaś zaznaczone
        </button>
        <button
          type="submit"
          formAction={action}
          name="hidden"
          value="false"
          disabled={disabled}
          className="rounded-full border border-white/20 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-medium px-5 py-2.5 transition-colors"
          title="Przywróć zaznaczone oferty (znów widoczne, wraca normalny obieg)"
        >
          Przywróć zaznaczone
        </button>
      </div>
    </form>
  );
}
