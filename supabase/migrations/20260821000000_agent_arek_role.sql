-- Nowy tytuł Arkadiusza Jezuska - jeden na cały serwis.
--
-- Decyzja klienta (08.2026): Arek ma mieć ten sam tytuł wszędzie, gdzie
-- pojawia się na stronie (zespół na /o-fibrze, /agent/arek, Osiedle Zamysłów,
-- wynajem, kontakt przy ofertach). Wcześniej rozjeżdżało się to na trzy wersje.
--
-- Prawdą dla stron publicznych jest kolumna `agents.team_role` - dopóki ta
-- migracja nie pójdzie na produkcję, strona nadal pokazuje stary tytuł z bazy
-- (fallback w kodzie, `AREK_ROLE` w `src/lib/team-defaults.ts`, wchodzi tylko
-- wtedy, gdy w bazie jest pusto).
--
-- Nadpisujemy WYŁĄCZNIE znany stary tytuł (albo pustą wartość), więc migracja
-- jest idempotentna i nie skasuje tytułu wpisanego ręcznie w /panel/zespol.

begin;

update public.agents
set team_role = 'Specjalista ds. inwestycji deweloperskich i zarządzania najmem'
where lower(name) = lower('Arkadiusz Jezusek')
  and (
    team_role is null
    or btrim(team_role) = ''
    or btrim(team_role) = 'Agent Nieruchomości | Specjalista ds. Inwestycji'
  );

commit;
