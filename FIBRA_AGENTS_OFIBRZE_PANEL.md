# FIBRA — Zdjęcia agentów, strona O Fibrze, przycisk odświeżania

## 1. Zdjęcia agentów na stronach ofert

### Co się zmieniło w Supabase
- Bucket `agent-photos` (public) z trzema zdjęciami
- Tabela `agents`: kolumna `photo_url` ma teraz URL-e dla Arkadiusza Jezuska i Justyny Polok

### Zadanie
Na stronie oferty (`/oferty/[slug]`) w sekcji kontaktowej, jeśli agent ma `photo_url`, wyświetl jego zdjęcie obok danych kontaktowych.

**Jak to ma wyglądać:**
- Okrągłe zdjęcie agenta (aspect-ratio 1:1, object-cover, border-radius pełny)
- Rozmiar: ~80px na desktop, ~60px na mobile
- Obok: imię i nazwisko, numer telefonu (klikalny), email
- Jeśli agent NIE ma zdjęcia → pokaż placeholder (inicjały na kolorowym tle, jak teraz prawdopodobnie jest)

**Na sticky barze na dole strony oferty:**
- Mała miniatura zdjęcia agenta (32-40px, okrągła) obok imienia i numeru
- To buduje zaufanie — kupujący widzi twarz osoby, do której dzwoni

### Skąd brać dane
Query `offers` z relacją `agents` (agent_id FK). Agent ma: name, email, phone_office, phone_mobile, photo_url.

---

## 2. Strona „O Fibrze" (`/o-fibrze`)

### Kontekst o firmie (na podstawie informacji publicznych)
- Bartosz Nosiadek — Prezes Zarządu, założyciel Grupy Fibra
- Firma działa od 2011 roku (KRS), siedziba: ul. Rymera 177, 44-310 Radlin
- Działalność: deweloperka (budowa osiedli mieszkaniowych) + pośrednictwo w obrocie nieruchomościami + zarządzanie najmem + pośrednictwo finansowe (kredyty)
- Wybudowali ponad 170 apartamentów w 7 budynkach (Osiedle Zamysłów w Rybniku)
- Biuro nieruchomości — jedno z największych w regionie, 9+ specjalistów, ponad 100 transakcji rocznie
- Dewiza firmy: „Interesy robimy z ludźmi, a nie na ludziach"
- Bartosz Nosiadek jest autorem książek: „Zarabianie Prawdziwych Pieniędzy" i „Zarabianie Uczciwych Pieniędzy"
- Fibra oferuje też zarządzanie najmem dla inwestorów

### Struktura strony

**SEKCJA 1 — Hero (jasne tło, eleganckie)**

Nagłówek:
```
Doświadczenie, któremu możesz zaufać.
```

Podtytuł:
```
Fibra to deweloper, biuro nieruchomości i doradca finansowy w jednym.
Działamy na Śląsku od 2011 roku.
```

**SEKCJA 2 — Co robimy (2-3 kolumny, ciemne tło)**

Trzy filary działalności:

Filar 1 — Deweloperka
```
Budujemy osiedla mieszkaniowe w regionie rybnickim.
Ponad 170 apartamentów w siedmiu budynkach.
Każda inwestycja pod klucz — od projektu po zarządzanie najmem.
```

Filar 2 — Pośrednictwo
```
Pomagamy w sprzedaży, kupnie i wynajmie nieruchomości.
Jedno z największych biur w regionie, ponad 100 transakcji rocznie.
```

Filar 3 — Finansowanie
```
Dobieramy kredyt hipoteczny dopasowany do Twojej sytuacji.
Bez dodatkowych kosztów — prowizję pokrywa bank.
```

**SEKCJA 3 — Zespół**

Nagłówek:
```
Ludzie Fibry
```

Podtytuł:
```
Za każdą ofertą, transakcją i rozmową stoi konkretna osoba.
```

Trzy karty (na razie, więcej w przyszłości):

**Karta 1 — Bartosz Nosiadek**
- Zdjęcie: `https://yrkvochsziertbvzbnol.supabase.co/storage/v1/object/public/agent-photos/Bartosz%20Nosiadek.jpg`
- Rola: Założyciel, Prezes Zarządu
- Krótki opis: `Założył Fibrę w 2011 roku. Od ponad dekady buduje osiedla i prowadzi jedno z największych biur nieruchomości na Śląsku. Autor książek o inwestowaniu w nieruchomości.`
- Kontakt: 510 777 200

**Karta 2 — Arkadiusz Jezusek**
- Zdjęcie: z tabeli agents (photo_url) lub hardcoded URL
- Rola: Agent ds. sprzedaży
- Krótki opis: `Specjalista ds. sprzedaży nieruchomości deweloperskich. Przeprowadzi Cię przez cały proces — od pierwszego oglądania po podpisanie aktu notarialnego.`
- Kontakt: 881 431 800

**Karta 3 — Justyna Polok**
- Zdjęcie: z tabeli agents (photo_url) lub hardcoded URL
- Rola: Agent ds. wynajmu
- Krótki opis: `Zajmuje się wynajmem długoterminowym. Pomoże znaleźć najemcę i przeprowadzi wszystkie formalności.`
- Kontakt: 795 133 380

**Jak mają wyglądać karty:**
- Duże zdjęcie (nie okrągłe — prostokątne, portrait, zaokrąglone rogi)
- Pod zdjęciem: imię i nazwisko (duże), rola (mniejsze, szare), opis (normalny tekst), telefon (klikalny)
- Na desktop: 3 karty w rzędzie
- Na mobile: karty jedna pod drugą lub karuzela
- Styl: spójny z resztą strony — premium, dużo przestrzeni, elegancka typografia

**SEKCJA 4 — Motto / wartości (ciemne tło, duży tekst)**

```
„Interesy robimy z ludźmi, a nie na ludziach."
```

Pod spodem:
```
To nie slogan. To zasada, według której prowadzimy każdą rozmowę,
każdą transakcję i każdą inwestycję od ponad dekady.
```

**SEKCJA 5 — CTA**

```
Chcesz porozmawiać?
510 777 200 · biuro@grupafibra.pl
```

Przycisk: `Umów rozmowę →` (link do /kontakt)

### Uwagi techniczne
- Strona statyczna, bez danych z Supabase (na start)
- Docelowo karty agentów mogą ciągnąć dane z tabeli `agents` — ale na razie hardcoded jest OK
- Komentarz w kodzie: `{/* TODO: docelowo karty zespołu z tabeli agents */}`
- metadata: title = „O Fibrze — Fibra Nieruchomości", description odpowiedni
- Roman wspomniał, że chce na tej stronie krótkie VIDEO agentów (pionowe, autoprezentacja) — na razie nie buduj tego, ale zostaw miejsce w kartach na przyszły embed video. Komentarz: `{/* TODO: video autoprezentacja agenta */}`

---

## 3. Przycisk „Odśwież oferty" w panelu

### Zadanie
W panelu (`/panel/oferty` lub w layoucie panelu) dodaj przycisk „Odśwież oferty z Galactiki".

**Jak ma działać:**
1. Klik → wywołanie `POST /api/import?skipImages=1` z IMPORT_SECRET (lub sesją admina)
2. Pokaż loading spinner z tekstem „Importuję oferty..."
3. Po zakończeniu pokaż wynik: „Zaktualizowano X ofert, Y nowych, Z usuniętych"
4. Jeśli błąd — pokaż komunikat

**Gdzie umieścić:**
- Na liście ofert w panelu, obok przycisku „Dodaj ofertę"
- Mały przycisk, nie dominujący — to nie jest główna akcja, to narzędzie

**Zabezpieczenie:**
- Wywołanie API route wymaga autoryzacji (sesja zalogowanego admina LUB IMPORT_SECRET)
- Debounce — nie pozwól klikać częściej niż raz na 30 sekund

---

## 4. Zmiany w Supabase — podsumowanie

### Już zrobione
- [x] Bucket `agent-photos` (public) — 3 zdjęcia uploadowane
- [x] `photo_url` w tabeli `agents` — uzupełnione dla Arka i Justyny

### Do zrobienia (Cursor)
- [ ] Frontend: wyświetlanie `photo_url` agenta na stronie oferty
- [ ] Frontend: strona `/o-fibrze` z zespołem
- [ ] Panel: przycisk „Odśwież oferty"
- [ ] Panel: `/panel/agenci` — CRUD agentów z uploadem zdjęć (faza 2, nie musi być teraz)

### Na przyszłość
- Kolumna `source_branch` w `offers` (deweloperskie / posrednictwo) — jak Galaktyka doda drugi oddział
- Kolumna `role` w `agents` (np. „Agent ds. sprzedaży", „Agent ds. wynajmu", „Prezes Zarządu")
- Kolumna `bio` w `agents` — krótki opis (już istnieje w schemacie, tylko pusta)
- Bartosz Nosiadek — dodaj do `agents` z flagą `is_active = true` ale z osobną rolą (np. „Prezes Zarządu"), żeby mógł się wyświetlać na stronie O Fibrze z danych, nie hardcoded
