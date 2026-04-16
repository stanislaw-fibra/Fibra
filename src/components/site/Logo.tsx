import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  variant?: "ink" | "paper";
  className?: string;
}

/**
 * Logo Fibry — zbudowane jako znak tekstowy:
 * wordmark z wyróżnieniem litery "i" (cienkie prostokąty = nawiązanie do włókna).
 */
export function Logo({ variant = "ink", className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 leading-none ${className}`}
      aria-label="Fibra Nieruchomości — strona główna"
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
