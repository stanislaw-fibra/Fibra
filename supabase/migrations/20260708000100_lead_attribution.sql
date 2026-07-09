-- Atrybucja marketingowa leadów: gclid (Google Ads click id, do offline
-- conversion import) oraz utm_source/medium/campaign (kanał widoczny w CRM).
-- Kolumny opcjonalne - stare leady zostają z NULL, formularze zaczną je
-- wypełniać, gdy w URL wejścia będą odpowiednie parametry.
--
-- WAŻNE: tę migrację trzeba zastosować na bazie PRZED wdrożeniem kodu, który
-- wstawia te kolumny - inaczej INSERT poleci na "column does not exist" i
-- zepsuje WSZYSTKIE formularze.

alter table public.lead_submissions
  add column if not exists gclid text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;
