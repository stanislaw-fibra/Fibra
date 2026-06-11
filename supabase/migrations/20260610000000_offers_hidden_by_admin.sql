-- Ręczne wygaszanie ofert, które trzyma się mimo importu.
--
-- Problem: Galactica wrzuca na jeden FTP eksport z DWÓCH oddziałów (GRUPA FIBRA + Fibra
-- Deweloperskie) bez żadnego pola rozróżniającego, a różnice (roznica) nigdy nie niosą
-- usunięć. Skutek: oferty sprzedane/wycofane/z drugiego oddziału nie mają jak zniknąć i
-- narastają. Nie da się ich odfiltrować automatycznie (brak markera w danych).
--
-- Rozwiązanie: admin może ręcznie „wygasić" ofertę. Flaga `hidden_by_admin` sprawia, że
-- importer NIE przywróci jej z powrotem (patrz src/lib/importer/offer-sync.ts), a mimo to
-- pozostałe pola (cena, opis itd.) dalej się aktualizują z Galactiki. „Przywróć" zdejmuje
-- flagę i ustawia is_active = true.
alter table public.offers
  add column if not exists hidden_by_admin boolean not null default false;

comment on column public.offers.hidden_by_admin is
  'TRUE = oferta ręcznie wygaszona w panelu. Import nie przywraca is_active dla takich ofert. „Przywróć" zdejmuje flagę.';

-- Indeks pomocniczy pod ewentualne filtrowanie/raporty.
create index if not exists offers_hidden_by_admin_idx
  on public.offers (hidden_by_admin)
  where hidden_by_admin = true;
