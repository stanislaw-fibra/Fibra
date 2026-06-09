"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface LogoProps {
  variant?: "ink" | "paper";
  className?: string;
  /** np. zamknięcie menu mobilnego w Nav */
  onNavigate?: () => void;
  /**
   * Cel linku. `null` = logo nie prowadzi do strony głównej (standalone strony
   * lejka: /kurs, landing kursu) - klik tylko przewija na górę i opcjonalnie
   * wywołuje `onActivate`. Domyślnie "/".
   */
  href?: string | null;
  /** Akcja klika dla wariantu bez nawigacji (np. reset widoku kursu). */
  onActivate?: () => void;
}

/**
 * Logo Fibry. Domyślnie linkuje do strony głównej; na stronie głównej klik
 * przewija na górę zamiast bezczynnego odświeżenia trasy.
 *
 * Na standalone stronach lejka (kurs, landing) przekazujemy `href={null}` - wtedy
 * logo NIE prowadzi do strony głównej (to myliło użytkowników), a jedynie
 * przewija na górę / resetuje widok przez `onActivate`.
 */
export function Logo({
  variant = "ink",
  className = "",
  onNavigate,
  href = "/",
  onActivate,
}: LogoProps) {
  const pathname = usePathname();
  const baseClass = `inline-flex items-center gap-3 leading-none ${className}`;

  const img = (
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
  );

  // Wariant bez nawigacji - strony kursu są standalone, logo nie ma wyrzucać
  // na stronę główną.
  if (href === null) {
    return (
      <button
        type="button"
        className={baseClass}
        aria-label="Fibra Nieruchomości"
        onClick={() => {
          onNavigate?.();
          onActivate?.();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        {img}
      </button>
    );
  }

  const isCurrent = pathname === href;

  return (
    <Link
      href={href}
      className={baseClass}
      aria-label="Fibra Nieruchomości - strona główna"
      onClick={(e) => {
        onNavigate?.();
        if (isCurrent) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      {img}
    </Link>
  );
}
