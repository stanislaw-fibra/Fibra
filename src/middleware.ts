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
import { isZamyslowLaunched } from "@/lib/zamyslow-launch";
import {
  carryOverParams,
  LEGACY_HOSTS,
  legacyOfferFallback,
  legacyOfferId,
  legacyTarget,
  LEGACY_ZAMYSLOW_HOSTS,
  legacyZamyslowTarget,
  resolveLegacyOfferSlug,
} from "@/lib/legacy-redirect";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---- Stara domena fibranieruchomosci.pl -> fibra.pl ----
  // Po przestawieniu DNS-a starej domeny na Vercela cały jej ruch wchodzi tutaj.
  // Odsyłamy go trwale (301) na odpowiednik na fibra.pl: oferta idzie na swoją
  // podstronę (po numerze Galactiki z adresu), reszta na zmapowaną stronę albo
  // na katalog. Blok jest PRZED bramkami, żeby stary ruch nigdy nie zobaczył
  // ekranu z hasłem, i przed resztą middleware, bo dla tej domeny nic więcej
  // nie ma sensu.
  const host = request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";
  const isLegacyZamyslow = LEGACY_ZAMYSLOW_HOSTS.has(host);
  if (isLegacyZamyslow || LEGACY_HOSTS.has(host)) {
    let target: string | null;
    if (isLegacyZamyslow) {
      // Stara strona Zamysłowa - osobny serwis, własne nazwy podstron.
      target = legacyZamyslowTarget(pathname);
    } else {
      const offerId = legacyOfferId(pathname);
      target = legacyTarget(pathname);
      if (offerId) {
        const slug = await resolveLegacyOfferSlug(offerId);
        target = slug ? `/oferty/${slug}` : legacyOfferFallback(pathname);
      }
    }
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://fibra.pl";
    const destination = new URL(target ?? "/", base);
    carryOverParams(request.nextUrl.searchParams, destination);
    return NextResponse.redirect(destination, 301);
  }

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

  // ---- Bramka projektu „Zamysłów" (przedsprzedaż z pierwszeństwem) ----
  // Do publicznego otwarcia strony inwestycji są usunięte z menu i dostępne
  // tylko dla osób z pierwszeństwem zakupu - po wspólnym haśle
  // (ZAMYSLOW_GATE_PASSWORD).
  //
  // AUTO-ZDJĘCIE: po godzinie otwarcia (ZAMYSLOW_LAUNCH_AT) warunek gaśnie i cały
  // ruch przechodzi bez hasła - strony stają się publiczne same, bez crona.
  if (!isZamyslowLaunched() && isZamyslowGatedPath(pathname)) {
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

  const panelPath = request.nextUrl.pathname;
  const isLogin = panelPath === "/panel/login";
  // Trasy resetu hasła muszą być dostępne BEZ sesji: /confirm sam dopiero ustawia
  // sesję recovery, a formularz „podaj e-mail" siłą rzeczy odwiedza wylogowany.
  const isResetFlow =
    panelPath === "/panel/reset-password" || panelPath.startsWith("/panel/reset-password/");

  if (!user && !isLogin && !isResetFlow) {
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
