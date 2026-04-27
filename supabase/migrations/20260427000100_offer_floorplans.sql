-- Multiple floor plans per offer (images + PDFs).
-- We keep `offers.floor_plan_*_url` as "primary" for backward compatibility,
-- and store additional (or all) items in this table.

begin;

create table if not exists public.offer_floorplans (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  kind text not null check (kind in ('image', 'pdf')),
  label text,
  url text not null,
  storage_path text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists offer_floorplans_offer_id_idx on public.offer_floorplans(offer_id);
create index if not exists offer_floorplans_kind_idx on public.offer_floorplans(kind);
create index if not exists offer_floorplans_order_idx on public.offer_floorplans(offer_id, kind, order_index);

commit;

