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

/**
 * Krok 1 resetu: użytkownik podaje e-mail na /panel/reset-password, my prosimy
 * Supabase o wysłanie maila z linkiem. Sam link (i jego wygląd) konfiguruje
 * szablon „Reset password" w dashboardzie - patrz supabase/email-templates/.
 *
 * Świadomie NIE zdradzamy, czy konto istnieje (ochrona przed enumeracją): bez
 * względu na wynik pokazujemy ten sam ekran „sprawdź skrzynkę".
 */
export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(`/panel/reset-password?error=${encodeURIComponent("Podaj adres e-mail.")}`);
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    // Logujemy, ale nie pokazujemy użytkownikowi (nie zdradzamy istnienia konta).
    console.error("[panel] resetPasswordForEmail:", error.message);
  }
  redirect("/panel/reset-password?sent=1");
}

/**
 * Krok 3 resetu: użytkownik ma już sesję recovery (ustawioną przez
 * /panel/reset-password/confirm) i ustawia nowe hasło. Po sukcesie ląduje
 * w panelu - sesja recovery jest pełnoprawną sesją.
 */
export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect(
      `/panel/reset-password/ustaw?error=${encodeURIComponent("Hasło musi mieć co najmniej 8 znaków.")}`,
    );
  }
  if (password !== confirm) {
    redirect(
      `/panel/reset-password/ustaw?error=${encodeURIComponent("Hasła nie są takie same.")}`,
    );
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/panel/reset-password?error=${encodeURIComponent("Link wygasł lub jest nieprawidłowy. Poproś o nowy.")}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/panel/reset-password/ustaw?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/panel/oferty");
}
