"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { attachStreamVideoSlotAction, upsertOfferMediaAction } from "@/app/panel/actions/offers";

const MAX_FILE_BYTES = 500 * 1024 * 1024;
const BASIC_UPLOAD_MAX_BYTES = 200 * 1024 * 1024;

function idFromBasicUploadResponse(res: Response, fallback: string | null): string | null {
  const h = res.headers.get("stream-media-id") || res.headers.get("Stream-Media-Id");
  if (h?.trim()) return h.trim();
  return fallback?.trim() || null;
}

function idFromTusUrl(tusUrl: string | null): string | null {
  if (!tusUrl) return null;
  try {
    const u = new URL(tusUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && /^[a-fA-F0-9]{32}$/.test(last)) return last;
  } catch {
    /* ignore */
  }
  return null;
}

function simulatedPct(elapsedMs: number, saving: boolean): number {
  if (saving) return 88 + Math.min(10, (elapsedMs / 800) * 10);
  // Delikatny „pozorny" postęp na starcie (inicjacja może trwać 10–15 s).
  const cap = 38;
  const t = Math.min(1, elapsedMs / 14_000);
  return cap * (1 - Math.pow(1 - t, 1.35));
}

type FilmSlotProps = {
  offerId: string;
  videoId: string | null;
  previewSrc: string | null;
};

/**
 * Slot wgrywania krótkiego, pionowego filmu na Cloudflare Stream — to materiał, który gra
 * w pętli na karcie oferty na stronie głównej i w katalogu. Klient zwracał uwagę, że dla dłuższych
 * filmów nie ma sensu wgrywać dużych plików — zamiast tego mamy oddzielne pole „Link do YouTube"
 * w formularzu ogólnym oferty.
 */
function FilmSlot({ offerId, videoId, previewSrc }: FilmSlotProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const uploadStartRef = useRef(0);
  const bytePctRef = useRef(0);

  const [phase, setPhase] = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  const [displayPct, setDisplayPct] = useState(0);
  const [forceReplace, setForceReplace] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorKind, setErrorKind] = useState<"size" | "fail" | null>(null);

  const hasVideo = Boolean(videoId?.trim());
  const showDropzone = !hasVideo || forceReplace;

  const runUpload = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_BYTES) {
        setErrorKind("size");
        setPhase("error");
        return;
      }

      uploadStartRef.current = Date.now();
      bytePctRef.current = 0;
      setDisplayPct(0);
      setErrorKind(null);
      setPhase("uploading");

      try {
        let videoUid: string;

        if (file.size <= BASIC_UPLOAD_MAX_BYTES) {
          const init = await fetch("/api/cloudflare/direct-upload", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ maxDurationSeconds: 3600 }),
          });
          const initJson = (await init.json().catch(() => ({}))) as { uploadURL?: string; uid?: string; error?: string };
          if (!init.ok) {
            console.error("[film upload]", init.status, initJson);
            throw new Error("init");
          }
          if (!initJson.uploadURL || !initJson.uid) {
            console.error("[film upload] bad init payload", initJson);
            throw new Error("init");
          }

          const fd = new FormData();
          fd.append("file", file);
          const up = await fetch(initJson.uploadURL, { method: "POST", body: fd });
          if (!up.ok) {
            console.error("[film upload] file POST", up.status);
            throw new Error("upload");
          }
          const resolved = idFromBasicUploadResponse(up, initJson.uid);
          if (!resolved) {
            console.error("[film upload] no id in response");
            throw new Error("noid");
          }
          videoUid = resolved;
        } else {
          videoUid = await new Promise<string>((resolve, reject) => {
            const upload = new Upload(file, {
              endpoint: `${window.location.origin}/api/cloudflare/tus`,
              chunkSize: 50 * 1024 * 1024,
              retryDelays: [0, 2000, 5000, 10_000],
              metadata: { filename: file.name, filetype: file.type || "application/octet-stream" },
              onError: (err) => reject(err),
              onProgress: (sent, total) => {
                if (total > 0) {
                  bytePctRef.current = Math.round((sent / total) * 100);
                  setDisplayPct((prev) =>
                    Math.min(
                      99,
                      Math.max(prev, bytePctRef.current, simulatedPct(Date.now() - uploadStartRef.current, false)),
                    ),
                  );
                }
              },
              onSuccess: (payload) => {
                const hdr =
                  payload.lastResponse.getHeader("stream-media-id") ||
                  payload.lastResponse.getHeader("Stream-Media-Id");
                const fromHdr = hdr?.trim();
                const fromUrl = idFromTusUrl(upload.url);
                const uid = fromHdr || fromUrl;
                if (!uid) reject(new Error("noid"));
                else resolve(uid);
              },
            });
            upload.start();
          });
        }

        setPhase("saving");
        bytePctRef.current = 100;
        setDisplayPct((p) => Math.max(p, 95));

        const attach = await attachStreamVideoSlotAction(offerId, "short", videoUid);
        if (!attach.ok) {
          console.error("[film upload] attach", attach.error);
          throw new Error("attach");
        }

        setPhase("done");
        setDisplayPct(100);
        setShowSuccess(true);
        setForceReplace(false);
        router.refresh();
        window.setTimeout(() => {
          setPhase("idle");
          setDisplayPct(0);
          setShowSuccess(false);
        }, 4000);
      } catch (e) {
        console.error("[film upload]", e);
        setErrorKind("fail");
        setPhase("error");
        setDisplayPct(0);
      }
    },
    [offerId, router],
  );

  useEffect(() => {
    if (phase !== "uploading" && phase !== "saving") return;
    const id = window.setInterval(() => {
      const elapsed = Date.now() - uploadStartRef.current;
      const sim = simulatedPct(elapsed, phase === "saving");
      setDisplayPct((prev) => Math.min(99, Math.max(prev, sim, bytePctRef.current)));
    }, 140);
    return () => window.clearInterval(id);
  }, [phase]);

  function onPickFile(f: File | undefined) {
    if (!f) return;
    void runUpload(f);
  }

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) onPickFile(f);
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-ink-900/35 p-5 sm:p-6 flex flex-col min-h-[260px]">
      <h3 className="text-[16px] font-semibold text-white leading-snug">Krótki, pionowy film</h3>
      <p className="mt-2 text-[13px] text-ink-300 leading-relaxed">
        Materiał wyświetlany na karcie oferty — strona główna, katalog. <strong className="text-white">Bez filmu oferta nie pojawi się na stronie.</strong>
      </p>

      {!showDropzone ? (
        <div className="mt-4 flex flex-col gap-3 flex-1">
          {previewSrc ? (
            <div className="rounded-lg overflow-hidden border border-white/10 bg-black aspect-video w-full max-h-[240px]">
              <iframe title="Krótki film" src={previewSrc} className="h-full w-full min-h-[200px]" allowFullScreen />
            </div>
          ) : (
            <p className="text-[12px] text-ink-300 leading-relaxed">
              Film jest zapisany. Podgląd w panelu nie jest dostępny — możesz sprawdzić odtwarzanie na publicznej stronie oferty.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setForceReplace(true);
              setPhase("idle");
              setErrorKind(null);
              setDisplayPct(0);
            }}
            className="self-start rounded-full border border-white/25 bg-white/10 hover:bg-white/15 text-[13px] font-semibold text-white px-5 py-2.5 transition-colors"
          >
            Zmień film
          </button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/*,.mp4,.mov"
            className="sr-only"
            onChange={(e) => {
              onPickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div
            ref={dropRef}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragEnter={onDrag}
            onDragOver={onDrag}
            onDragLeave={onDrag}
            onDrop={onDrop}
            onClick={() => (phase === "idle" || phase === "error") && inputRef.current?.click()}
            className={[
              "mt-4 flex-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed min-h-[160px] px-4 py-8 text-center transition-colors cursor-pointer",
              phase === "uploading" || phase === "saving"
                ? "border-brand-400/70 bg-brand-500/15"
                : "border-white/30 bg-ink-950/40 hover:border-white/50 hover:bg-ink-900/60",
            ].join(" ")}
          >
            <p className="text-[15px] font-semibold text-white leading-snug max-w-[28ch]">
              Przeciągnij plik tutaj lub kliknij, żeby wybrać
            </p>
            <p className="mt-3 text-[12px] text-ink-300">MP4, MOV, do 500 MB. Wgranie i powiązanie zachodzi od razu — bez dodatkowego „Zapisz".</p>
          </div>
        </>
      )}

      {(phase === "uploading" || phase === "saving") && (
        <div className="mt-4 space-y-2">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-[width] duration-200 ease-out"
              style={{ width: `${Math.min(100, displayPct)}%` }}
            />
          </div>
          <p className="text-[12px] text-ink-100 tabular-nums">
            Przesyłanie... {Math.min(100, Math.round(displayPct))}%
          </p>
        </div>
      )}

      {phase === "error" && (
        <p className="mt-4 text-[13px] text-accent-300 leading-snug">
          {errorKind === "size"
            ? "Plik jest większy niż 500 MB. Wybierz mniejszy plik."
            : "Nie udało się przesłać filmu. Spróbuj ponownie."}
        </p>
      )}

      {showSuccess && (
        <p className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-emerald-300">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Film został dodany i powiązany z ofertą.
        </p>
      )}
    </div>
  );
}

type SectionProps = {
  offerId: string;
  shortVideoId: string | null;
  shortPreviewSrc: string | null;
  youtubeUrl: string | null;
};

export function OfferFilmSection({
  offerId,
  shortVideoId,
  shortPreviewSrc,
  youtubeUrl,
}: SectionProps) {
  const [showManualIds, setShowManualIds] = useState(false);

  return (
    <section className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04] p-6 md:p-8 mt-10">
      <h2 className="font-display text-[1.45rem] md:text-[1.6rem] text-white leading-tight">Filmy do oferty</h2>
      <p className="mt-3 text-[14px] text-ink-200 max-w-[60ch] leading-relaxed">
        Krótki film (Cloudflare) gra na karcie oferty. Dłuższą prezentację dodajesz przez link
        do YouTube w sekcji powyżej — nic więcej nie musisz robić.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <FilmSlot
          offerId={offerId}
          videoId={shortVideoId}
          previewSrc={shortPreviewSrc}
        />

        <div className="rounded-[var(--radius-md)] border border-emerald-300/25 bg-emerald-400/5 p-5 sm:p-6 flex flex-col min-h-[260px]">
          <h3 className="text-[16px] font-semibold text-white leading-snug">Dłuższy film z YouTube</h3>
          <p className="mt-2 text-[13px] text-ink-200 leading-relaxed">
            Pełna prezentacja nieruchomości z YouTube. Edytujesz w sekcji „Dane oferty” → „Film z YouTube”.
            Po zapisaniu film pojawia się w sekcji „Film prezentacyjny” na stronie oferty.
          </p>

          <div className="mt-4 rounded-lg border border-white/10 bg-ink-950/50 p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-300">Aktualny link</p>
            {youtubeUrl ? (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 break-all text-[13px] text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
              >
                {youtubeUrl}
              </a>
            ) : (
              <p className="mt-2 text-[13px] text-ink-300">Brak linku.</p>
            )}
          </div>

          {/* Przycisk-kotwica — przewija stronę do pola „Link do YouTube" w sekcji „Dane oferty"
              i fokusuje input. Tekst zmienia się dynamicznie: gdy linku nie ma — „Dodaj link",
              gdy jest — „Zmień link". Nie używamy <a href="#…"> żeby zostać w tym samym scrollu
              i wymusić focus po przewinięciu. */}
          <button
            type="button"
            onClick={() => {
              const target = document.getElementById("youtube_url");
              const wrapper = document.getElementById("youtube-url-field");
              (wrapper ?? target)?.scrollIntoView({ behavior: "smooth", block: "start" });
              window.setTimeout(() => target?.focus({ preventScroll: true }), 480);
            }}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-[13.5px] font-semibold px-5 py-3 transition-colors self-start shadow-[0_8px_20px_-10px_rgba(16,185,129,0.55)]"
            aria-label={youtubeUrl ? "Zmień link do filmu na YouTube" : "Dodaj link do filmu na YouTube"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              {youtubeUrl ? (
                <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
            {youtubeUrl ? "Zmień link" : "Dodaj link YouTube"}
          </button>

          {youtubeUrl ? (
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg bg-black border border-white/10">
              <iframe
                src={youtubeEmbedUrl(youtubeUrl)}
                title="Podgląd YouTube"
                className="h-full w-full"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-white/10">
        {!showManualIds ? (
          <button
            type="button"
            onClick={() => setShowManualIds(true)}
            className="text-[12px] text-ink-300 hover:text-ink-100 underline underline-offset-2 transition-colors"
          >
            Wpisz ID krótkiego filmu ręcznie (zaawansowane)
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-[12px] text-ink-300 leading-relaxed">
              Tylko dla administratora technicznego — gdy nie korzystasz z przesyłania pliku powyżej.
            </p>
            <form key={`${shortVideoId ?? ""}`} action={upsertOfferMediaAction} className="space-y-4 max-w-xl">
              <input type="hidden" name="offer_id" value={offerId} />
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">ID — krótki film (Cloudflare)</span>
                <input
                  name="cloudflare_video_short_id"
                  type="text"
                  autoComplete="off"
                  defaultValue={shortVideoId ?? ""}
                  className="mt-2 w-full rounded-[var(--radius-sm)] border border-white/15 bg-ink-900/80 px-3 py-2.5 text-[13px] text-white font-mono outline-none transition-colors focus:border-brand-400"
                />
              </label>
              <p className="text-[12px] text-ink-300">
                Możesz wyczyścić i zapisać — usuniesz powiązanie z krótkim filmem dla tej oferty.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[13px] font-semibold px-6 py-2.5 transition-colors"
                >
                  Zapisz ID krótkiego filmu
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualIds(false)}
                  className="rounded-full border border-white/15 text-[12px] text-ink-200 hover:text-white px-4 py-2.5 transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

/** Konwertuje pełen URL YouTube na URL embed (`/embed/ID`). */
function youtubeEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.split("/").filter(Boolean)[0] ?? null;
    else if (host.endsWith("youtube.com")) {
      id = u.searchParams.get("v");
      if (!id) {
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts[0] === "shorts" || parts[0] === "embed") id = parts[1] ?? null;
      }
    }
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return url;
  }
}
