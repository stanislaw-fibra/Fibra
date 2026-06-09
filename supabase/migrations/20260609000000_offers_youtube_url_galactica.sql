-- offers.youtube_url_galactica
-- Punkt odniesienia dla reconciliacji linku YouTube. Model: Galactica jest źródłem prawdy,
-- ale ręczna zmiana w panelu trzyma się tak długo, jak długo Galactica nie zmieni TEGO pola.
--
-- `youtube_url`            = wartość efektywna (to, co widać na www; ręczna albo z Galactiki),
-- `youtube_url_galactica`  = ostatnia wartość, jaką przysłała Galactica (punkt odniesienia).
--
-- Import porównuje nową wartość z Galactiki z `youtube_url_galactica`:
--  - różni się  → Galactica zmieniła/usunęła link → nadpisuje `youtube_url` (ręczna zmiana znika),
--  - taka sama  → zostawia `youtube_url` bez zmian (zachowuje ewentualną ręczną zmianę).

begin;

alter table public.offers
  add column if not exists youtube_url_galactica text;

-- Backfill punktu odniesienia z raw_params (te same klucze co pickYoutubeUrl: wideo/video/film/youtube,
-- wartość musi wyglądać jak link YouTube - zawiera "youtu").
update public.offers
set youtube_url_galactica = coalesce(
    nullif(case when raw_params->>'wideo'   ilike '%youtu%' then btrim(raw_params->>'wideo')   end, ''),
    nullif(case when raw_params->>'video'   ilike '%youtu%' then btrim(raw_params->>'video')   end, ''),
    nullif(case when raw_params->>'film'    ilike '%youtu%' then btrim(raw_params->>'film')    end, ''),
    nullif(case when raw_params->>'youtube' ilike '%youtu%' then btrim(raw_params->>'youtube') end, '')
  )
where youtube_url_galactica is null;

-- Zachowaj obecne zachowanie publiczne: tam gdzie nie ma ręcznej wartości w `youtube_url`,
-- ustaw efektywny link na wartość z Galactiki (wcześniej brało się to z fallbacku do raw_params,
-- który po tej zmianie znika z logiki czytania).
update public.offers
set youtube_url = youtube_url_galactica
where (youtube_url is null or btrim(youtube_url) = '')
  and youtube_url_galactica is not null;

commit;
