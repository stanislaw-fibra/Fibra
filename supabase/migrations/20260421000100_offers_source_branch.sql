-- Segmentacja ofert po gałęzi biznesowej Fibry.
-- Początkowa wartość 'unknown' — przy imporcie z Galactiki nie wiemy, z której gałęzi
-- (developerka / posrednictwo / finansowanie) pochodzi dana oferta. Reklasyfikacja
-- odbywa się później UPDATE-em, a importer nie nadpisuje już przypisanej wartości.
alter table public.offers
  add column if not exists source_branch text default 'unknown';

create index if not exists offers_source_branch_idx on public.offers(source_branch);
