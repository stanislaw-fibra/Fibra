"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "tus-js-client";
import {
  attachTeamMemberVideoAction,
  clearTeamMemberVideoAction,
  updateTeamMemberAction,
} from "@/app/panel/actions/team";
import {
  cloudflareStreamIframeUrl,
  cloudflareStreamThumbnailUrl,
  cloudflareStreamThumbnailViaDeliveryNet,
} from "@/lib/cloudflare-stream";

const MAX_FILE_BYTES = 500 * 1024 * 1024;
const BASIC_UPLOAD_MAX_BYTES = 200 * 1024 * 1024;

type Props = {
  id: string;
  name: string;
  bio: string;
  role: string;
  order: number;
  isVisible: boolean;
  videoId?: string;
  photoUrl?: string;
  /** searchParam-driven flag: czy ten konkretny agent dostał ?saved={id}. */
  justSaved?: boolean;
  /** Jeśli false — kolumny migracji jeszcze nie ma; chowamy upload wideo i pokazujemy info. */
  videoEnabled?: boolean;
  /** Publiczny slug agenta — gdy ustawiony, pokazujemy widget „Skopiuj link publiczny". */
  slug?: string;
};

function positionOptionFor(order: number): string {
  if (order <= 0) return "0";
  if (order < 15) return "10";
  if (order < 25) return "20";
  if (order < 35) return "30";
  if (order < 45) return "40";
  return "100";
}

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
  const cap = 38;
  const t = Math.min(1, elapsedMs / 14_000);
  return cap * (1 - Math.pow(1 - t, 1.35));
}

export function TeamMemberEditor({
  id,
  name,
  bio,
  role,
  order,
  isVisible,
  videoId,
  photoUrl,
  justSaved,
  videoEnabled = true,
  slug,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const uploadStartRef = useRef(0);
  const bytePctRef = useRef(0);

  const [phase, setPhase] = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  const [pct, setPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorIsMigration, setErrorIsMigration] = useState(false);
  const [forceReplace, setForceReplace] = useState(false);
  const [showJustSaved, setShowJustSaved] = useState<boolean>(justSaved ?? false);
  const [visibleLocal, setVisibleLocal] = useState<boolean>(isVisible);
  // Czy podgląd filmu (iframe) ma być zamontowany. Domyślnie NIE — tuż po uploadzie Cloudflare
  // potrzebuje 15-30 sekund, żeby przetworzyć film. Przy automatycznym mount-cie iframe pokazywał
  // „video not found". Pokazujemy poster + przycisk „Pokaż podgląd" — admin sam decyduje, kiedy
  // sprawdzić. Plus to po prostu szybciej ładuje stronę panelu (jedna mniej iframe).
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const toggleId = useId();

  // Wygaszamy banner po krótkim czasie.
  useEffect(() => {
    if (!showJustSaved) return;
    const t = window.setTimeout(() => setShowJustSaved(false), 5000);
    return () => window.clearTimeout(t);
  }, [showJustSaved]);

  // Animowany progress bar — kopia patternu z OfferFilmSection.FilmSlot, który działa.
  useEffect(() => {
    if (phase !== "uploading" && phase !== "saving") return;
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - uploadStartRef.current;
      const sim = simulatedPct(elapsed, phase === "saving");
      setPct((prev) => Math.min(99, Math.max(prev, sim, bytePctRef.current)));
    }, 140);
    return () => window.clearInterval(intervalId);
  }, [phase]);

  const iframeUrl = videoId ? cloudflareStreamIframeUrl(videoId) : null;
  const posterUrl = videoId
    ? cloudflareStreamThumbnailUrl(videoId, { time: "0.5s", height: 1100 }) ||
      cloudflareStreamThumbnailViaDeliveryNet(videoId, { time: "0.5s", height: 1100 })
    : null;

  const hasVideo = Boolean(iframeUrl);
  const showDropzone = videoEnabled && (!hasVideo || forceReplace);

  const runUpload = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_BYTES) {
        setErrorMsg("Plik jest większy niż 500 MB. Wybierz mniejszy plik.");
        setErrorIsMigration(false);
        setPhase("error");
        return;
      }

      uploadStartRef.current = Date.now();
      bytePctRef.current = 0;
      setPct(0);
      setErrorMsg(null);
      setErrorIsMigration(false);
      setPhase("uploading");

      try {
        let videoUid: string;
        if (file.size <= BASIC_UPLOAD_MAX_BYTES) {
          const init = await fetch("/api/cloudflare/direct-upload", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ maxDurationSeconds: 1800 }),
          });
          const initJson = (await init.json().catch(() => ({}))) as { uploadURL?: string; uid?: string };
          if (!init.ok || !initJson.uploadURL || !initJson.uid) throw new Error("init");

          const fd = new FormData();
          fd.append("file", file);
          const up = await fetch(initJson.uploadURL, { method: "POST", body: fd });
          if (!up.ok) throw new Error("upload");
          const resolved = idFromBasicUploadResponse(up, initJson.uid);
          if (!resolved) throw new Error("noid");
          videoUid = resolved;
          bytePctRef.current = 90;
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
                  setPct((prev) =>
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
        setPct((p) => Math.max(p, 95));

        const attach = await attachTeamMemberVideoAction(id, videoUid);
        if (!attach.ok) {
          // Wykrywamy specjalnie sygnał o brakującej migracji, żeby pokazać prominentny banner zamiast małego napisu.
          const isMigration = attach.error.toLowerCase().includes("migrac");
          setErrorMsg(attach.error);
          setErrorIsMigration(isMigration);
          setPhase("error");
          setPct(0);
          return;
        }

        // Server atomicznie ustawił is_team_visible=true — odzwierciedlamy to w UI od razu,
        // żeby admin nie musiał klikać toggle ręcznie. Form przy „Zapisz" wyśle then is_team_visible=on
        // (czyli bez zmiany w bazie), więc nic się nie cofnie.
        if (attach.visibilityEnabled) {
          setVisibleLocal(true);
        }

        setPhase("done");
        setPct(100);
        setForceReplace(false);
        // Reset poster cache — żeby od razu pokazać poster z nowo wgranego filmu po refresh.
        setShowVideoPreview(false);
        // Odświeżamy stronę dopiero po 12 sekundach — wtedy Cloudflare zazwyczaj kończy
        // przetwarzanie i odpalenie iframe nie pokazuje już „video not found". Klient może
        // też kliknąć „Sprawdź ponownie" w bannerze, gdy chce odświeżyć ręcznie.
        window.setTimeout(() => {
          router.refresh();
        }, 12_000);
        window.setTimeout(() => {
          setPhase("idle");
          setPct(0);
        }, 30_000);
      } catch (e) {
        console.error("[team upload]", e);
        setErrorMsg(e instanceof Error ? e.message : "Nie udało się wgrać filmu.");
        setErrorIsMigration(false);
        setPhase("error");
        setPct(0);
      }
    },
    [id, router],
  );

  const onPickFile = useCallback(
    (f: File | undefined) => {
      if (!f) return;
      void runUpload(f);
    },
    [runUpload],
  );

  // Wzorzec drag-drop kopiowany z OfferFilmSection.FilmSlot (sprawdzone że działa):
  // proste preventDefault na Enter/Over/Leave i jeden Drop. Bez dragCounter — nie potrzeba,
  // bo dropzone to jeden element, który albo trzyma stan dragging, albo nie.
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
    <article className="rounded-[var(--radius-md)] border border-white/10 bg-paper p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Lewa kolumna — wideo / drop zone. */}
        <div className="lg:col-span-5">
          <h3 className="font-display text-[1.6rem] text-ink-950 leading-tight">{name}</h3>
          <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-700">
            {role || "Brak roli"}
          </p>

          {/* Publiczny link agenta — można skopiować i wysłać klientowi.
              Klient po wejściu zobaczy autoprezentację + listę ofert tego agenta. */}
          {slug ? <AgentPublicLinkCopier slug={slug} /> : null}

          {/* Wariant 1: jest film — pokazujemy poster (miniaturę z Cloudflare) + przycisk
              „Pokaż podgląd". Iframe jest montowany TYLKO po kliknięciu przycisku, żeby
              tuż po uploadzie nie pokazywać „video not found", póki Cloudflare przetwarza film.
              Plus szybciej ładuje stronę panelu — bez auto-iframe per agent. */}
          {!showDropzone && hasVideo ? (
            <div className="mt-5">
              <div className="relative aspect-[9/16] max-w-[280px] mx-auto lg:mx-0 overflow-hidden rounded-[var(--radius-md)] ring-1 ring-ink-200/60 bg-ink-950">
                {posterUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={posterUrl} alt={`${name} — poster`} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/60">
                    <span className="font-display text-[2rem]">{name.charAt(0).toUpperCase()}</span>
                  </div>
                )}

                {showVideoPreview && iframeUrl ? (
                  <iframe
                    src={iframeUrl}
                    title={`${name} — wideo`}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : null}

                {!showVideoPreview ? (
                  <button
                    type="button"
                    onClick={() => setShowVideoPreview(true)}
                    className="absolute inset-0 z-10 flex items-end justify-center bg-gradient-to-t from-ink-950/65 via-ink-950/15 to-transparent transition-opacity duration-200 hover:opacity-95"
                    aria-label={`Pokaż podgląd filmu: ${name}`}
                  >
                    <span className="mb-5 inline-flex items-center gap-2.5 rounded-full bg-white/95 px-4 py-2.5 text-[12.5px] font-semibold text-ink-950 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">
                        <svg width="10" height="10" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
                          <path d="M2.5 1.5l7 4-7 4v-8z" />
                        </svg>
                      </span>
                      Pokaż podgląd
                    </span>
                  </button>
                ) : null}
              </div>
              <div className="mt-3 max-w-[280px] mx-auto lg:mx-0 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setForceReplace(true);
                    setPhase("idle");
                    setErrorMsg(null);
                    setErrorIsMigration(false);
                    setPct(0);
                  }}
                  className="rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[12.5px] font-semibold px-4 py-2 transition-colors"
                >
                  Zmień film
                </button>
                <form action={clearTeamMemberVideoAction}>
                  <input type="hidden" name="id" value={id} />
                  <button
                    type="submit"
                    className="rounded-full border border-ink-300 hover:border-accent-400 hover:bg-accent-400/10 text-ink-700 hover:text-accent-700 text-[12.5px] font-semibold px-4 py-2 transition-colors"
                  >
                    Usuń film
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          {/* Wariant 2: nie ma filmu lub user kliknął „Zmień film" — pokazujemy duży, jednoznaczny dropzone. */}
          {showDropzone ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/*,.mp4,.mov"
                className="sr-only"
                onChange={(e) => {
                  onPickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              <div
                ref={dropZoneRef}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragEnter={onDrag}
                onDragOver={onDrag}
                onDragLeave={onDrag}
                onDrop={onDrop}
                onClick={() => (phase === "idle" || phase === "error") && fileInputRef.current?.click()}
                className={[
                  "mt-5 group max-w-[320px] mx-auto lg:mx-0",
                  "flex flex-col items-center justify-center text-center cursor-pointer",
                  "rounded-[var(--radius-md)] border-2 border-dashed px-5 py-10 min-h-[260px]",
                  "transition-colors",
                  phase === "uploading" || phase === "saving"
                    ? "border-brand-500 bg-brand-50/60"
                    : "border-ink-300 bg-paper-warm/40 hover:border-brand-500 hover:bg-brand-50/40",
                ].join(" ")}
              >
                {/* Ikona + napis - identyczny pattern jak w OfferFilmSection. */}
                <span aria-hidden className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-700 mb-3 group-hover:bg-brand-500/15">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className="text-[14.5px] font-semibold text-ink-900 leading-snug">
                  {phase === "uploading" || phase === "saving"
                    ? "Wysyłam film…"
                    : hasVideo
                      ? "Przeciągnij nowy film tutaj lub kliknij"
                      : "Przeciągnij film tutaj lub kliknij"}
                </p>
                <p className="mt-2 text-[12.5px] text-ink-700 leading-relaxed max-w-[28ch]">
                  Pionowe wideo prezentacyjne agenta. MP4, MOV — do 500 MB.
                </p>

                {(phase === "uploading" || phase === "saving") && (
                  <div className="mt-5 w-full max-w-[220px]">
                    <div className="h-2 rounded-full bg-ink-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-[width] duration-200 ease-out"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11.5px] text-ink-700 tabular-nums">
                      {phase === "saving" ? "Zapisuję powiązanie…" : `${Math.min(100, Math.round(pct))}%`}
                    </p>
                  </div>
                )}
              </div>

              {forceReplace ? (
                <button
                  type="button"
                  onClick={() => {
                    setForceReplace(false);
                    setPhase("idle");
                  }}
                  className="mt-3 text-[12px] text-ink-600 hover:text-ink-900 underline underline-offset-2"
                >
                  Anuluj — wróć do podglądu obecnego filmu
                </button>
              ) : null}
            </>
          ) : null}

          {/* Stany komunikacyjne — błąd / sukces. Migracja dostaje WIELKI banner. */}
          {phase === "error" && errorIsMigration && errorMsg ? (
            <div className="mt-4 max-w-[320px] mx-auto lg:mx-0 rounded-[var(--radius-md)] border-2 border-amber-400/70 bg-amber-100/70 p-4">
              <p className="text-[13px] font-bold text-amber-900 leading-tight">Migracja bazy wymagana</p>
              <p className="mt-2 text-[12.5px] text-amber-900 leading-relaxed">
                Aby wgrywać filmy zespołu, najpierw uruchom migrację SQL w Supabase.
                Instrukcja jest u góry tej strony.
              </p>
            </div>
          ) : null}

          {phase === "error" && !errorIsMigration && errorMsg ? (
            <p className="mt-3 max-w-[320px] mx-auto lg:mx-0 rounded-[var(--radius-sm)] border border-accent-400/40 bg-accent-400/10 px-3 py-2 text-[13px] font-semibold text-accent-700">
              {errorMsg}
            </p>
          ) : null}
          {phase === "done" ? (
            <div className="mt-4 max-w-[320px] mx-auto lg:mx-0 rounded-[var(--radius-md)] border-2 border-emerald-400/60 bg-emerald-50 p-4">
              <p className="inline-flex items-center gap-2 text-[13.5px] font-bold text-emerald-800 leading-tight">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7.5l3 3L11 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Film wgrany i widoczny
              </p>
              <p className="mt-2 text-[12.5px] text-emerald-900/90 leading-relaxed">
                Powiązanie z agentem zostało zapisane, a widoczność na stronie /o-fibrze
                została automatycznie włączona.
              </p>
              <p className="mt-2 text-[12.5px] text-emerald-900/90 leading-relaxed">
                <strong className="text-emerald-900">Cloudflare przetwarza film ~15-30 sek.</strong>{" "}
                Jeśli klikniesz „Pokaż podgląd" i zobaczysz „video not found" — odczekaj chwilę
                i kliknij „Sprawdź ponownie" poniżej.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVideoPreview(false);
                    router.refresh();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[12.5px] font-semibold px-4 py-2 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M9 4a3.5 3.5 0 1 0 .8 4M9 1.5V4H6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sprawdź ponownie
                </button>
                <a
                  href="/o-fibrze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/40 hover:bg-emerald-100 text-emerald-800 text-[12.5px] font-semibold px-4 py-2 transition-colors"
                >
                  Zobacz na /o-fibrze
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M3 6h6M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          ) : null}

          {/* Wariant 3: wideo wyłączone całkiem (migracja nie pojechała) — pokazujemy zdjęcie + info. */}
          {!videoEnabled ? (
            <div className="mt-5 max-w-[280px] mx-auto lg:mx-0">
              {photoUrl ? (
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-md)] ring-1 ring-ink-200/60 bg-paper-warm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt={`${name} — zdjęcie`} className="absolute inset-0 h-full w-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[3/4] w-full flex items-center justify-center rounded-[var(--radius-md)] ring-1 ring-ink-200/60 bg-paper-warm">
                  <span className="font-display text-[3rem] text-ink-500">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <p className="mt-3 text-[12px] text-ink-700">
                Wgrywanie filmów będzie dostępne po uruchomieniu migracji bazy (instrukcja na górze strony).
              </p>
            </div>
          ) : null}
        </div>

        {/* Prawa kolumna — pola tekstowe + zapis. */}
        <div className="lg:col-span-7">
          {showJustSaved ? (
            <div className="mb-5 rounded-[var(--radius-sm)] border border-emerald-400/40 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7.5l3 3L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Zapisano dane — strona /o-fibrze odświeży się automatycznie.
            </div>
          ) : null}

          <form action={updateTeamMemberAction} className="space-y-5">
            <input type="hidden" name="id" value={id} />

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700">Rola</span>
              <input
                name="team_role"
                type="text"
                defaultValue={role}
                placeholder="np. Założyciel, Prezes Zarządu"
                className="mt-2 w-full rounded-[var(--radius-sm)] border border-ink-300/90 bg-paper px-4 py-3 text-[14px] text-ink-900 outline-none transition-colors focus:border-brand-500 hover:border-ink-400"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700">Opis (wieloparagrafowy)</span>
              <textarea
                name="bio_long"
                rows={10}
                defaultValue={bio}
                placeholder="Pełny opis prezentowany na karcie zespołu…"
                className="mt-2 w-full rounded-[var(--radius-sm)] border border-ink-300/90 bg-paper px-4 py-3 text-[14px] text-ink-900 outline-none transition-colors focus:border-brand-500 hover:border-ink-400 leading-relaxed"
              />
              <span className="mt-1 block text-[12px] text-ink-700">
                Akapity oddziel pustą linią. Pojawią się jako osobne paragrafy.
              </span>
            </label>

            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 sm:items-end">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700">Pozycja na stronie</span>
                <select
                  name="team_order"
                  defaultValue={positionOptionFor(order)}
                  className="panel-select panel-select--light mt-2 w-full rounded-[var(--radius-sm)] border border-ink-300/90 bg-paper py-3 pl-4 pr-10 text-[14px] text-ink-900 outline-none transition-colors focus:border-brand-500 hover:border-ink-400"
                >
                  <option value="0">Pierwszy (na samej górze)</option>
                  <option value="10">Drugi</option>
                  <option value="20">Trzeci</option>
                  <option value="30">Czwarty</option>
                  <option value="40">Piąty</option>
                  <option value="100">Bez ustawienia (na końcu)</option>
                </select>
                <span className="mt-1 block text-[12px] text-ink-700">
                  W jakiej kolejności pokazuje się ta osoba na liście „Ludzie Fibry".
                </span>
              </label>

              <div className="rounded-[var(--radius-md)] border border-ink-200/80 bg-paper-warm/50 px-4 py-3.5">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700">
                  Widoczność na stronie /o-fibrze
                </span>
                <label htmlFor={toggleId} className="mt-3 flex items-center gap-3 cursor-pointer">
                  <input
                    id={toggleId}
                    type="checkbox"
                    name="is_team_visible"
                    value="on"
                    checked={visibleLocal}
                    onChange={(e) => setVisibleLocal(e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={[
                      "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
                      visibleLocal ? "bg-emerald-500" : "bg-ink-300",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform",
                        visibleLocal ? "translate-x-6" : "translate-x-1",
                      ].join(" ")}
                    />
                  </span>
                  <span className="flex flex-col">
                    <span className={["text-[14px] font-semibold leading-tight", visibleLocal ? "text-emerald-700" : "text-ink-700"].join(" ")}>
                      {visibleLocal ? "Widoczny na stronie" : "Ukryty"}
                    </span>
                    <span className="text-[12px] text-ink-600 leading-snug">
                      {visibleLocal ? `${name.split(" ")[0]} pojawia się w sekcji „Ludzie Fibry".` : `${name.split(" ")[0]} nie jest pokazywany na publicznej stronie.`}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white text-[14px] font-semibold px-6 py-3 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7l3 3L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Zapisz dane {name.split(" ")[0]}
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

/**
 * Mały widget: pokazuje publiczny URL agenta + przycisk kopiowania.
 * Po skopiowaniu — krótki "Skopiowano!" toast (2s).
 */
function AgentPublicLinkCopier({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `fibranieruchomosci.pl/agent/${slug}`;
  const fullUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host.replace(/^.+?\./, "")}/agent/${slug}`
    : `https://fibranieruchomosci.pl/agent/${slug}`;

  return (
    <div className="mt-4 rounded-[var(--radius-sm)] border border-ink-200/70 bg-ink-50/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        Publiczny link do wysłania klientowi
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <a
          href={`/agent/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-[13px] font-medium text-brand-700 hover:text-brand-500 underline-offset-2 hover:underline transition-colors"
          title={url}
        >
          {url}
        </a>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(fullUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // Fallback: select-and-copy (legacy) — rzadko potrzebne w nowoczesnych panelu.
              window.prompt("Skopiuj link", fullUrl);
            }
          }}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors shrink-0",
            copied
              ? "bg-emerald-500 text-white"
              : "bg-ink-900 hover:bg-brand-500 text-white",
          ].join(" ")}
          aria-label="Skopiuj publiczny link agenta"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2 6.5l2.5 2.5 5.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Skopiowano
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2 7V2c0-.6.4-1 1-1h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Skopiuj
            </>
          )}
        </button>
      </div>
    </div>
  );
}
