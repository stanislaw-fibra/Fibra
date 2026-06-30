import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// Krok 2 resetu: link z maila trafia tutaj z `token_hash`. Wymieniamy go na
// sesję (verifyOtp ustawia cookies) i przekierowujemy do formularza nowego
// hasła. token_hash zamiast PKCE `code` jest odporny na otwarcie maila w innej
// przeglądarce/urządzeniu niż to, z którego poproszono o reset.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Ścieżki błędu NIE ustawiają cookies, więc zwykły NextResponse.redirect wystarcza.
  const fail = (msg: string) =>
    NextResponse.redirect(
      new URL(`/panel/reset-password?error=${encodeURIComponent(msg)}`, origin),
    );

  if (!tokenHash || type !== "recovery") {
    return fail("Nieprawidłowy link resetu hasła.");
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  if (error) {
    return fail("Link wygasł lub został już użyty. Poproś o nowy.");
  }

  // Sukces: verifyOtp zapisał cookies sesji przez next/headers. Używamy redirect()
  // z next/navigation (a NIE NextResponse.redirect), bo tylko wtedy Next na pewno
  // dołączy te Set-Cookie do odpowiedzi przekierowania - inaczej /ustaw nie zobaczy
  // sesji i odeśle po nowy link. redirect() rzuca NEXT_REDIRECT - to celowe.
  redirect("/panel/reset-password/ustaw");
}
