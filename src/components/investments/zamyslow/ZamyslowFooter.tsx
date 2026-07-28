"use client";

import { Footer } from "@/components/site/Footer";
import {
  useZamyslowExperience,
  ZAMYSLOW_EXPERIENCES,
  type ZamyslowExperience,
} from "@/lib/investments/zamyslow-experience";

/**
 * Stopka dla stron Zamysłowa - logo „Fibra" wraca do właściwego rodzica
 * (/zamyslow lub /osiedle-zamyslow) w zależności od experience. Strony-rodzice
 * podają `experience`, wspólne podstrony nie podają nic (czytają z sesji).
 */
export function ZamyslowFooter({
  experience,
}: {
  experience?: ZamyslowExperience;
}) {
  const exp = useZamyslowExperience(experience);
  return <Footer logoHref={ZAMYSLOW_EXPERIENCES[exp].home} />;
}
