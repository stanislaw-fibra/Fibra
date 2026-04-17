"use client";

import { useEffect, useRef, useState } from "react";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function useInViewOnce(ref: React.RefObject<HTMLElement | null>, threshold = 0.2) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

function useCountUp(active: boolean, end: number, durationMs: number, reduced: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reduced || end === 0) {
      setV(end);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) * (1 - t);
      setV(Math.round(eased * end));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, end, durationMs, reduced]);
  return v;
}

export function SprzedajZFibraStats() {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = useInViewOnce(rootRef, 0.15);
  const reduced = usePrefersReducedMotion();
  const n93 = useCountUp(active, 93, 1400, reduced);
  const n21 = useCountUp(active, 21, 1200, reduced);
  const n100 = useCountUp(active, 100, 1500, reduced);

  return (
    <section className="relative py-24 md:py-32 bg-paper-warm border-y border-ink-200/50" aria-labelledby="sprzedaj-stats-heading">
      <div className="container-xl">
        {/* TODO: zweryfikować liczby z klientem */}
        <h2 id="sprzedaj-stats-heading" className="eyebrow mb-14 md:mb-16 max-w-2xl">
          FIBRA W LICZBACH
        </h2>
        <div ref={rootRef} className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14 md:gap-x-10 md:gap-y-16">
          <div>
            <p className="font-display text-ink-950 leading-none tracking-tight" style={{ fontSize: "clamp(2.75rem, 6vw, 4.25rem)" }}>
              {n93}%
            </p>
            <p className="mt-4 text-[15px] md:text-base text-ink-600 leading-snug max-w-[14ch]">
              ofert sprzedanych
              <br />
              w cenie wyjściowej
              <br />
              lub wyższej
            </p>
          </div>
          <div>
            <p className="font-display text-ink-950 leading-none tracking-tight flex flex-wrap items-baseline gap-x-1.5" style={{ fontSize: "clamp(2.75rem, 6vw, 4.25rem)" }}>
              <span>{n21}</span>
              <span className="text-[0.42em] font-sans font-medium tracking-normal text-ink-700">dni</span>
            </p>
            <p className="mt-4 text-[15px] md:text-base text-ink-600 leading-snug max-w-[16ch]">
              średni czas do
              <br />
              pierwszej poważnej
              <br />
              oferty kupna
            </p>
          </div>
          <div>
            <p className="font-display text-ink-950 leading-none tracking-tight" style={{ fontSize: "clamp(2.75rem, 6vw, 4.25rem)" }}>
              {n100}%
            </p>
            <p className="mt-4 text-[15px] md:text-base text-ink-600 leading-snug max-w-[14ch]">
              nieruchomości
              <br />
              z filmem i spacerem 3D
            </p>
          </div>
          <div>
            <p className="font-display text-ink-950 leading-none tracking-tight" style={{ fontSize: "clamp(2.75rem, 6vw, 4.25rem)" }}>
              0 zł
            </p>
            <p className="mt-4 text-[15px] md:text-base text-ink-600 leading-snug max-w-[14ch]">
              za wycenę
              <br />
              i strategię sprzedaży
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
