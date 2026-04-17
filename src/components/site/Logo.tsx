"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface LogoProps {
  variant?: "ink" | "paper";
  className?: string;
  /** np. zamknięcie menu mobilnego w Nav */
  onNavigate?: () => void;
}

/**
 * Logo Fibry - zbudowane jako znak tekstowy:
 * wordmark z wyróżnieniem litery "i" (cienkie prostokąty = nawiązanie do włókna).
 * Na stronie głównej klik przewija na samą górę zamiast bezczynnego odświeżenia trasy.
 */
export function Logo({ variant = "ink", className = "", onNavigate }: LogoProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 leading-none ${className}`}
      aria-label="Fibra Nieruchomości - strona główna"
      onClick={(e) => {
        onNavigate?.();
        if (isHome) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      <Image
        src="/Fibra - logo firmy.svg"
        alt="Fibra Nieruchomości"
        width={164}
        height={28}
        priority
        className={[
          "h-[26px] w-auto",
          variant === "paper" ? "brightness-0 invert" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </Link>
  );
}
