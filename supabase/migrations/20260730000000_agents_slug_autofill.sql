-- Każdy agent dostaje swój publiczny link `fibra.pl/agent/<slug>` automatycznie.
--
-- Wcześniej slug wpisywaliśmy ręcznie (migracja 20260512000000_agents_slug.sql seedowała
-- tylko 3 osoby), więc nowe osoby - także te zakładane przez import z VIRGO - zostawały
-- bez linku. Tutaj: funkcja slugifikująca + trigger nadający slug przy INSERT/UPDATE
-- oraz backfill dla wpisów, które sluga jeszcze nie mają.
--
-- Kolejność kandydatów (identyczna z `src/lib/agent-slug.ts`):
--   1. samo imię              -> `justyna`
--   2. imię-nazwisko          -> `justyna-polok`   (gdy imię zajęte/zarezerwowane)
--   3. imię-2, imię-3, …      (ostateczność)
-- Istniejący slug NIGDY nie jest nadpisywany - raz wysłany klientowi link ma działać.

begin;

-- Slugifikacja z polskimi znakami: „Świenty-Szczyra" -> „swienty-szczyra".
create or replace function public.fibra_slugify(txt text)
returns text
language sql
immutable
as $$
  select btrim(
    regexp_replace(
      regexp_replace(
        lower(translate(coalesce(txt, ''), 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ')),
        '[^a-z0-9]+', '-', 'g'
      ),
      '(^-+|-+$)', '', 'g'
    )
  );
$$;

create or replace function public.agents_autofill_slug()
returns trigger
language plpgsql
as $$
declare
  reserved constant text[] := array['agent','agenci','api','kontakt','kurs','oferty','panel','zespol'];
  first_name text;
  full_name  text;
  base       text;
  candidate  text;
  n          int := 2;
begin
  -- Slug podany wprost (panel / ręczny SQL) - tylko normalizujemy wielkość liter.
  if new.slug is not null and btrim(new.slug) <> '' then
    new.slug := lower(btrim(new.slug));
    return new;
  end if;

  first_name := public.fibra_slugify(split_part(btrim(coalesce(new.name, '')), ' ', 1));
  full_name  := public.fibra_slugify(new.name);
  base       := coalesce(nullif(first_name, ''), nullif(full_name, ''));

  -- Agent bez nazwy (nie powinno się zdarzyć) - zostawiamy NULL, strona zwróci 404.
  if base is null then
    return new;
  end if;

  candidate := first_name;
  if candidate = '' or candidate = any(reserved) then
    candidate := full_name;
  end if;

  -- Zajęte? Najpierw imię-nazwisko, potem licznik.
  while exists (
    select 1 from public.agents a
    where a.slug = candidate and a.id is distinct from new.id
  ) loop
    if candidate <> full_name and full_name <> '' and n = 2 then
      candidate := full_name;
    else
      candidate := base || '-' || n::text;
      n := n + 1;
    end if;
    exit when n > 20;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists agents_autofill_slug_trg on public.agents;
create trigger agents_autofill_slug_trg
  before insert or update on public.agents
  for each row
  execute function public.agents_autofill_slug();

-- Backfill: wiersz po wierszu (osobne UPDATE-y), żeby trigger widział slugi nadane
-- przed chwilą i nie wygenerował dwa razy tego samego.
do $$
declare
  r record;
begin
  for r in select id from public.agents where slug is null or btrim(slug) = '' order by team_order nulls last, name loop
    update public.agents set slug = null where id = r.id;
  end loop;
end;
$$;

commit;
