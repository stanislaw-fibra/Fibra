import { AgentAvatar } from "@/components/offers/AgentAvatar";

/**
 * „Z kim będziesz rozmawiać" - zdjęcie + imię + rola opiekuna inwestycji.
 * Siada przy formularzach i numerach telefonu na stronach Zamysłowa, żeby
 * kontakt miał twarz, a nie tylko numer.
 *
 * `tone="dark"` na granatowych sekcjach kontaktowych, `light` na jasnych.
 */
export type ZamyslowAgentInfo = {
  name: string;
  role: string;
  photoUrl?: string;
};

export function ZamyslowAgentChip({
  agent,
  tone = "dark",
  label = "Twój opiekun inwestycji",
  className = "",
}: {
  agent: ZamyslowAgentInfo;
  tone?: "dark" | "light";
  label?: string;
  className?: string;
}) {
  const nameCls = tone === "dark" ? "text-white" : "text-ink-950";
  const roleCls = tone === "dark" ? "text-white/50" : "text-ink-500";
  const labelCls = tone === "dark" ? "text-white/40" : "text-ink-400";

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <AgentAvatar photoUrl={agent.photoUrl} name={agent.name} size="sm" className="!h-[56px] !w-[56px]" />
      <div className="min-w-0">
        <p className={`text-[11px] font-medium uppercase tracking-[0.14em] ${labelCls}`}>
          {label}
        </p>
        <p className={`mt-1 text-[16px] font-medium leading-tight ${nameCls}`}>
          {agent.name}
        </p>
        <p className={`mt-0.5 text-[12.5px] leading-snug ${roleCls}`}>{agent.role}</p>
      </div>
    </div>
  );
}
