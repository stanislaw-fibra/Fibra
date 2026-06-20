-- Kliknięcia w przyciski CTA na stronie kursu "20 Lekcji Inwestora".
-- Nasza wewnętrzna analityka zaangażowania - zapisujemy KAŻDY klik niezależnie
-- od zgody marketingowej (to first-party, bez danych osobowych). Zgoda dotyczy
-- tylko wysyłki zdarzeń do Meta (piksel/CAPI), nie tego logu.
--
-- kind:
--   'interest'    - klik zachęty kotwiczącej do sekcji zamówienia (#zamow),
--   'add_to_cart' - klik realnego przycisku zakupu (przekierowanie do Imkera).

create table if not exists public.cta_clicks (
  id uuid primary key default gen_random_uuid(),
  page text not null default 'kurs-20-lekcji-inwestora',
  section text not null,        -- hero | solution | program | free_lesson | order | final | sticky
  kind text not null,           -- interest | add_to_cart
  url text,
  user_agent text,
  ip_hash text,                 -- hash IP z solą (LEAD_IP_SALT), bez surowego IP
  created_at timestamptz not null default now()
);

create index if not exists cta_clicks_created_idx on public.cta_clicks (created_at);
create index if not exists cta_clicks_section_idx on public.cta_clicks (section, kind);

-- RLS jak przy lead_submissions/course_access: brak publicznych policy => zapis i
-- odczyt tylko przez service role (endpoint server-side). Przeglądarka nie ma dostępu.
alter table public.cta_clicks enable row level security;
