import type { ReactNode } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export function LegalArticleShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex-1 bg-paper-warm pt-[72px] text-ink-900">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
        <article className="container-xl px-4 sm:px-6 py-10 md:py-16 lg:py-20">
          <div className="mx-auto max-w-[46rem]">
            <div className="rounded-[var(--radius-lg)] border border-ink-200/70 bg-white shadow-[var(--shadow-soft)] ring-1 ring-ink-200/30">
              <div className="legal-doc-inner px-6 py-9 sm:px-9 sm:py-11 md:px-12 md:py-14">{children}</div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
