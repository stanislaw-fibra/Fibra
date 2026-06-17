import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Materiały kursu (pakiet po zakupie) z PRYWATNEGO bucketa Supabase Storage.
 * Serwujemy je wyłącznie przez krótko żyjące signed URL-e generowane na serwerze
 * dla strony /kurs (która jest za bramką dostępu). Plików nie da się pobrać bez
 * ważnego, podpisanego URL-a - brak wiecznych, udostępnialnych linków.
 *
 * Generowane przy każdym wejściu na portal (strona dynamiczna), TTL 12 h.
 */

const BUCKET = "course-materials";
const TTL_SECONDS = 60 * 60 * 12; // 12 h

/** Szkolenie VOD (dodatek do pakietu z książką) - Cloudflare Stream UID. */
export const COURSE_VOD_STREAM_ID = "5c633c2fad5debd731c4bf4606388fcc";

export type AudiobookChapter = { n: number; title: string; url: string };

export type CourseMaterials = {
  ebookUrl: string | null;
  audiobook: AudiobookChapter[];
  vodStreamId: string;
};

/** „02_ROZWOZE_WEGIEL.mp3" -> { n: 2, title: "Rozwoze wegiel" }. */
function prettyChapter(filename: string): { n: number; title: string } {
  const base = filename.replace(/\.mp3$/i, "");
  const m = base.match(/^(\d+)[\s_-]*(.*)$/);
  const n = m ? Number(m[1]) : 0;
  const rest = (m ? m[2] : base).replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const title = rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : `Rozdział ${n}`;
  return { n, title };
}

const EMPTY: CourseMaterials = {
  ebookUrl: null,
  audiobook: [],
  vodStreamId: COURSE_VOD_STREAM_ID,
};

export async function getCourseMaterials(): Promise<CourseMaterials> {
  let admin;
  try {
    admin = createSupabaseAdmin();
  } catch {
    return EMPTY;
  }

  const store = admin.storage.from(BUCKET);

  // E-book (sketchnotes celowo NIE tutaj - to bonus newsletterowy, dostarczany
  // osobnym flow; plik zostaje w buckecie do tej automatyzacji).
  const { data: ebookSigned } = await store.createSignedUrl("ebook.pdf", TTL_SECONDS);
  const ebookUrl = ebookSigned?.signedUrl ?? null;

  // Audiobook - lista rozdziałów z folderu + podpis każdego.
  const { data: files } = await store.list("audiobook", {
    limit: 500,
    sortBy: { column: "name", order: "asc" },
  });
  const names = (files ?? [])
    .filter((f) => /\.mp3$/i.test(f.name))
    .map((f) => f.name)
    .sort();
  const paths = names.map((n) => `audiobook/${n}`);
  const { data: signed } = paths.length
    ? await store.createSignedUrls(paths, TTL_SECONDS)
    : { data: [] as { path?: string | null; signedUrl: string }[] };
  const urlByPath = new Map((signed ?? []).map((x) => [x.path, x.signedUrl]));

  const audiobook: AudiobookChapter[] = names
    .map((name) => {
      const { n, title } = prettyChapter(name);
      return { n, title, url: urlByPath.get(`audiobook/${name}`) ?? "" };
    })
    .filter((c) => c.url);

  return { ebookUrl, audiobook, vodStreamId: COURSE_VOD_STREAM_ID };
}
