"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { rememberCameFromHome } from "@/lib/investments/zamyslow-experience";

/**
 * Link baneru Zamysłowa. Klik zapamiętuje w karcie, że gość przyszedł z głównej,
 * żeby nagłówek Zamysłowa pokazał mu drogę powrotną (patrz useCameFromHome).
 */
export function HomeZamyslowBannerLink({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <Link
      href="/zamyslow"
      data-cta="home-zamyslow-banner"
      onClick={rememberCameFromHome}
      className={className}
    >
      {children}
    </Link>
  );
}
