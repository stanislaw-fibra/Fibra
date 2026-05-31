import Link from "next/link";
import { TeamMemberMedia } from "@/components/team/TeamMemberMedia";
import { firstName, firstNameGenitive, firstNameAccusative } from "@/lib/polish-names";
import type { TeamMember } from "@/lib/team-query";

type Props = {
  agent: TeamMember;
  /**
   * `full` - strona /agent/[slug], pełen hero z biografią
   * `compact` - pasek u góry /oferty?agent=<slug>, krótka wersja
   */
  variant?: "full" | "compact";
};

/**
 * Hero z auto-prezentacją agenta - używane na dwóch stronach:
 *   1. `/agent/[slug]` - pełna sylwetka (variant=full)
 *   2. `/oferty?agent=<slug>` - pasek u góry listy (variant=compact)
 */
export function AgentHero({ agent, variant = "full" }: Props) {
  const isFounder = agent.kind === "founder";
  const phoneClean = (agent.phone ?? "").replace(/\s+/g, "");
  const nameNom = firstName(agent.name) ?? agent.name;
  const nameGen = firstNameGenitive(agent.name) ?? nameNom;
  const nameAcc = firstNameAccusative(agent.name) ?? nameNom;

  if (variant === "compact") {
    return (
      <section className="relative bg-paper-warm border-b border-ink-200/60 py-10 md:py-14">
        <div className="container-xl">
          <div className="grid gap-6 md:gap-10 md:grid-cols-12 items-center">
            <div className="md:col-span-3">
              <div className="mx-auto md:mx-0 max-w-[180px] md:max-w-[200px]">
                <TeamMemberMedia
                  videoId={agent.cloudflareVideoId}
                  photoUrl={agent.photoUrl}
                  name={agent.name}
                  variant="member"
                />
              </div>
            </div>
            <div className="md:col-span-9">
              <p className="eyebrow inline-flex items-center gap-3 mb-3">
                <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                Oferty od {nameGen}
              </p>
              <h2
                className="font-display text-ink-950 tracking-tight leading-[1.05]"
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
              >
                {agent.name}
              </h2>
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                {agent.role}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {phoneClean ? (
                  <a
                    href={`tel:${phoneClean}`}
                    className="inline-flex items-center gap-2 rounded-full bg-ink-900 hover:bg-brand-500 text-white px-5 py-2.5 text-[13px] md:text-[14px] font-medium transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M3 1.5h2.5l1 3-1.5 1c.5 1.5 1.5 2.5 3 3l1-1.5 3 1V11c0 .8-.7 1.5-1.5 1.5C5.5 12.5 1.5 8.5 1.5 3 1.5 2.2 2.2 1.5 3 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {agent.phone}
                  </a>
                ) : null}
                {agent.slug ? (
                  <Link
                    href={`/agent/${agent.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-ink-200 hover:border-ink-300 bg-white text-ink-900 px-5 py-2.5 text-[13px] md:text-[14px] font-medium transition-colors"
                  >
                    Poznaj {nameAcc}
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // FULL variant - strona /agent/[slug]
  return (
    <section className="relative bg-paper py-16 md:py-24 border-b border-ink-200/60">
      <div className="absolute inset-0 -z-10 grad-radial-brand opacity-30" />
      <div className="container-xl">
        <div className="grid gap-10 md:gap-14 lg:gap-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <div className="mx-auto max-w-[280px] md:max-w-[320px] lg:max-w-[360px] lg:mx-0">
              <TeamMemberMedia
                videoId={agent.cloudflareVideoId}
                photoUrl={agent.photoUrl}
                name={agent.name}
                variant={isFounder ? "founder" : "member"}
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="eyebrow inline-flex items-center gap-3 mb-5">
              <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
              {isFounder ? "Założyciel Fibry" : "Zespół Fibry"}
            </p>
            <h1
              className="font-display text-ink-950 tracking-tight leading-[1.02]"
              style={{ fontSize: "clamp(2.1rem, 4.5vw, 3.6rem)" }}
            >
              {agent.name}
            </h1>
            <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              {agent.role}
            </p>
            {agent.bio ? (
              <div className="mt-6 md:mt-8 max-w-2xl text-[16px] md:text-[17px] text-ink-800 leading-[1.7] text-pretty">
                {agent.bio.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="mb-4 last:mb-0 whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {phoneClean ? (
                <a
                  href={`tel:${phoneClean}`}
                  className="inline-flex items-center gap-2 rounded-full bg-ink-900 hover:bg-brand-500 text-white px-6 py-3.5 text-[14px] md:text-[15px] font-medium transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M3 1.5h2.5l1 3-1.5 1c.5 1.5 1.5 2.5 3 3l1-1.5 3 1V11c0 .8-.7 1.5-1.5 1.5C5.5 12.5 1.5 8.5 1.5 3 1.5 2.2 2.2 1.5 3 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Zadzwoń - {agent.phone}
                </a>
              ) : null}
              {agent.email ? (
                <a
                  href={`mailto:${agent.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-200 hover:border-ink-300 bg-white text-ink-900 px-6 py-3.5 text-[14px] md:text-[15px] font-medium transition-colors"
                >
                  Napisz e-mail
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
