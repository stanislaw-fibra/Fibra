import type { ReactNode } from "react";

export function LegalPageHeader({
  eyebrow,
  title,
  domain = "fibranieruchomosci.pl",
  updated,
  showUpdated = true,
}: {
  eyebrow: string;
  title: string;
  domain?: string;
  updated?: string;
  showUpdated?: boolean;
}) {
  return (
    <header className="mb-10 border-b border-ink-100 pb-10 md:mb-12 md:pb-12">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">{eyebrow}</p>
      <h1 className="font-display text-[clamp(1.85rem,4.2vw,2.65rem)] leading-[1.06] tracking-tight text-ink-950">
        {title}
      </h1>
      <p className="mt-2.5 text-[15px] text-ink-500">{domain}</p>
      {showUpdated && updated ? (
        <p className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-ink-200/70 bg-ink-50/80 px-4 py-2.5 text-[13px] text-ink-600">
          <span className="text-ink-400">Ostatnia aktualizacja</span>
          <span className="font-medium text-ink-800">{updated}</span>
        </p>
      ) : null}
    </header>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-t border-ink-100/90 pt-10 first:border-t-0 first:pt-0"
      aria-labelledby={`${id}-h`}
    >
      <h2
        id={`${id}-h`}
        className="border-l-[3px] border-brand-500 pl-4 text-lg font-semibold leading-snug tracking-tight text-ink-950 md:text-xl"
      >
        {title}
      </h2>
      <div className="mt-5 space-y-6 text-[15px] leading-relaxed text-ink-700">{children}</div>
    </section>
  );
}

export function LegalCallout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-200/70 bg-gradient-to-br from-ink-50/95 to-white px-5 py-5 text-[15px] leading-relaxed text-ink-800 shadow-sm sm:px-6 sm:py-6">
      {children}
    </div>
  );
}

export function LegalSubBlock({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-100/90 bg-paper/60 px-4 py-4 sm:px-5 sm:py-5">
      <p className="mb-3 text-[13px] font-semibold text-ink-900">{label}</p>
      <div className="space-y-2.5 text-[14px] leading-relaxed text-ink-700">{children}</div>
    </div>
  );
}

export function LegalBulletList({ children }: { children: ReactNode }) {
  return <ul className="list-none space-y-3.5 pl-0">{children}</ul>;
}

export function LegalBulletItem({ children }: { children: ReactNode }) {
  return (
    <li className="relative pl-5 text-[15px] leading-relaxed before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-brand-500">
      {children}
    </li>
  );
}

export function LegalTableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-ink-200/70 bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
