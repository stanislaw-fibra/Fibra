/**
 * Moment publicznego otwarcia stron projektu „Zamysłów" - jedno źródło prawdy
 * dla bramki i licznika.
 *
 * Do tej chwili strony inwestycji widzą tylko osoby z pierwszeństwem zakupu
 * (hasło dostępu). Po niej bramka zdejmuje się AUTOMATYCZNIE:
 *  - `src/middleware.ts` przepuszcza ruch na /zamyslow i pokrewne bez hasła,
 *  - licznik na `/zamyslow-dostep` dochodzi do zera, a sama bramka
 *    przekierowuje odwiedzającego na stronę inwestycji.
 *
 * Zero crona, zero ręcznej akcji o godzinie otwarcia. Żeby zmienić termin -
 * popraw datę poniżej i zrób redeploy (stała jest „wpieczona" w build).
 * Gdyby w dev zmiana daty nie zadziałała od razu: `rm -rf .next` i restart
 * (Turbopack potrafi przytrzymać stary bundle middleware).
 *
 * Strefa: offset +02:00 = czas polski we wrześniu (CEST), więc timestamp jest
 * jednoznaczny niezależnie od strefy serwera/Vercela.
 */
export const ZAMYSLOW_LAUNCH_ISO = "2026-09-03T16:00:00+02:00";

/** Otwarcie jako epoch (ms) - tak porównujemy z `Date.now()`. */
export const ZAMYSLOW_LAUNCH_AT = Date.parse(ZAMYSLOW_LAUNCH_ISO);

/** Czy strony Zamysłowa są już publiczne (bramka powinna być zdjęta). */
export function isZamyslowLaunched(now: number = Date.now()): boolean {
  return now >= ZAMYSLOW_LAUNCH_AT;
}
