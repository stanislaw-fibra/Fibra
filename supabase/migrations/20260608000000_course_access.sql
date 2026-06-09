-- Dostęp do kursu "20 Lekcji Inwestora".
-- Webhook z Imker/SalesCRM (status "Opłacone", produkt 21494) wpisuje tu kupującego.
-- Portal /kurs waliduje email kupującego względem tej tabeli (magic-link).

create table if not exists public.course_access (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product_id integer,
  order_identifier text,
  customer_name text,
  status text not null default 'paid',
  source text not null default 'imker',
  granted_at timestamptz not null default now(),
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Jeden rekord na email (kolejny zakup tym samym mailem aktualizuje wpis, nie duplikuje).
-- Email jest zawsze normalizowany do małych liter po stronie aplikacji przed zapisem,
-- więc zwykłe ograniczenie unikalności na kolumnie wystarcza (i działa z upsert onConflict).
alter table public.course_access
  add constraint course_access_email_key unique (email);

create index if not exists course_access_order_idx
  on public.course_access (order_identifier);

-- RLS jak przy lead_submissions: brak publicznych policy => dostęp tylko przez service role.
-- Anon (przeglądarka) nie może czytać ani pisać. Walidacja dostępu dzieje się server-side.
alter table public.course_access enable row level security;
