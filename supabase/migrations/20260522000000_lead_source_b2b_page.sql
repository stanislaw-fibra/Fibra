-- Pozwalamy na nowe źródło leadów: b2b_page (podstrona /dla-firm).
-- Jeżeli tabela lead_submissions ma CHECK na kolumnę source, podmieniamy go;
-- jeżeli nie ma, kod TS i tak dopuszcza tylko zdefiniowany union.

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
    'b2b_page'
  ));
