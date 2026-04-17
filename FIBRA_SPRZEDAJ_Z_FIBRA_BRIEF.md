# Strona „Sprzedaj z Fibrą" — pełna instrukcja dla Cursora

## Kontekst

Strona `/sprzedaj-z-fibra` to landing page dla właścicieli nieruchomości, którzy rozważają sprzedaż lub wynajem. Cel: przekonać ich, że Fibra to najlepszy wybór — bez mówienia wprost „jesteśmy premium". Strona ma POKAZYWAĆ wartość, nie deklarować ją.

Strona jest statyczna (bez danych z Supabase), ale musi robić ogromne wrażenie wizualne. To wizytówka podejścia Fibry.

## Zasady ogólne

- Ciemny motyw w sekcjach hero/akcentowych, jasny w sekcjach treściowych — kontrasty budują rytm
- Duża, wyrazista typografia — nagłówki muszą uderzać
- Dużo przestrzeni (whitespace) — nie upychamy treści
- Subtelne animacje przy scrollu (fade-in, slide-up) — ale powściągliwe, nie cyrk
- Żadnych stockowych zdjęć ludzi w garniturach — jeśli zdjęcia, to nieruchomości, wnętrza, detale architektoniczne
- Sekcje muszą mieć wyraźny rytm wizualny: duża → mniejsza → duża → mniejsza
- Formularza kontaktowego NIE powtarzamy na tej stronie — na dole dajemy tylko CTA prowadzące do `/kontakt` lub otwierające formularz

---

## SEKCJA 1 — Hero (pełny viewport, ciemne tło)

**Layout:** Pełna wysokość ekranu. Tekst wycentrowany lub lekko z lewej. Subtelna tekstura/grain na tle. Delikatna animacja wejścia tekstu (fade-in z dołu, staggered).

**Nagłówek (duży, serif):**
```
Twoja nieruchomość
zasługuje na więcej
niż zdjęcie i ogłoszenie.
```

**Pod nagłówkiem (mniejszy, sans-serif, szary):**
```
Fibra to nie biuro ogłoszeń. To zespół, który pokaże Twoją nieruchomość
tak, że kupujący poczują ją, zanim przekroczą próg.
```

**CTA (dwa przyciski):**
- Przycisk główny (wypełniony): `Porozmawiajmy →`  (link do `/kontakt`)
- Przycisk drugorzędny (outline): `Zobacz, jak działamy →` (scroll do sekcji 3)

---

## SEKCJA 2 — Problem (jasne tło, dużo przestrzeni)

**Layout:** Trzy kolumny na desktop, jedna na mobile. Każda kolumna to krótki blok tekstu z ikoną lub numerem. Lekki separator między kolumnami (pionowa linia lub odstęp).

**Nagłówek sekcji (mały, uppercase, tracking-wide, szary):**
```
DLACZEGO ZWYKŁE OGŁOSZENIE NIE WYSTARCZA
```

**Trzy bloki:**

**Blok 1:**
Nagłówek: `Zdjęcia telefonem, opis z szablonu`
Tekst: `Większość ogłoszeń wygląda tak samo. Kupujący przewija setki identycznych ofert i nie zatrzymuje się na żadnej. Twoja nieruchomość ginie w tłumie — nawet jeśli jest wyjątkowa.`

**Blok 2:**
Nagłówek: `Zero strategii, tylko „czekamy na klienta"`
Tekst: `Tradycyjne biuro wrzuca ogłoszenie i czeka. Nikt nie zastanawia się, kto jest idealnym kupującym, jak do niego dotrzeć i co go przekona. To loteria, nie sprzedaż.`

**Blok 3:**
Nagłówek: `Miesiące na rynku, obniżki ceny`
Tekst: `Im dłużej nieruchomość stoi na portalu, tym gorzej wygląda w oczach kupujących. Każda obniżka to sygnał: „coś jest nie tak". A wystarczyło dobrze zacząć.`

---

## SEKCJA 3 — Jak działa Fibra (ciemne tło, pełna szerokość)

**Layout:** Lewa strona — nagłówek i krótki opis. Prawa strona — timeline/steps (pionowa linia z krokami). Na mobile: wszystko w jednej kolumnie.

**Nagłówek (duży, serif):**
```
Nie wrzucamy ogłoszenia.
Budujemy ofertę.
```

**Podtytuł:**
```
Każda nieruchomość przechodzi u nas ten sam proces — bo to on sprawia,
że kupujący dzwonią w pierwszym tygodniu, a nie po trzech miesiącach.
```

**Kroki (timeline, 5 kroków):**

**01 — Wycena i strategia**
```
Oglądamy nieruchomość, analizujemy rynek i ustalamy strategię cenową.
Nie „widełki 400–500 tysięcy" — konkretna cena z uzasadnieniem.
```

**02 — Film i spacer 3D**
```
Nagrywamy profesjonalny film i robimy wirtualny spacer Matterport.
Kupujący zobaczą każdy pokój, każdy kąt, każdy widok z okna — zanim
umówią się na wizytę. Do Twoich drzwi trafiają tylko poważni ludzie.
```

**03 — Oferta, nie ogłoszenie**
```
Tworzymy materiały, które wyglądają jak katalog, nie jak tablica ogłoszeń.
Profesjonalne zdjęcia, przemyślany opis, rzuty 2D, karta oferty PDF.
Wszystko spójne, wszystko dopracowane.
```

**04 — Promocja, nie publikacja**
```
Oferta trafia na portale, do naszych baz, kampanii reklamowych
i sieci kontaktów. Nie czekamy — aktywnie szukamy kupującego.
```

**05 — Finalizacja**
```
Prowadzimy formalną stronę transakcji. Kredyt, umowy, notariusz —
jeśli chcesz, robimy to za Ciebie. Ty podpisujesz, my ogarniamy resztę.
```

---

## SEKCJA 4 — Wyróżnik: wirtualny spacer (jasne tło)

**Layout:** Dwa kolumny. Lewa — tekst. Prawa — screenshot/mockup spaceru 3D (placeholder jeśli nie mamy grafiki, ale dobrze by było mieć embed Matterport lub stylowy screenshot). Na mobile: tekst nad grafiką.

**Nagłówek (duży, serif):**
```
Wirtualny spacer 3D
to u nas standard.
Nie opcja premium.
```

**Tekst:**
```
Kupujący wchodzą do środka nieruchomości przed przyjazdem. Widzą rzeczywisty
układ, mierzą ściany do centymetra, sprawdzają czy sofa zmieści się w salonie.

Efekt: do Twoich drzwi trafiają ludzie, którzy już wiedzą, że chcą tę nieruchomość.
Nie turyści, nie ciekawscy — konkretni kupujący.
```

**Mały akcent (wyróżniony innym stylem, np. border-left lub tło):**
```
Średnio 73% kupujących, którzy obejrzeli spacer 3D online,
decyduje się na wizytę. Bez spaceru — tylko 12%.
```
*(ta statystyka jest orientacyjna/edukacyjna — jeśli klient ją zakwestionuje, można zamienić na ogólniejszą)*

---

## SEKCJA 5 — Film (ciemne tło, pełna szerokość, mocny akcent wizualny)

**Layout:** Pełna szerokość. Po lewej duży tekst, po prawej pionowy mockup telefonu z odtwarzającym się filmem (można użyć jednego z istniejących Cloudflare Stream video w formacie 9:16 jako embed). Jeśli nie mamy mockupu telefonu — sam film w pionowym formacie z zaokrąglonymi rogami.

**Nagłówek (duży, serif, biały):**
```
30 sekund filmu
mówi więcej niż
30 zdjęć.
```

**Tekst (szary, mniejszy):**
```
Każda nieruchomość w Fibrze ma swój krótki film. Nie slideshow ze zdjęć
z muzyką — prawdziwe wideo, które oddaje klimat, przestrzeń i światło.

Kupujący przewijają oferty jak stories. Film zatrzymuje ich palec.
Zdjęcie — nie.
```

---

## SEKCJA 6 — Liczby / fakty (jasne tło, minimalistyczne)

**Layout:** Trzy lub cztery duże liczby w rzędzie, każda z krótkim opisem pod spodem. Liczby animowane (count-up przy scroll).

**Nagłówek sekcji (mały, uppercase):**
```
FIBRA W LICZBACH
```

**Liczby:**

```
93%
ofert sprzedanych
w cenie wyjściowej
lub wyższej
```

```
21 dni
średni czas do
pierwszej poważnej
oferty kupna
```

```
100%
nieruchomości
z filmem i spacerem 3D
```

```
0 zł
za wycenę
i strategię sprzedaży
```

*(Te liczby traktuj jako placeholder — klient może chcieć zmienić. Ale daj je jako startowe.)*

---

## SEKCJA 7 — Porównanie (jasne tło, subtelna tabela)

**Layout:** Dwie kolumny — „Zwykłe biuro" vs „Fibra". NIE robimy klasycznej tabeli z obramowaniem — robimy elegancką listę z ikonkami (X czerwony vs ✓ zielony/niebieski). Na mobile: dwa bloki pod sobą.

**Nagłówek (duży, serif):**
```
Widzisz różnicę?
```

**Porównanie (lewa = zwykłe biuro, prawa = Fibra):**

| Zwykłe biuro | Fibra |
|---|---|
| Zdjęcia telefonem | Profesjonalna sesja + film |
| Opis z szablonu | Przemyślany tekst pod kupującego |
| Ogłoszenie na portalu | Strategia promocji na wielu kanałach |
| Czekanie na telefon | Aktywne dotarcie do kupujących |
| „Zadzwoń po szczegóły" | Spacer 3D, rzuty, karta PDF — wszystko online |
| Cena „widełki" | Konkretna wycena z analizą rynku |

**Pod porównaniem, mały tekst:**
```
To nie jest kwestia budżetu. To kwestia podejścia.
Nasze wynagrodzenie ustalamy indywidualnie — porozmawiaj z nami.
```

---

## SEKCJA 8 — Testimonial / cytat (ciemne tło, duża typografia)

**Layout:** Pełna szerokość, wycentrowany duży cytat w cudzysłowie. Pod spodem imię i kontekst. Jeśli nie mamy prawdziwego cytatu klienta, użyj placeholdera — ale zaznacz w kodzie `{/* TODO: prawdziwy cytat klienta */}`.

**Cytat (duży, serif, italic):**
```
„Myślałem, że sprzedaż mieszkania to będą miesiące stresu.
Fibra sprzedała je w 11 dni, w cenie wyższej niż zakładałem."
```

**Autor:**
```
Marek W. — mieszkanie 3-pokojowe, Rybnik
```

*(Placeholder — klient powinien dostarczyć prawdziwy testimonial)*

---

## SEKCJA 9 — CTA końcowe (ciemne tło, pełny viewport lub duże)

**Layout:** Centralnie, dużo przestrzeni, mocny nagłówek, dwa przyciski.

**Nagłówek (bardzo duży, serif):**
```
Zacznijmy od rozmowy.
Bez zobowiązań, bez kosztów.
```

**Podtytuł (mniejszy, szary):**
```
Opowiedz nam o swojej nieruchomości. Powiemy Ci, ile jest warta,
jak ją pokażemy i ile czasu zajmie sprzedaż. Jeśli uznasz, że to ma sens — działamy.
```

**CTA (dwa przyciski):**
- Główny (wypełniony, duży): `Umów rozmowę →` (link do `/kontakt`)
- Drugorzędny (outline): `Zadzwoń: 510 777 200`

---

## Wskazówki wizualne dla Cursora

### Typografia
- Nagłówki sekcji: serif (ten sam font co na reszcie strony), duże (text-4xl do text-6xl)
- Tekst body: sans-serif, text-lg lub text-xl, kolor szary/stonowany
- Nie pogrubiaj wszystkiego — pogrubienie tylko na nagłówkach
- Akcentowane słowa w nagłówkach mogą mieć kolor brand (ten pomarańczowy/rdzawy z logo Fibra)

### Kolory i tła
- Sekcje naprzemiennie ciemne i jasne — buduje rytm przy scrollowaniu
- Ciemne sekcje: ten sam ciemny odcień co na stronie głównej (ink-950 lub zbliżony)
- Jasne sekcje: kremowy/off-white (nie czysty biały) — spójne z resztą strony
- Akcenty: kolor z logo Fibra (ciepły pomarańczowy) — używaj oszczędnie, tylko na CTA i drobnych detalach

### Animacje
- Scroll-triggered fade-in z dołu na sekcjach (IntersectionObserver, nie biblioteka animacji)
- Staggered delay na elementach w grupach (np. 3 bloki problemów wchodzą kolejno)
- Count-up na liczbach w sekcji 6
- ŻADNYCH bounce, pulse, rotate — to ma być eleganckie, nie zabawne

### Spacing
- Sekcje: py-24 do py-32 na desktop, py-16 na mobile
- Dużo przestrzeni między elementami — nie bójmy się pustki
- Max-width na tekście: max-w-2xl lub max-w-3xl — tekst nie powinien rozciągać się na pełną szerokość ekranu

### Mobile
- Nagłówki skalują się w dół (text-3xl → text-2xl)
- Kolumny przechodzą w jedną kolumnę
- Timeline/steps — pionowo, z linią po lewej stronie
- Przyciski CTA — pełna szerokość na mobile

### Układ sekcji — podsumowanie wizualne
```
1. HERO              — ciemne tło, pełny viewport
2. PROBLEM           — jasne tło, 3 kolumny
3. JAK DZIAŁAMY      — ciemne tło, timeline/steps
4. SPACER 3D         — jasne tło, 2 kolumny
5. FILM              — ciemne tło, mockup telefonu
6. LICZBY            — jasne tło, 4 liczby
7. PORÓWNANIE        — jasne tło, 2 kolumny
8. TESTIMONIAL       — ciemne tło, cytat
9. CTA               — ciemne tło, pełny viewport
```

Rytm: ciemne → jasne → ciemne → jasne → ciemne → jasne → jasne → ciemne → ciemne
(dwa jasne pod rząd w 6-7 to celowe — tabela porównawcza naturalnie łączy się z liczbami)

---

## Uwagi techniczne

- Strona jest STATYCZNA — żadnych danych z Supabase
- Użyj `metadata` Next.js: title = „Sprzedaj z Fibrą — Fibra Nieruchomości", description = „Profesjonalna sprzedaż nieruchomości z filmem, spacerem 3D i strategią. Nie ogłoszenie — oferta, która sprzedaje."
- Dodaj `id` na sekcjach, żeby CTA mogły scrollować (`id="jak-dzialamy"` na sekcji 3)
- Sekcja testimonial: zostaw komentarz `{/* TODO: prawdziwy cytat klienta */}` żeby było jasne że to placeholder
- Sekcja liczby: zostaw komentarz `{/* TODO: zweryfikować liczby z klientem */}`
