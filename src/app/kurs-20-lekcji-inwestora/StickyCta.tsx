"use client";

import { useEffect, useState } from "react";

type Props = {
  checkoutUrl: string;
  price: string;
};

export function StickyCta({ checkoutUrl, price }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 720);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="border-t border-white/10 bg-ink-950/95 backdrop-blur-md">
        <div className="container-xl flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="font-display text-white text-[1.05rem] sm:text-[1.25rem] leading-tight tracking-tight truncate">
              20 Lekcji Inwestora{" "}
              <span className="text-ink-300 text-[0.85rem] sm:text-[0.95rem]">
                + pakiet książki gratis
              </span>
            </p>
            <p className="text-ink-300 text-[12px] hidden sm:block">
              Dostęp od razu po zakupie · BLIK, Przelewy24, karta
            </p>
          </div>
          <a
            href={checkoutUrl}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-5 sm:px-8 py-3 text-[14px] sm:text-[15px] font-medium transition-colors active:scale-[0.98]"
          >
            <span className="whitespace-nowrap">Kupuję dostęp · {price}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3 7h8M7 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
