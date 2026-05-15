-- Slug agenta dla publicznej podstrony `/agent/<slug>` i jako shortcut filtra na /oferty.
-- Bartosz prosił o "konkretne rozszerzenie, łatwe do wpisania i zapamiętania" — używamy
-- samego imienia (lowercase, bez polskich znaków). Agent będzie mógł wysłać klientowi
-- np. `fibranieruchomosci.pl/agent/justyna` i klient od razu zobaczy auto-prezentację
-- + listę ofert tego agenta.

begin;

-- 1) Kolumna slug — unikalna, ale NULLable, żeby migracja przeszła nawet jeśli
--    w `agents` są wpisy które nie pasują do żadnego seed-pattern poniżej.
--    Następnie seedujemy dla 3 znanych agentów. Admin może dodać slug ręcznie
--    przez panel dla nowych agentów (UI w /panel/zespol, dodam w kolejnym kroku).
alter table public.agents
  add column if not exists slug text;

create unique index if not exists agents_slug_idx
  on public.agents (slug)
  where slug is not null;

-- 2) Seed — slugi dla obecnego zespołu. UPDATE-only (gdy agent jeszcze nie istnieje,
--    nic się nie dzieje — admin doda slug ręcznie po wstawieniu wpisu).
update public.agents set slug = 'bartosz'  where lower(name) = lower('Bartosz Nosiadek')   and slug is null;
update public.agents set slug = 'justyna'  where lower(name) = lower('Justyna Polok')      and slug is null;
update public.agents set slug = 'arek'     where lower(name) = lower('Arkadiusz Jezusek')  and slug is null;

commit;
