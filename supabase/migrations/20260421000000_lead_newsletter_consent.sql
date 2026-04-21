-- Add newsletter consent flag for lead capture / GetResponse list building.
alter table public.lead_submissions
  add column if not exists newsletter_consent boolean not null default false;

