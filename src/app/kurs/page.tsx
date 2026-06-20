import type { Metadata } from "next";
import Image from "next/image";
import { CoursePortal } from "./CoursePortal";
import { CourseBonuses } from "./CourseBonuses";
import { NewsletterCourseBox } from "./NewsletterCourseBox";
import { LESSONS } from "./lessons";
import { getCourseMaterials } from "@/lib/course-materials";
import bookMockup from "../../../public/kurs/bartosz-nosiadek-zarabianie-uczciwych-pieniedzy.png";

export const metadata: Metadata = {
  title: "20 Lekcji Inwestora - Twój kurs",
  robots: { index: false, follow: false },
};

// Materiały serwujemy przez signed URL-e (TTL 12 h) generowane przy każdym
// wejściu - strona musi być dynamiczna, żeby linki były świeże.
export const dynamic = "force-dynamic";

/** Portal kursu (dostęp po zakupie). Układ panelu: stały sidebar + główna
    kolumna ze sceną wideo i programem (CoursePortal). Ciemny, spokojny,
    app-owy motyw - ma dawać poczucie dopracowanego produktu. Bramka dostępu
    (magic-link) dojdzie, gdy będzie skonfigurowany Resend; wideo przejdzie na
    podpisane URL-e Cloudflare przed publikacją. */
export default async function KursPage() {
  const materials = await getCourseMaterials();

  return (
    <div className="grain-on-dark relative min-h-screen bg-ink-950 text-white">
      <div className="grad-radial-hero pointer-events-none absolute inset-0" />

      <div className="relative z-10">
        <CoursePortal lessons={LESSONS}>
          {/* ====== BONUSY / MATERIAŁY: VOD + e-book + sketchnotes + audiobook ====== */}
          <CourseBonuses materials={materials} />

          {/* ====== NEWSLETTER: streszczenie rysunkowe za zapis ====== */}
          <section className="mt-14 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
            <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:p-10">
              {/* Okładka książki */}
              <div className="order-2 flex justify-center lg:order-1">
                <Image
                  src={bookMockup}
                  alt="Książka „Zarabianie Uczciwych Pieniędzy” - Bartosz Nosiadek"
                  className="h-auto w-full max-w-[15rem] drop-shadow-2xl lg:max-w-[17rem]"
                  sizes="(min-width: 1024px) 17rem, 15rem"
                  placeholder="blur"
                />
              </div>

              {/* Oferta + formularz */}
              <div className="order-1 lg:order-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">
                  Dodatek dla zapisanych
                </p>
                <h2 className="mt-3 font-display text-[1.8rem] leading-[1.05] sm:text-[2.2rem]">
                  Chcesz streszczenie rysunkowe książki?
                </h2>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-300">
                  Zapisz się do newslettera, a wyślę Ci streszczenie rysunkowe
                  książki „Zarabianie Uczciwych Pieniędzy" prosto na maila.
                </p>

                <div className="mt-7 max-w-xl">
                  <NewsletterCourseBox />
                </div>
              </div>
            </div>
          </section>
        </CoursePortal>

        {/* ====== STOPKA ====== */}
        <footer className="hairline-dark-t">
          <div className="container-xl flex flex-col gap-2 py-8 text-[12.5px] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-[1.3rem] leading-none text-white">Fibra</p>
            <p>
              Masz problem z dostępem? Napisz na{" "}
              <a className="text-ink-200 underline-offset-2 hover:underline" href="mailto:stanislaw.drozniak@fibra.pl">
                stanislaw.drozniak@fibra.pl
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
