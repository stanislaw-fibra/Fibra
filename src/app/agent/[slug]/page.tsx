import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { AgentHero } from "@/components/team/AgentHero";
import { OfertyPageClient } from "@/app/oferty/OfertyPageClient";
import { getPublicAgentBySlug } from "@/lib/team-query";
import { getAllActiveOffers } from "@/lib/offers-query";
import { firstNameAccusative } from "@/lib/polish-names";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getPublicAgentBySlug(slug);
  if (!agent) return { title: "Agent - Fibra Nieruchomości" };
  return {
    title: `${agent.name} - oferty | Fibra Nieruchomości`,
    description: `Auto-prezentacja i aktualne oferty: ${agent.name}, ${agent.role}. Fibra Nieruchomości w Radlinie.`,
  };
}

export default async function AgentPage({ params }: Props) {
  const { slug } = await params;
  const agent = await getPublicAgentBySlug(slug);
  if (!agent) notFound();

  const allOffers = await getAllActiveOffers();
  const agentOffers = allOffers.filter(
    (o) => (o.agentSlug ?? "").toLowerCase() === slug.toLowerCase(),
  );

  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        <AgentHero agent={agent} variant="full" />

        <section className="bg-paper-warm border-b border-ink-200/60 py-10 md:py-14">
          <div className="container-xl">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="eyebrow inline-flex items-center gap-3 mb-3">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Aktualne oferty
                </p>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.6rem)" }}
                >
                  Oferty prowadzone przez {firstNameAccusative(agent.name) ?? agent.name}
                </h2>
              </div>
              <p className="hidden sm:block text-[11.5px] md:text-[12px] uppercase tracking-[0.14em] text-ink-500">
                {agentOffers.length}{" "}
                {agentOffers.length === 1
                  ? "oferta"
                  : agentOffers.length < 5 && agentOffers.length > 0
                    ? "oferty"
                    : "ofert"}
              </p>
            </div>
          </div>
        </section>

        {agentOffers.length > 0 ? (
          <Suspense fallback={null}>
            {/* Reużywamy katalogu - filtry + sortowanie + view toggle działają w obrębie ofert agenta. */}
            <OfertyPageClient allOffers={agentOffers} />
          </Suspense>
        ) : (
          <section className="py-20 md:py-28 bg-paper">
            <div className="container-xl">
              <div className="mx-auto max-w-xl text-center">
                <p className="font-display text-ink-950 text-[22px] md:text-[26px] leading-tight">
                  W tej chwili nie ma aktywnych ofert.
                </p>
                <p className="mt-3 text-ink-700 text-[15px] md:text-[16px]">
                  Zadzwoń lub napisz - chętnie pomogę znaleźć nieruchomość albo
                  doradzić w sprzedaży.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
