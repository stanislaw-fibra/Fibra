"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  createAccessToken,
  KURS_ACCESS_COOKIE,
  KURS_ACCESS_MAX_AGE,
} from "@/lib/kurs-access";

/** Tylko wewnętrzne ścieżki pod /kurs (poza samą bramką) - chroni przed open redirect. */
function safeNext(value: FormDataEntryValue | null): string {
  const s = typeof value === "string" ? value : "";
  if ((s === "/kurs" || s.startsWith("/kurs/")) && !s.startsWith("/kurs/login")) {
    return s;
  }
  return "/kurs";
}

/** Czy e-mail ma opłacony dostęp w tabeli course_access. */
async function emailHasAccess(email: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("course_access")
      .select("status")
      .eq("email", email)
      .maybeSingle();
    if (error || !data) return false;
    return data.status === "paid";
  } catch {
    return false;
  }
}

export async function loginAction(formData: FormData) {
  const code = ((formData.get("code") as string | null) ?? "").trim();
  const email = ((formData.get("email") as string | null) ?? "")
    .trim()
    .toLowerCase();
  const next = safeNext(formData.get("next"));

  const expectedCode = process.env.KURS_ACCESS_CODE?.trim();

  let granted = false;
  if (code && expectedCode && code === expectedCode) {
    granted = true;
  } else if (email && /.+@.+\..+/.test(email)) {
    granted = await emailHasAccess(email);
  }

  if (!granted) {
    redirect(`/kurs/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await createAccessToken();
  if (!token) {
    // Brak KURS_ACCESS_SECRET - bramka nieskonfigurowana.
    redirect(`/kurs/login?error=config&next=${encodeURIComponent(next)}`);
  }

  const store = await cookies();
  store.set(KURS_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: KURS_ACCESS_MAX_AGE,
  });

  redirect(next);
}
