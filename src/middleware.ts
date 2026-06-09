import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { KURS_ACCESS_COOKIE, verifyAccessToken } from "@/lib/kurs-access";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---- Bramka portalu kursu (/kurs) ----
  // Uwaga: matcher celuje w "/kurs" i "/kurs/...", więc landing
  // "/kurs-20-lekcji-inwestora" tu NIE trafia (inny prefiks).
  if (pathname === "/kurs" || pathname.startsWith("/kurs/")) {
    // Miniatury lekcji (/public/kurs/lekcje) muszą być publiczne - używamy ich
    // m.in. na landing page (sekcja darmowej lekcji). Nie chowamy ich za bramką.
    if (pathname.startsWith("/kurs/lekcje/")) {
      return NextResponse.next();
    }
    if (pathname === "/kurs/login") {
      return NextResponse.next();
    }
    const token = request.cookies.get(KURS_ACCESS_COOKIE)?.value;
    if (await verifyAccessToken(token)) {
      return NextResponse.next();
    }
    const redirect = new URL("/kurs/login", request.url);
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  // ---- Panel ----
  if (!pathname.startsWith("/panel")) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        supabaseResponse = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = request.nextUrl.pathname === "/panel/login";

  if (!user && !isLogin) {
    const redirect = new URL("/panel/login", request.url);
    redirect.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && isLogin) {
    return NextResponse.redirect(new URL("/panel/oferty", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/panel/:path*", "/kurs", "/kurs/:path*"],
};
