const TOUR_URL = "https://mpembed.com/show/?m=JYoAppBD1MK&mpu=439";

export function OfficeVirtualTour() {
  return (
    <section
      id="office-tour"
      className="relative bg-paper-warm py-20 md:py-28 overflow-hidden"
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

      <div className="container-xl mt-20 md:mt-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-end">
          <div className="lg:col-span-5">
            <p className="eyebrow flex items-center gap-3 mb-6">
              <span className="inline-block w-8 h-px bg-brand-500" aria-hidden />
              Wirtualny spacer
            </p>
            <h2
              className="font-display text-ink-950"
              style={{
                fontSize: "clamp(2.2rem, 4.8vw, 3.8rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
              }}
            >
              Zajrzyj do naszego{" "}
              <em className="italic text-brand-500">biura w Radlinie</em>.
            </h2>
            <p className="mt-6 max-w-[42ch] text-[16px] md:text-[17px] leading-[1.6] text-ink-700">
              Skoro pokazujemy oferty w wideo i spacerze 3D, wypada zacząć od siebie. Obejdź nasze biuro w 360°, zanim
              wpadniesz na kawę.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href={TOUR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-ink-900 hover:bg-brand-500 text-white px-6 py-3.5 text-[14px] md:text-[15px] font-medium transition-colors active:scale-[0.98]"
              >
                Otwórz w pełnym oknie
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <path
                    d="M4 10L10 4M10 4H5M10 4V9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative rounded-[var(--radius-lg)] overflow-hidden border border-ink-200/70 shadow-[var(--shadow-soft)] ring-1 ring-ink-200/30 bg-ink-100">
              {/* 16:9 aspect ratio container */}
              <div className="relative aspect-video">
                <iframe
                  src={TOUR_URL}
                  title="Wirtualny spacer po biurze Fibra Nieruchomości w Radlinie"
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  allow="xr-spatial-tracking; fullscreen; gyroscope; accelerometer; vr"
                  allowFullScreen
                />
              </div>
            </div>
            <p className="mt-3 text-[12px] text-ink-500 text-right">
              ul. Rymera 177, 44-310 Radlin
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
