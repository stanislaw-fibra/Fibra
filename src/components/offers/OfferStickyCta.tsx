import { priceFormat } from "@/lib/offers";
import { firstName as getFirstName, firstNameGenitive } from "@/lib/polish-names";
import { AgentAvatar } from "@/components/offers/AgentAvatar";

export function OfferStickyCta({
  priceFrom,
  title,
  agentName,
  agentPhone,
  agentPhotoUrl,
}: {
  priceFrom?: number;
  title: string;
  refNumber?: string;
  agentName?: string;
  agentPhone?: string;
  agentPhotoUrl?: string;
}) {
  const askHref = "#kontakt";

  const phoneDisplay = agentPhone || "510 777 200";
  const telHref = `tel:+48${phoneDisplay.replace(/\D/g, "")}`;
  const firstName = getFirstName(agentName);
  const firstNameGen = firstNameGenitive(agentName);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-200/90 bg-[var(--color-paper)]/92 backdrop-blur-xl shadow-[0_-8px_32px_-12px_rgba(11,15,20,0.12)]">
      <div className="container-xl flex flex-wrap items-center justify-between gap-3 py-3 md:py-3.5">
        <div className="min-w-0 flex items-baseline gap-3 md:gap-4">
          <p className="font-display text-[20px] md:text-[24px] text-ink-950 tabular-nums shrink-0">
            {priceFormat(priceFrom)}
          </p>
          <p className="hidden md:block text-[12.5px] text-ink-500 truncate">
            {title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <a
            href={askHref}
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-500"
            aria-label={`Zapytaj o ofertę: ${title}`}
          >
            Zapytaj o ofertę
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a
            href={telHref}
            className="group inline-flex items-center gap-2.5 md:gap-3 rounded-full border border-ink-200 bg-paper py-1.5 pl-1.5 pr-4 md:pr-5 text-[13px] font-medium text-ink-900 transition-colors hover:border-brand-500 hover:text-brand-600"
            aria-label={firstNameGen ? `Zadzwoń do ${firstNameGen}, ${phoneDisplay}` : `Zadzwoń ${phoneDisplay}`}
          >
            <AgentAvatar
              photoUrl={agentPhotoUrl}
              name={agentName}
              size="sm"
              className="ring-ink-200/80 shadow-[0_2px_6px_-2px_rgba(11,15,20,0.18)]"
            />
            <span className="flex flex-col leading-tight text-left">
              {firstName && (
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 group-hover:text-brand-500/80">
                  {firstName}
                </span>
              )}
              <span className="tabular-nums">{phoneDisplay}</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
