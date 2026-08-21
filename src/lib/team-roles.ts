/**
 * Tytuły zespołu - osobny, malutki moduł, bo te stałe wędrują też do
 * komponentów klienckich (stopka Zamysłowa, paski kontaktu, wynajem).
 * `team-defaults.ts` obok ciągnie za sobą pełne biografie i nie ma po co
 * lądować w bundlu przeglądarki tylko dla jednego napisu.
 */

/**
 * Tytuł Arka - JEDNA stała na cały serwis.
 *
 * Decyzja klienta (08.2026): Arek ma jeden tytuł wszędzie, gdzie pojawia się na
 * stronie (zespół, strona agenta, Osiedle Zamysłów, wynajem, kontakt przy
 * ofertach). Wcześniej /wynajem-zamyslow mówiło „Specjalista ds. zarządzania
 * najmem", a reszta serwisu „Agent Nieruchomości | Specjalista ds. Inwestycji".
 *
 * UWAGA: prawdą dla stron publicznych jest kolumna `team_role` w Supabase.
 * Ta stała jest fallbackiem i wartością startową panelu; zmianę na produkcji
 * robi migracja `20260821000000_agent_arek_role.sql` albo edycja w /panel/zespol.
 */
export const AREK_ROLE = "Specjalista ds. inwestycji deweloperskich i zarządzania najmem";
