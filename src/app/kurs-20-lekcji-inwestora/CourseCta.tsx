"use client";

import { CHECKOUT_URL, ORDER_ANCHOR } from "./config";
import {
  trackCourseCheckout,
  trackCourseInterest,
  checkoutUrlWithClickId,
  type CtaSection,
} from "@/lib/course-tracking";

type Props = {
  /**
   *  - "checkout" → przekierowanie do koszyka Imkera + zdarzenie AddToCart
   *    (piksel + Conversion API, deduplikowane). To realna „dodanie do koszyka".
   *  - "anchor"   → przewinięcie do sekcji zamówienia (#zamow) + miękki sygnał
   *    zainteresowania do naszych logów (NIE Meta).
   */
  mode: "checkout" | "anchor";
  /** Z którego miejsca strony pochodzi klik - do analityki. */
  section: CtaSection;
  className?: string;
  children: React.ReactNode;
};

export function CourseCta({ mode, section, className, children }: Props) {
  if (mode === "checkout") {
    return (
      <a
        href={CHECKOUT_URL}
        className={className}
        onClick={(e) => {
          // SSR renderuje czysty CHECKOUT_URL (bez ryzyka hydration mismatch);
          // dopiero przy kliknięciu doklejamy fbclid do linku na salescrm.pl,
          // żeby zakup dało się podpiąć pod reklamę. Nawigacja czyta href po tym
          // synchronicznym handlerze, więc podmiana zdąży zadziałać.
          e.currentTarget.href = checkoutUrlWithClickId(CHECKOUT_URL);
          trackCourseCheckout(section);
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={ORDER_ANCHOR}
      className={className}
      onClick={() => trackCourseInterest(section)}
    >
      {children}
    </a>
  );
}
