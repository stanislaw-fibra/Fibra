import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type GalleryCollection = {
  slug: string;
  title: string;
  description: string;
  location: string;
  status: string;
  photos: GalleryPhoto[];
  /** Liczba placeholderów do wyświetlenia gdy `photos` jest puste - żeby siatka miała sensowne proporcje. */
  placeholderCount?: number;
};

type Props = {
  collection: GalleryCollection;
  tone?: "paper" | "white";
};

export function GallerySection({ collection, tone = "paper" }: Props) {
  const hasPhotos = collection.photos.length > 0;
  const placeholders = Array.from(
    { length: Math.max(collection.placeholderCount ?? 6, 0) },
    (_, i) => i
  );

  const bg = tone === "paper" ? "bg-paper-warm" : "bg-white";

  return (
    <section
      id={collection.slug}
      className={`relative scroll-mt-[88px] py-20 md:py-28 ${bg} border-b border-ink-200/60`}
    >
      <div className="container-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                {collection.location} · {collection.status}
              </p>
              <h2
                className="mt-3 font-display text-ink-950 tracking-tight leading-[1.05] text-balance"
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)" }}
              >
                {collection.title}
              </h2>
              <p className="mt-4 text-[15.5px] md:text-[16px] text-ink-700 leading-[1.65] text-pretty">
                {collection.description}
              </p>
            </div>
          </Reveal>

          {!hasPhotos ? (
            <Reveal delay={100}>
              <span className="inline-flex items-center gap-2 self-start md:self-auto rounded-full border border-ink-200 bg-white/80 px-4 py-2 text-[12.5px] font-medium text-ink-700">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse" />
                Zdjęcia uzupełniamy
              </span>
            </Reveal>
          ) : null}
        </div>

        <div className="mt-10 md:mt-14">
          {hasPhotos ? (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {collection.photos.map((p, i) => (
                <Reveal key={p.id} delay={i * 40} as="li">
                  <figure className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-100 shadow-[var(--shadow-soft)]">
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </figure>
                </Reveal>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {placeholders.map((i) => (
                <Reveal key={i} delay={i * 40} as="li">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-dashed border-ink-300/70 bg-gradient-to-br from-ink-50 to-paper-cream">
                    <div className="absolute inset-0 flex items-center justify-center text-ink-400">
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
                        <rect
                          x="4"
                          y="6"
                          width="28"
                          height="22"
                          rx="2.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        />
                        <circle cx="13" cy="14" r="2.4" stroke="currentColor" strokeWidth="1.4" />
                        <path
                          d="M5 24l8-7 6 5 4-3 8 7"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
