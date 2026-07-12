"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/site/Logo";

const ease = [0.22, 1, 0.36, 1] as const;

// Standalone menu strony Zamysłowa - te linki były wcześniej pod zakładką „Zamysłów".
const LINKS: { href: string; label: string }[] = [
  { href: "/zamyslow#mieszkania", label: "Mieszkania" },
  { href: "/przewodnik-inwestora", label: "Przewodnik inwestora" },
  { href: "/zarzadzanie-najmem", label: "Zarządzanie najmem" },
  { href: "/galeria-inwestycji", label: "Galeria" },
  { href: "/prospekt-informacyjny", label: "Prospekt" },
];

export function ZamyslowNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className={[
          "fixed inset-x-0 top-0 z-[120] transition-all duration-500",
          scrolled
            ? "bg-[rgba(250,250,248,0.72)] shadow-[0_1px_0_rgba(11,15,20,0.06)] backdrop-blur-2xl"
            : "bg-[rgba(250,250,248,0.55)] backdrop-blur-xl",
        ].join(" ")}
      >
        <div className="container-xl flex h-[72px] items-center justify-between">
          {/* Logo -> góra strony Zamysłowa (NIE fibra.pl) */}
          <Logo variant="ink" href="/zamyslow" onNavigate={() => setOpen(false)} />

          <nav className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[15px] font-medium text-ink-700 transition-colors hover:text-ink-950"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/zamyslow#kontakt"
              className="hidden items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent-400 hover:text-ink-950 sm:inline-flex"
            >
              Umów rozmowę
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Zamknij menu" : "Otwórz menu"}
              aria-expanded={open}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-ink-900/5 lg:hidden"
            >
              {open ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                  <path d="M3 7h16M3 15h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[119] bg-ink-950/95 backdrop-blur-md lg:hidden"
          >
            <div className="container-xl flex h-full flex-col pt-[96px]">
              <nav className="flex flex-col gap-1">
                {LINKS.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease, delay: 0.05 + i * 0.05 }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block border-b border-white/10 py-4 font-display text-2xl text-white"
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <Link
                href="/zamyslow#kontakt"
                onClick={() => setOpen(false)}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-accent-400 px-6 py-4 text-[15px] font-medium text-ink-950"
              >
                Umów rozmowę
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
