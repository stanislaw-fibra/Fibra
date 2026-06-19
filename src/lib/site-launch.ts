/**
 * Moment publicznej premiery strony - jedno źródło prawdy dla bramki i licznika.
 *
 * Po tej chwili bramka „Premiera już wkrótce" zdejmuje się AUTOMATYCZNIE:
 *  - `src/middleware.ts` przepuszcza wtedy cały ruch (bez hasła),
 *  - licznik na `/wkrotce` dochodzi do zera i wpuszcza odwiedzającego na stronę.
 *
 * Zero crona, zero ręcznej akcji o godzinie premiery. Żeby zmienić termin -
 * popraw datę poniżej i zrób redeploy (stała jest „wpieczona" w build).
 *
 * Strefa: zapis z offsetem +02:00 = czas polski w czerwcu (CEST). Dzięki temu
 * timestamp jest jednoznaczny niezależnie od strefy serwera/Vercela.
 */
export const SITE_LAUNCH_ISO = "2026-06-26T18:30:00+02:00";

/** Premiera jako epoch (ms) - tak porównujemy z `Date.now()`. */
export const SITE_LAUNCH_AT = Date.parse(SITE_LAUNCH_ISO);

/** Czy premiera już nastąpiła (bramka powinna być zdjęta). */
export function isLaunched(now: number = Date.now()): boolean {
  return now >= SITE_LAUNCH_AT;
}
