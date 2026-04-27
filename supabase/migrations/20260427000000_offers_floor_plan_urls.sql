-- Explicit floor plan media URLs managed in admin.
-- - floor_plan_image_url: direct image URL (opens in modal)
-- - floor_plan_pdf_url: direct PDF URL (opens in new tab)

begin;

alter table public.offers
  add column if not exists floor_plan_image_url text,
  add column if not exists floor_plan_pdf_url text;

create index if not exists offers_floor_plan_image_url_idx on public.offers (floor_plan_image_url);
create index if not exists offers_floor_plan_pdf_url_idx on public.offers (floor_plan_pdf_url);

commit;

