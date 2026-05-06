-- Seed: wpisanie obecnych biogramów / ról / flagi widoczności dla 3 osób
-- pokazywanych na stronie /o-fibrze (Bartosz Nosiadek, Justyna Polok, Arkadiusz Jezusek).
--
-- Bez tego seeda panel /panel/zespol miałby puste pola tekstu (kolumna `bio_long` była NULL),
-- a admin musiałby ręcznie przeklejać teksty z hardkodowanego fallbacka. Po tej migracji
-- treść jest w bazie i edytowalna z panelu — dokładnie zgodnie z prośbą klienta:
-- „ten tekst który jest aktualnie na tej stronie powinien być wpisany na supabase".
--
-- UPDATE-only (bez INSERT) — gdy agentów jeszcze nie ma w `agents`, seed po prostu nic
-- nie zrobi. Dodanie agenta to osobna ręczna czynność (klucze obce w `offers`).

begin;

update public.agents
set
  bio_long = coalesce(bio_long, $$Wierzę, że w nieruchomościach – bardziej niż w jakiejkolwiek innej branży – liczy się człowiek i przejrzyste zasady. Tworząc Fibrę przyjąłem prostą dewizę: interesy robi się z ludźmi, a nie na ludziach.

Dziś, po 20 latach na rynku, z dumą patrzę na osiedla, które wybudowaliśmy i setki rodzin, którym pomogliśmy znaleźć ich miejsce na ziemi. Jako praktyk i autor książki „Zarabianie uczciwych pieniędzy", dbam o to, by każdy etap naszej współpracy – od budowy, przez finansowanie, aż po zarządzanie najmem – opierał się na fundamencie zaufania.

Fibra to nie tylko deweloper czy biuro nieruchomości. To zespół specjalistów, którzy biorą pełną odpowiedzialność za Twój komfort i bezpieczeństwo finansowe. Zapraszam Cię do poznania nas bliżej — chociażby przez pryzmat naszych wideo-prezentacji.$$),
  team_role = coalesce(nullif(team_role, ''), 'Założyciel, Prezes Zarządu'),
  team_order = case when team_order = 100 or team_order is null then 0 else team_order end,
  is_team_visible = true
where lower(name) = lower('Bartosz Nosiadek');

update public.agents
set
  bio_long = coalesce(bio_long, $$Z branżą nieruchomości i finansów jestem związana od 15 lat. Jako licencjonowany pośrednik i ekspert od kredytów hipotecznych, przeprowadzam moich klientów przez cały proces zakupu i finansowania – bez stresu i „drobnego druczku". Na Osiedlu Zamysłów dbam o bezpieczeństwo wynajmu i spokój właścicieli, zarządzając mieszkaniami od strony formalnej i technicznej. Stawiam na konkret, uczciwość i relacje, bo wierzę, że profesjonalna współpraca nie musi być wyłącznie formalna.

Zapraszam do kontaktu.$$),
  team_role = coalesce(nullif(team_role, ''), 'Licencjonowany Pośrednik i Ekspert Kredytowy'),
  team_order = case when team_order = 100 or team_order is null then 10 else team_order end,
  is_team_visible = true
where lower(name) = lower('Justyna Polok');

update public.agents
set
  bio_long = coalesce(bio_long, $$Od 9 lat skutecznie łączę świat sprzedaży, najmu i inwestycji. Jako agent 360° nie tylko znajduję nieruchomości, ale pomagam zamieniać metry kwadratowe w realny, stabilny dochód dla moich klientów.

Na Osiedlu Zamysłów odpowiadam za cały cykl życia nieruchomości: od doradztwa przy zakupie mieszkania, po jego późniejszy wynajem i pełną obsługę najemców. Wspieram inwestorów w budowaniu zyskownych portfeli, stawiając na relacje i umiejętność słuchania potrzeb. Moim celem jest Twój zysk i bezpieczeństwo – od kawalerek po hale i magazyny.

Zapraszam do współpracy.$$),
  team_role = coalesce(nullif(team_role, ''), 'Agent Nieruchomości | Specjalista ds. Inwestycji'),
  team_order = case when team_order = 100 or team_order is null then 20 else team_order end,
  is_team_visible = true
where lower(name) = lower('Arkadiusz Jezusek');

commit;
