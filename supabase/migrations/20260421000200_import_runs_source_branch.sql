-- Śledzimy źródłową gałąź (developerka / posrednictwo / finansowanie / unknown)
-- na poziomie pojedynczego runu importera, żeby potem łatwo odnaleźć np.
-- "ostatni import deweloperki" albo audytować, skąd wjechała dana oferta.
alter table public.import_runs
  add column if not exists source_branch text default 'unknown';

create index if not exists import_runs_source_branch_idx
  on public.import_runs(source_branch);
