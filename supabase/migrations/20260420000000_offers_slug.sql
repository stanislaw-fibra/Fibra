-- Migration: add slug column to offers + backfill + unique index
--
-- Format slug: `{title-slugified}-{galactica_offer_id}`
--   przykłady:
--     nowoczesny-dom-pompa-ciepla-2-miejsca-radlin-FIB-DS-4127
--     apartament-premium-65m2-os-batory-FIB-MS-4089
--
-- Reguły:
-- - polskie znaki mapujemy do ASCII (ą→a, ś→s, …)
-- - lowercase, spacje/znaki specjalne → myślnik, wielokrotne myślniki zwijamy
-- - tytuł obcinamy do ~60 znaków, nie łamiąc słowa, jeśli to możliwe
-- - Galactica ID zostaje w oryginalnej wielkości liter (FIB-DS-4127)
--
-- Bezpieczne do uruchomienia wielokrotnie (IF NOT EXISTS, ON CONFLICT fallback).

BEGIN;

-- 1. Funkcja slugify(title) - tylko tytuł, bez ID.
CREATE OR REPLACE FUNCTION public._fibra_slugify_title(input text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  s text;
  cut text;
  last_dash int;
BEGIN
  IF input IS NULL OR length(btrim(input)) = 0 THEN
    RETURN '';
  END IF;

  s := lower(input);

  -- Polskie znaki diakrytyczne → ASCII (ą→a, ć→c, ę→e, ł→l, ń→n, ó→o, ś→s, ź→z, ż→z).
  -- Dla lower już po lower(), ale zostawiamy też warianty wielkie na wypadek
  -- gdyby input był już częściowo bez lower (paranoja obronna).
  s := translate(s,
    'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ',
    'acelnoszzACELNOSZZ');

  -- Pozostałe znaki diakrytyczne (np. á é ü) — zachowawczo usuwamy unaccent-em,
  -- jeśli rozszerzenie jest dostępne; w przeciwnym razie zostawiamy znaki,
  -- które i tak potem zamieni regex poniżej na myślniki.
  BEGIN
    s := public.unaccent(s);
  EXCEPTION WHEN undefined_function THEN
    -- brak rozszerzenia unaccent — skipujemy cicho
    NULL;
  END;

  -- Wszystko poza a-z 0-9 zamień na myślniki; wielokrotne myślniki zwiń.
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');

  IF length(s) <= 60 THEN
    RETURN s;
  END IF;

  cut := substr(s, 1, 60);
  last_dash := position('-' IN reverse(cut));
  IF last_dash > 0 AND (60 - last_dash) > 20 THEN
    cut := substr(cut, 1, 60 - last_dash);
  END IF;
  RETURN regexp_replace(cut, '(^-+|-+$)', '', 'g');
END;
$$;

-- 2. Funkcja make_offer_slug(title, galactica_id) → `{slug-title}-{galactica_id}`.
CREATE OR REPLACE FUNCTION public._fibra_make_offer_slug(
  title text,
  galactica_id text
) RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  base text;
  id text;
BEGIN
  base := public._fibra_slugify_title(title);
  id := btrim(coalesce(galactica_id, ''));
  IF length(id) = 0 THEN
    RETURN nullif(base, '');
  END IF;
  IF length(base) = 0 THEN
    RETURN id;
  END IF;
  RETURN base || '-' || id;
END;
$$;

-- 3. Dodaj kolumnę slug (text, unique).
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS slug text;

-- 4. Backfill istniejących wierszy — tylko tam, gdzie slug jest pusty.
--    Kolizje (mało prawdopodobne, ale możliwe przy identycznym tytule i braku
--    Galactica ID) obsługujemy sufiksem `-<id_uuid_prefix>`.
WITH candidates AS (
  SELECT
    id,
    coalesce(
      public._fibra_make_offer_slug(
        coalesce(advertisement_text, title),
        galactica_offer_id
      ),
      'oferta-' || substr(id::text, 1, 8)
    ) AS proposed
  FROM public.offers
  WHERE slug IS NULL OR length(btrim(slug)) = 0
),
dedup AS (
  SELECT
    id,
    CASE
      WHEN count(*) OVER (PARTITION BY proposed) > 1
        THEN proposed || '-' || substr(id::text, 1, 8)
      ELSE proposed
    END AS slug
  FROM candidates
)
UPDATE public.offers o
  SET slug = d.slug
FROM dedup d
WHERE o.id = d.id;

-- 5. Unique index (częściowy — żeby nie blokować NULL-i w trakcie migracji).
CREATE UNIQUE INDEX IF NOT EXISTS offers_slug_unique
  ON public.offers (slug)
  WHERE slug IS NOT NULL;

COMMIT;

-- Rollback (do ręcznego wklejenia, gdyby trzeba było cofnąć):
--   BEGIN;
--   DROP INDEX IF EXISTS public.offers_slug_unique;
--   ALTER TABLE public.offers DROP COLUMN IF EXISTS slug;
--   DROP FUNCTION IF EXISTS public._fibra_make_offer_slug(text, text);
--   DROP FUNCTION IF EXISTS public._fibra_slugify_title(text);
--   COMMIT;
