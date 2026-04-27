"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ViewMode } from "@/app/oferty/filters-state";

export function OfertyHeaderViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const view: ViewMode = useMemo(() => {
    const v = searchParams.get("view");
    return v === "gallery" ? "gallery" : "video";
  }, [searchParams]);

  const setView = (next: ViewMode) => {
    const out = new URLSearchParams(searchParams.toString());
    if (next === "video") out.delete("view");
    else out.set("view", "gallery");
    const qs = out.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div
      className={[
        "inline-flex rounded-full border border-ink-200 bg-ink-50 p-1 text-[12px] font-medium shadow-inner",
        isPending ? "opacity-80" : "opacity-100",
        "transition-opacity",
      ].join(" ")}
      role="group"
      aria-label="Widok katalogu"
    >
      <button
        type="button"
        onClick={() => setView("video")}
        aria-pressed={view === "video"}
        className={[
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
          "cursor-pointer select-none transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.96]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
          view === "video"
            ? "bg-ink-950 text-white shadow-[0_2px_10px_-4px_rgba(11,15,20,0.45)]"
            : "text-ink-600 hover:text-ink-950 hover:bg-paper",
        ].join(" ")}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
          <path d="M3.5 2.2L8.5 5.5 3.5 8.8V2.2z" />
        </svg>
        Wideo
      </button>
      <button
        type="button"
        onClick={() => setView("gallery")}
        aria-pressed={view === "gallery"}
        className={[
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
          "cursor-pointer select-none transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.96]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
          view === "gallery"
            ? "bg-ink-950 text-white shadow-[0_2px_10px_-4px_rgba(11,15,20,0.45)]"
            : "text-ink-600 hover:text-ink-950 hover:bg-paper",
        ].join(" ")}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
          <rect x="1.5" y="1.5" width="3.5" height="3.5" />
          <rect x="6" y="1.5" width="3.5" height="3.5" />
          <rect x="1.5" y="6" width="3.5" height="3.5" />
          <rect x="6" y="6" width="3.5" height="3.5" />
        </svg>
        Klasyczny
      </button>
    </div>
  );
}

