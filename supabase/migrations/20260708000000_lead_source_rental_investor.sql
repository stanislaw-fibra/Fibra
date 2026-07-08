-- Dopuszczamy źródła leadów, które są już w unii TS (src/app/api/leads/route.ts),
-- ale nie były w CHECK na kolumnie source:
--   - rental_zamyslow  (formularz na /wynajem-zamyslow)
--   - investor_zamyslow (formularz inwestorski /zamyslow)
-- Bez tego INSERT leci na "lead_submissions_source_check" i lead nie zapisuje się.
-- Podmieniamy istniejący CHECK (jeśli jest), tak jak w migracji b2b_page.

do $$
declare
  v_constraint text;
begin
  select c.conname
    into v_constraint
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.relname = 'lead_submissions'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%source%';

  if v_constraint is not null then
    execute format('alter table public.lead_submissions drop constraint %I', v_constraint);
  end if;
end$$;

alter table public.lead_submissions
  add constraint lead_submissions_source_check
  check (source in (
    'offer_page',
    'offer_page_mini',
    'contact_page',
    'sprzedaj_page',
    'home_form',
    'newsletter_footer',
    'b2b_page',
    'rental_zamyslow',
    'investor_zamyslow'
  ));
