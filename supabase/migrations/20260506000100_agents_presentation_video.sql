-- agents: dodanie pól pod wideo-prezentację na stronie /o-fibrze
-- - cloudflare_video_id  : ID krótkiego pionowego filmu (Cloudflare Stream)
-- - bio_long             : pełny, wielo-akapitowy opis na karcie
-- - team_role            : rola wyświetlana w karcie zespołu (np. „Założyciel, Prezes Zarządu")
-- - team_order           : kolejność na stronie /o-fibrze (mniejsze = wyżej / pierwszy)
-- - is_team_visible      : flaga pokazująca/ukrywająca osobę w sekcji „Zespół"
--
-- Strona /o-fibrze ma fallback: jeżeli `cloudflare_video_id` jest puste, wyświetlamy `photo_url`.
-- Klient prosi o intuicyjny panel, więc te pola są edytowalne w `/panel/zespol`.

begin;

alter table public.agents
  add column if not exists cloudflare_video_id text,
  add column if not exists bio_long text,
  add column if not exists team_role text,
  add column if not exists team_order int not null default 100,
  add column if not exists is_team_visible boolean not null default false;

create index if not exists agents_team_visible_order_idx
  on public.agents (is_team_visible, team_order)
  where is_team_visible = true;

-- RLS: pozwól anonowi czytać też nowe pola (publiczna strona /o-fibrze).
-- Polityki SELECT na agents już istnieją (is_active = true) — nowe kolumny będą widoczne automatycznie.

commit;
