import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { KURS_ACCESS_COOKIE, verifyAccessToken } from "@/lib/kurs-access";
import {
  isZamyslowGatedPath,
  verifyZamyslowToken,
  ZAMYSLOW_ACCESS_COOKIE,
  ZAMYSLOW_GATE_PATH,
} from "@/lib/zamyslow-gate";
import {
  isOpenPath,
  SITE_GATE_COOKIE,
  SITE_GATE_PATH,
  verifySiteGateToken,
} from "@/lib/site-gate";
import { isLaunched } from "@/lib/site-launch";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---- Bramka „Premiera strony już wkrótce" (PRZEJŚCIOWA) ----
  // Chowa CAŁĄ stronę za wspólnym hasłem do publicznego startu. Wyjątki
  // (isOpenPath): kurs (sprzedaż/portal), strony prawne, panel, API, sama bramka.
  // PO PUBLICZNYM STARCIE: usuń ten jeden blok - reszta (kurs/panel/Zamysłów)
  // zostaje bez zmian. (Po dacie premiery blok i tak sam się dezaktywuje niżej.)
  //
  // AUTO-ZDJĘCIE: po godzinie premiery (SITE_LAUNCH_AT) bramka przepuszcza cały
  // ruch bez hasła - strona staje się publiczna sama, bez crona i ręcznej akcji.
  if (!isLaunched() && !isOpenPath(pathname)) {
    const token = request.cookies.get(SITE_GATE_COOKIE)?.value;
    if (!(await verifySiteGateToken(token))) {
      const redirect = new URL(SITE_GATE_PATH, request.url);
      redirect.searchParams.set("next", pathname);
      return NextResponse.redirect(redirect);
    }
    // Ma dostęp - puszczamy dalej (cała witryna pod tym samym hasłem).
    return NextResponse.next();
  }

  // ---- Bramka projektu „Zamysłów" ----
  // Strony projektu są usunięte z menu i dostępne tylko przez bezpośredni link,
  // a i tak najpierw trzeba podać wspólne hasło (ZAMYSLOW_GATE_PASSWORD).
  if (isZamyslowGatedPath(pathname)) {
    const token = request.cookies.get(ZAMYSLOW_ACCESS_COOKIE)?.value;
    if (await verifyZamyslowToken(token)) {
      return NextResponse.next();
    }
    const redirect = new URL(ZAMYSLOW_GATE_PATH, request.url);
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  // ---- Bramka portalu kursu (/kurs) ----
  // Uwaga: matcher celuje w "/kurs" i "/kurs/...", więc landing
  // "/kurs-20-lekcji-inwestora" tu NIE trafia (inny prefiks).
  if (pathname === "/kurs" || pathname.startsWith("/kurs/")) {
    // Statyczne pliki z /public/kurs (miniatury lekcji, okładki, np. .jpg/.webp)
    // muszą być publiczne - używamy ich na landing page (hero, darmowa lekcja).
    // Trasy portalu nie mają kropki w ostatnim segmencie, więc rozpoznajemy
    // asset po rozszerzeniu i nie chowamy go za bramką.
    if (/\.[a-z0-9]+$/i.test(pathname)) {
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
  // Bramka „wkrótce" chowa całą stronę, więc middleware musi działać na (prawie)
  // wszystkich trasach. Wykluczamy tylko: API (webhooki/leady/cron), zasoby
  // Next (_next) oraz pliki z rozszerzeniem (statyczne assety, robots.txt itd.).
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
