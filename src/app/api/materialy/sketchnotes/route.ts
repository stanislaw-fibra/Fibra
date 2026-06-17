import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Trwały link do streszczenia rysunkowego (lead magnet newslettera).
 *
 * Plik `sketchnotes.pdf` siedzi w PRYWATNYM buckecie. Przy każdym wejściu
 * generujemy świeży, krótko żyjący signed URL i przekierowujemy na niego -
 * dzięki temu link w mailu (np. z GetResponse) NIGDY nie wygasa, a plik zostaje
 * niepubliczny (nie ma stałego, kopiowalnego adresu do pliku).
 *
 * Publiczny adres do wklejenia w mailu: https://fibra.pl/api/materialy/sketchnotes
 */
export async function GET() {
  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.storage
      .from("course-materials")
      .createSignedUrl("sketchnotes.pdf", 60 * 60); // 1 h - wystarczy na pobranie/podgląd
    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: error?.message ?? "Nie znaleziono pliku" },
        { status: 500 },
      );
    }
    return NextResponse.redirect(data.signedUrl, 302);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Błąd" },
      { status: 500 },
    );
  }
}
