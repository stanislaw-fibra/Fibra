/**
 * Bramka „Premiera strony już wkrótce" - wersja przejściowa do publicznego startu.
 *
 * Chowa CAŁĄ stronę za jednym, wspólnym hasłem. Świadomie reużywa mechanizmu
 * bramki Zamysłowa: to samo podpisane cookie i ten sam sekret
 * `ZAMYSLOW_GATE_PASSWORD` (już skonfigurowany na Vercelu) - jeden sekret, zero
 * nowej konfiguracji. Kto poda hasło raz, ma dostęp do całej strony.
 *
 * Wyjątki (`isOpenPath`) - dostępne BEZ hasła, żeby ścieżka zakupu i obsługi
 * kursu działała normalnie jeszcze przed publicznym startem:
 *  - /kurs (portal + login) oraz /kurs-20-lekcji-inwestora (strona sprzedaży),
 *  - strony prawne (polityka prywatności, regulamin, cookies),
 *  - /panel (własne logowanie), /api (webhooki, leady, cron), sama bramka /wkrotce.
 *
 * PO PUBLICZNYM STARCIE: usunąć blok bramki w `src/middleware.ts` (oznaczony
 * komentarzem) - bramka Zamysłowa zostaje, bo to osobny projekt w przygotowaniu.
 */

export {
  ZAMYSLOW_ACCESS_COOKIE as SITE_GATE_COOKIE,
  ZAMYSLOW_ACCESS_MAX_AGE as SITE_GATE_MAX_AGE,
  verifyZamyslowToken as verifySiteGateToken,
  createZamyslowToken as createSiteGateToken,
  checkZamyslowPassword as checkSiteGatePassword,
} from "./zamyslow-gate";

/** Ścieżka bramki (sama nie jest chroniona - tu wpisuje się hasło). */
export const SITE_GATE_PATH = "/wkrotce";

/**
 * Prefiksy dostępne BEZ hasła nawet przy aktywnej bramce „wkrótce".
 * Reszta strony jest schowana.
 */
const OPEN_PREFIXES = [
  "/wkrotce",
  "/kurs", // portal kursu + /kurs/login (ma własną bramkę dostępu)
  "/kurs-20-lekcji-inwestora", // strona sprzedaży kursu
  "/panel", // panel zarządzania (własne logowanie)
  "/polityka-prywatnosci",
  "/regulamin",
  "/cookies",
  "/api", // webhooki (Imker), leady, cron - nie wolno chować
] as const;

/** Czy ścieżka jest dostępna bez hasła bramki „wkrótce". */
export function isOpenPath(pathname: string): boolean {
  return OPEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Bezpieczny cel przekierowania po wpisaniu hasła - tylko wewnętrzne ścieżki
 * (chroni przed open redirect). Bramka i ścieżki spoza witryny → na stronę główną.
 */
export function safeSiteGateNext(value: unknown): string {
  const s = typeof value === "string" ? value : "";
  if (!s.startsWith("/") || s.startsWith("//")) return "/";
  if (s === SITE_GATE_PATH || s.startsWith(`${SITE_GATE_PATH}/`)) return "/";
  return s;
}
