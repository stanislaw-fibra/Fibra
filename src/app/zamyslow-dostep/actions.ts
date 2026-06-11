"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkZamyslowPassword,
  createZamyslowToken,
  isZamyslowGatedPath,
  ZAMYSLOW_ACCESS_COOKIE,
  ZAMYSLOW_ACCESS_MAX_AGE,
  ZAMYSLOW_GATE_PATH,
} from "@/lib/zamyslow-gate";

/** Tylko wewnętrzne, chronione ścieżki - chroni przed open redirect. */
function safeNext(value: FormDataEntryValue | null): string {
  const s = typeof value === "string" ? value : "";
  return isZamyslowGatedPath(s) ? s : "/zamyslow";
}

export async function zamyslowGateAction(formData: FormData) {
  const password = ((formData.get("password") as string | null) ?? "").trim();
  const next = safeNext(formData.get("next"));

  const granted = password ? await checkZamyslowPassword(password) : false;
  if (!granted) {
    redirect(`${ZAMYSLOW_GATE_PATH}?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await createZamyslowToken();
  if (!token) {
    // Brak ZAMYSLOW_GATE_PASSWORD - bramka nieskonfigurowana.
    redirect(`${ZAMYSLOW_GATE_PATH}?error=config&next=${encodeURIComponent(next)}`);
  }

  const store = await cookies();
  store.set(ZAMYSLOW_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ZAMYSLOW_ACCESS_MAX_AGE,
  });

  redirect(next);
}
