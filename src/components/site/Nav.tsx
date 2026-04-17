"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/oferty", label: "Oferty" },
  { href: "/sprzedaj-z-fibra", label: "Sprzedaj z Fibrą" },
  { href: "/jak-dzialamy", label: "Jak działamy" },
  { href: "/o-nas", label: "O Fibrze" },
  { href: "/kontakt", label: "Kontakt" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
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
  }, [open]);

  const solid = !isHome || scrolled;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className={[
          "fixed top-0 inset-x-0 z-40 transition-all duration-500",
          solid
            ? "bg-[rgba(250,250,248,0.72)] backdrop-blur-2xl shadow-[0_1px_0_rgba(11,15,20,0.06)]"
            : "bg-transparent",
        ].join(" ")}
      >
        <div className="container-xl flex items-center justify-between h-[72px]">
          <Logo variant={solid ? "ink" : "paper"} onNavigate={() => setOpen(false)} />

          <nav className="hidden lg:flex items-center gap-10">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  "text-[13px] font-medium transition-colors duration-300",
                  solid
                    ? "text-ink-600 hover:text-brand-500"
                    : "text-white/80 hover:text-white",
                ].join(" ")}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/kontakt"
              className={[
                "hidden md:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-all duration-300",
                solid
                  ? "bg-ink-900 text-white hover:bg-brand-500"
                  : "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-ink-900",
              ].join(" ")}
            >
              Umów rozmowę
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <button
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className={[
                "lg:hidden inline-flex flex-col gap-[5px] w-10 h-10 items-center justify-center rounded-full transition-colors",
                solid ? "hover:bg-ink-100" : "hover:bg-white/10",
              ].join(" ")}
            >
              <span
                className={[
                  "block w-5 h-[1.5px] transition-all duration-300",
                  open ? "translate-y-[3px] rotate-45" : "",
                  solid ? "bg-ink-900" : "bg-white",
                ].join(" ")}
              />
              <span
                className={[
                  "block w-5 h-[1.5px] transition-all duration-300",
                  open ? "-translate-y-[3.5px] -rotate-45" : "",
                  solid ? "bg-ink-900" : "bg-white",
                ].join(" ")}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="fixed inset-0 z-30 bg-ink-950 lg:hidden"
          >
            <div className="container-xl pt-28 pb-16 h-full flex flex-col">
              <nav className="flex flex-col gap-3">
                {LINKS.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease, delay: 0.1 + i * 0.06 }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="font-display text-[12vw] leading-[1.1] text-white hover:text-accent-400 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <motion.div
                className="mt-auto pt-10 hairline-dark-t flex flex-col gap-2 text-[14px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <a href="tel:+48510777200" className="text-white">510 777 200</a>
                <a href="mailto:biuro@grupafibra.pl" className="text-white/70">biuro@grupafibra.pl</a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
