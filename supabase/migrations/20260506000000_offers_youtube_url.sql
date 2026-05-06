-- offers.youtube_url
-- Edytowalny w panelu admina link do YouTube. Klient prosił, żeby dla dłuższych
-- prezentacji zamiast wgrywać duży plik na Cloudflare wystarczyło wkleić link YT,
-- który zostanie wyświetlony w sekcji „Film prezentacyjny" na stronie oferty.
-- Backwards-compat: jeśli pusty, fallback na `raw_params.wideo` z importu Galactiki.

begin;

alter table public.offers
  add column if not exists youtube_url text;

commit;
