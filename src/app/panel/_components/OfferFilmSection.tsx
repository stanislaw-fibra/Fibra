"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { attachStreamVideoSlotAction, upsertOfferMediaAction } from "@/app/panel/actions/offers";

const MAX_FILE_BYTES = 500 * 1024 * 1024;
const BASIC_UPLOAD_MAX_BYTES = 200 * 1024 * 1024;

type Slot = "short" | "long";

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
  // Delikatny „pozorny” postęp na starcie (inicjacja może trwać 10–15 s).
  const cap = 38;
  const t = Math.min(1, elapsedMs / 14_000);
  return cap * (1 - Math.pow(1 - t, 1.35));
}

type FilmSlotProps = {
  offerId: string;
  slot: Slot;
  heading: string;
  caption: string;
  videoId: string | null;
  previewSrc: string | null;
};

function FilmSlot({ offerId, slot, heading, caption, videoId, previewSrc }: FilmSlotProps) {
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

        const attach = await attachStreamVideoSlotAction(offerId, slot, videoUid);
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
    [offerId, slot, router],
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
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-ink-900/35 p-4 sm:p-5 flex flex-col min-h-[220px]">
      <h3 className="text-[15px] font-medium text-white leading-snug">{heading}</h3>
      <p className="mt-2 text-[13px] text-ink-400 leading-relaxed">{caption}</p>

      {!showDropzone ? (
        <div className="mt-4 flex flex-col gap-3 flex-1">
          {previewSrc ? (
            <div className="rounded-lg overflow-hidden border border-white/10 bg-black aspect-video w-full max-h-[200px]">
              <iframe title={heading} src={previewSrc} className="h-full w-full min-h-[160px]" allowFullScreen />
            </div>
          ) : (
            <p className="text-[12px] text-ink-500 leading-relaxed">
              Film jest zapisany. Podgląd w panelu nie jest dostępny - możesz sprawdzić odtwarzanie na publicznej stronie oferty.
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
            className="self-start rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-[12px] font-medium text-white px-4 py-2 transition-colors"
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
              "mt-4 flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed min-h-[140px] px-4 py-8 text-center transition-colors cursor-pointer",
              phase === "uploading" || phase === "saving"
                ? "border-brand-400/50 bg-brand-500/10"
                : "border-white/20 bg-ink-950/40 hover:border-white/35 hover:bg-ink-900/60",
            ].join(" ")}
          >
            <p className="text-[14px] text-ink-200 leading-snug max-w-[28ch]">
              Przeciągnij plik tutaj lub kliknij, żeby wybrać
            </p>
            <p className="mt-3 text-[11px] text-ink-500">MP4, MOV, do 500 MB</p>
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
          <p className="text-[12px] text-ink-300 tabular-nums">
            Przesyłanie... {Math.min(100, Math.round(displayPct))}%
          </p>
        </div>
      )}

      {phase === "error" && (
        <p className="mt-4 text-[13px] text-accent-400 leading-snug">
          {errorKind === "size"
            ? "Plik jest większy niż 500 MB. Wybierz mniejszy plik."
            : "Nie udało się przesłać filmu. Spróbuj ponownie."}
        </p>
      )}

      {showSuccess && <p className="mt-4 text-[13px] text-emerald-400/95">Film został dodany.</p>}
    </div>
  );
}

type SectionProps = {
  offerId: string;
  shortVideoId: string | null;
  longVideoId: string | null;
  shortPreviewSrc: string | null;
  longPreviewSrc: string | null;
};

export function OfferFilmSection({
  offerId,
  shortVideoId,
  longVideoId,
  shortPreviewSrc,
  longPreviewSrc,
}: SectionProps) {
  const [showManualIds, setShowManualIds] = useState(false);

  return (
    <section className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04] p-6 md:p-8 mt-10">
      <h2 className="font-display text-[1.35rem] md:text-[1.5rem] text-white leading-tight">Film do oferty</h2>
      <p className="mt-3 text-[14px] text-ink-400 max-w-[56ch] leading-relaxed">
        Film jest wymagany, żeby oferta pojawiła się na stronie. Bez filmu oferta nie będzie widoczna w katalogu.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <FilmSlot
          offerId={offerId}
          slot="short"
          heading="Krótki film"
          caption="Pionowy klip wyświetlany na stronie głównej i w katalogu ofert. To pierwsza rzecz, którą zobaczy klient."
          videoId={shortVideoId}
          previewSrc={shortPreviewSrc}
        />
        <FilmSlot
          offerId={offerId}
          slot="long"
          heading="Dłuższy film (opcjonalnie)"
          caption="Pełna prezentacja nieruchomości wyświetlana na stronie oferty. Jeśli nie dodasz, użyjemy krótkiego filmu."
          videoId={longVideoId}
          previewSrc={longPreviewSrc}
        />
      </div>

      <div className="mt-10 pt-6 border-t border-white/10">
        {!showManualIds ? (
          <button
            type="button"
            onClick={() => setShowManualIds(true)}
            className="text-[12px] text-ink-500 hover:text-ink-300 underline underline-offset-2 transition-colors"
          >
            Wpisz ID filmu ręcznie
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-[12px] text-ink-500 leading-relaxed">
              Tylko dla administratora technicznego - gdy nie korzystasz z przesyłania pliku powyżej.
            </p>
            <form key={`${shortVideoId ?? ""}-${longVideoId ?? ""}`} action={upsertOfferMediaAction} className="space-y-4 max-w-xl">
              <input type="hidden" name="offer_id" value={offerId} />
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">ID - krótki film</span>
                <input
                  name="cloudflare_video_short_id"
                  type="text"
                  autoComplete="off"
                  defaultValue={shortVideoId ?? ""}
                  className="mt-2 w-full rounded-[var(--radius-sm)] border border-white/15 bg-ink-900/80 px-3 py-2.5 text-[13px] text-white font-mono outline-none transition-colors focus:border-brand-400"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">ID - długi film</span>
                <input
                  name="cloudflare_video_long_id"
                  type="text"
                  autoComplete="off"
                  defaultValue={longVideoId ?? ""}
                  className="mt-2 w-full rounded-[var(--radius-sm)] border border-white/15 bg-ink-900/80 px-3 py-2.5 text-[13px] text-white font-mono outline-none transition-colors focus:border-brand-400"
                />
              </label>
              <p className="text-[12px] text-ink-500">
                Oba pola można wyczyścić i zapisać - usuniesz powiązanie z filmami dla tej oferty.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[13px] font-medium px-6 py-2.5 transition-colors"
                >
                  Zapisz
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualIds(false)}
                  className="rounded-full border border-white/15 text-[12px] text-ink-400 hover:text-white px-4 py-2.5 transition-colors"
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
