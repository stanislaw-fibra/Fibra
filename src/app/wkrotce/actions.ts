"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkSiteGatePassword,
  createSiteGateToken,
  safeSiteGateNext,
  SITE_GATE_COOKIE,
  SITE_GATE_MAX_AGE,
  SITE_GATE_PATH,
} from "@/lib/site-gate";

export async function siteGateAction(formData: FormData) {
  const password = ((formData.get("password") as string | null) ?? "").trim();
  const next = safeSiteGateNext(formData.get("next"));

  const granted = password ? await checkSiteGatePassword(password) : false;
  if (!granted) {
    redirect(`${SITE_GATE_PATH}?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await createSiteGateToken();
  if (!token) {
    // Brak ZAMYSLOW_GATE_PASSWORD - bramka nieskonfigurowana.
    redirect(`${SITE_GATE_PATH}?error=config&next=${encodeURIComponent(next)}`);
  }

  const store = await cookies();
  store.set(SITE_GATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SITE_GATE_MAX_AGE,
  });

  redirect(next);
}
