"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/panel/oferty");

  if (!email || !password) {
    redirect(`/panel/login?error=${encodeURIComponent("Uzupełnij e-mail i hasło.")}`);
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/panel/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next.startsWith("/panel") ? next : "/panel/oferty");
}

export async function logoutAction() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/panel/login");
}
