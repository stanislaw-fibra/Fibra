-- Public read access for floorplans of active offers.
-- Agents/admin writes use service role and are not affected.

begin;

alter table public.offer_floorplans enable row level security;

drop policy if exists "public read floorplans for active offers" on public.offer_floorplans;
create policy "public read floorplans for active offers"
on public.offer_floorplans
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.offers o
    where o.id = offer_floorplans.offer_id
      and o.is_active = true
  )
);

commit;

