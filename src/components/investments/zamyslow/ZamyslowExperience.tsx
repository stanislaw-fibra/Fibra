import { getZamyslowUnitStatuses } from "@/lib/investments/zamyslow-units";
import { ZamyslowBuilding } from "./ZamyslowBuilding";

/**
 * Eksplorator budynku (wizualizacja → rzut piętra → oferta lokalu).
 *
 * Sam eksplorator jest komponentem klienckim, ale statusy i ceny lokali muszą
 * pochodzić z arkusza Arka - więc pobieramy je tutaj, po stronie serwera, i
 * wstrzykujemy w dół. `fetch` arkusza jest współdzielony (ISR 300 s), więc
 * dwa wywołania na jednej stronie nie kosztują dwóch requestów.
 */
export async function ZamyslowExperience() {
  const statuses = await getZamyslowUnitStatuses();
  return <ZamyslowBuilding statuses={statuses} />;
}
