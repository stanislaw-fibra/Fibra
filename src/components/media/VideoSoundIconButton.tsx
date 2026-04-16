"use client";

type Props = {
  /** true = wideo wyciszone (klik włącza dźwięk) */
  muted: boolean;
  onToggle: (e: React.MouseEvent) => void;
  /** np. absolute top-3 right-3 z-[50] */
  className?: string;
};

export function VideoSoundIconButton({ muted, onToggle, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        "border border-white/20 bg-black/50 text-white/95 shadow-sm backdrop-blur-sm",
        "transition-colors hover:bg-black/65 hover:border-white/30",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
        className,
      ].join(" ")}
      aria-pressed={!muted}
      aria-label={muted ? "Włącz dźwięk" : "Wycisz"}
    >
      {muted ? <SpeakerMutedIcon /> : <SpeakerOnIcon />}
    </button>
  );
}

function SpeakerOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a9 9 0 0 1 0 14.14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpeakerMutedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 5L6 9H2v6h4l5 4V5zM22 9l-8 8M14 9l8 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
