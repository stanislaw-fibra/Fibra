import Image from "next/image";

type Size = "sm" | "md" | "lg";

/** Inicjały z pełnego imienia (max 2 znaki). Fallback gdy brak zdjęcia. */
function initialsFromName(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}

/**
 * Awatar agenta - zdjęcie z Supabase bucketu `agent-photos` lub placeholder
 * z inicjałami na gradiencie brand. `object-top` — portrety: twarz w górnej części kadru.
 * Rozmiary: sticky `sm` (~44px), sekcja kontakt na ofercie `md` (do ~100px desktop), `lg` większe karty.
 */
export function AgentAvatar({
  photoUrl,
  name,
  size = "md",
  className = "",
  priority = false,
}: {
  photoUrl?: string;
  name?: string;
  size?: Size;
  className?: string;
  priority?: boolean;
}) {
  const dims: Record<Size, { box: string; text: string; px: number }> = {
    sm: { box: "h-[44px] w-[44px]", text: "text-[12px]", px: 48 },
    md: {
      box: "h-20 w-20 md:h-24 md:w-24 xl:h-[100px] xl:w-[100px]",
      text: "text-[17px] xl:text-[19px]",
      px: 100,
    },
    lg: { box: "h-28 w-28 md:h-32 md:w-32", text: "text-[23px]", px: 128 },
  };
  const d = dims[size];
  const initials = initialsFromName(name);

  const base = `relative block shrink-0 overflow-hidden rounded-full ring-1 ring-ink-200/60 bg-gradient-to-br from-brand-500/15 via-brand-500/10 to-accent-400/15 ${d.box} ${className}`;

  if (photoUrl) {
    return (
      <span className={base}>
        <Image
          src={photoUrl}
          alt={name ? `Zdjęcie agenta ${name}` : "Zdjęcie agenta"}
          fill
          sizes={`${d.px}px`}
          className="object-cover object-top"
          priority={priority}
          quality={78}
        />
      </span>
    );
  }

  return (
    <span
      className={`${base} flex items-center justify-center`}
      aria-label={name ? `Inicjały agenta ${name}` : "Brak zdjęcia agenta"}
    >
      <span className={`font-display font-medium text-brand-700 tracking-wide ${d.text}`}>
        {initials}
      </span>
    </span>
  );
}
