# GetResponse — automatyzacja „streszczenie rysunkowe" (instrukcja dla webmastera)

## Cel
Po zapisie osoby **związanej z kursem** (zapis przez box w portalu kursu lub zakup
kursu ze zgodą marketingową) ma automatycznie pójść jeden mail z linkiem do
streszczenia rysunkowego książki. **Tylko do tych osób** — nie do całej listy.

Strona automatycznie nadaje takiej osobie w GetResponse tag **`zrodlo_kurs`**.
Twoje zadanie: zbudować automatyzację, która na ten tag wysyła poniższy mail.

## Co zbudować — Marketing Automation (workflow), NIE autoresponder „dzień 0"
W GetResponse → **Automation / Automatyzacja** → nowy workflow:

1. **Wyzwalacz (trigger):** „Tag" → **„Przypisano tag" (Tag assigned)** → tag: **`zrodlo_kurs`**
   - dokładnie taka nazwa, z podkreślnikiem (GetResponse nie przyjmuje myślników).
2. **Akcja:** „Wyślij wiadomość" (Send message) → utwórz nową wiadomość:
   - **Temat:** `Twoje streszczenie rysunkowe jest gotowe`
   - **Nadawca:** `FIBRA - Bartosz Nosiadek <kontakt@fibra.pl>`
   - **Treść:** wklej HTML z sekcji „HTML maila" poniżej (edytor → tryb HTML / „kod źródłowy").
3. **Zapisz i aktywuj** workflow.

## Zasady / ustawienia
- **Wyłącznie na tag `zrodlo_kurs`.** Nie wyzwalać na zapis do listy ani na inne tagi —
  inaczej mail poszedłby do osób spoza kursu.
- **Wyślij raz na kontakt** (nie wysyłaj wielokrotnie przy ponownym tagowaniu).
- **Bez opóźnienia** (mail od razu po nadaniu tagu) — albo maks. kilka minut, jak wolisz.
- Kontakty z tym tagiem żyją na liście **„GRUPA FIBRA"** (automatyzacja i tak wyzwala się
  po tagu, niezależnie od listy).
- **Przycisk „Pobierz streszczenie" prowadzi na `https://fibra.pl/api/materialy/sketchnotes`** —
  to stały link (sam regeneruje bezpieczny adres pliku). **Nie zmieniać.**
- **WAŻNE — click-tracking:** GetResponse domyślnie przepuszcza linki przez własną domenę
  śledzącą, którą część blokerów/VPN blokuje (mieliśmy taki przypadek). Żeby pobieranie
  działało wszystkim: albo ustaw **własną domenę śledzącą** w GetResponse (subdomena
  `fibra.pl`), albo **wyłącz śledzenie na tym jednym linku** w wiadomości.
- Tagi personalizacji w treści: `[[name]]` (imię), `[[remove]]` (wypisz), `[[update]]` (zmień dane) —
  zostawić, GetResponse je podstawia.

---

## HTML maila
Wklej całość w tryb HTML edytora wiadomości GetResponse:

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f7fa; margin:0; padding:0;">
<tbody><tr>
<td align="center" style="padding:24px 12px;">

<!-- Preheader (ukryty) -->
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#f5f7fa; font-size:1px; line-height:1px;">
  Twoje streszczenie rysunkowe książki jest gotowe do pobrania.
</div>

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; font-family:Helvetica, Arial, sans-serif;">

  <!-- LOGO -->
  <tbody><tr>
    <td style="padding:32px 48px 28px 48px;" align="center">
      <img src="https://us-ms.gr-cdn.com/getresponse-Jtgjw/photos/5db155aa-75e6-46e0-a2b4-e7bc036f6aac.png" alt="Fibra Nieruchomości" width="140" style="display:block; max-width:140px; height:auto; border:0;">
    </td>
  </tr>

  <!-- TREŚĆ -->
  <tr>
    <td style="padding:0 48px 40px 48px;">

      <p style="margin:0 0 24px 0; font-size:16px; line-height:1.75; color:#1A202C; font-family:Helvetica, Arial, sans-serif;">
        Cześć [[name]],
      </p>

      <p style="margin:0 0 24px 0; font-size:16px; line-height:1.75; color:#1A202C; font-family:Helvetica, Arial, sans-serif;">
        Dzięki, że zapisałeś się po streszczenie rysunkowe mojej książki „Zarabianie Uczciwych Pieniędzy". Zgodnie z obietnicą, masz je poniżej.
      </p>

      <p style="margin:0 0 28px 0; font-size:16px; line-height:1.75; color:#1A202C; font-family:Helvetica, Arial, sans-serif;">
        Zrobiłem je po to, żeby najważniejsze rzeczy z całej książki dało się złapać w kilkanaście minut. Zamiast ściany tekstu masz to w rysunkach: jak myśleć o pieniądzach, oszczędzaniu i inwestowaniu na spokojnie, po ludzku.
      </p>

      <!-- PRZYCISK -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
        <tbody><tr>
          <td align="center" bgcolor="#1A202C" style="border-radius:8px;">
            <a href="https://fibra.pl/api/materialy/sketchnotes" target="_blank" style="display:inline-block; padding:15px 34px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; font-family:Helvetica, Arial, sans-serif;">
              Pobierz streszczenie
            </a>
          </td>
        </tr>
      </tbody></table>

      <p style="margin:0 0 28px 0; font-size:16px; line-height:1.75; color:#1A202C; font-family:Helvetica, Arial, sans-serif;">
        To Twoja kopia, możesz wracać do niej, kiedy chcesz. Gdyby przycisk nie działał, wklej ten adres w przeglądarce: <a href="https://fibra.pl/api/materialy/sketchnotes" style="color:#1A202C;">fibra.pl/api/materialy/sketchnotes</a>.
      </p>

      <p style="margin:0 0 28px 0; font-size:16px; line-height:1.75; color:#1A202C; font-family:Helvetica, Arial, sans-serif;">
        W kolejnych mailach będę dzielił się konkretami z naszego osiedla: realnymi liczbami z wynajmu, tym jak wybierać mieszkania pod inwestycję i czego sam nauczyłem się przez 20 lat na rynku. Bez teorii oderwanej od życia, po prostu praktyka.
      </p>

      <p style="margin:0 0 32px 0; font-size:16px; line-height:1.75; color:#1A202C; font-family:Helvetica, Arial, sans-serif;">
        Na razie po prostu zajrzyj do streszczenia. Mam nadzieję, że wyciągniesz z niego coś dla siebie.
      </p>

      <p style="margin:0 0 28px 0; font-size:16px; line-height:1.75; color:#1A202C; font-family:Helvetica, Arial, sans-serif;">
        Pozdrawiam!
      </p>

      <!-- PODPIS ZE ZDJĘCIEM -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tbody><tr>
          <td style="padding-right:14px; vertical-align:top;">
            <img src="https://us-ms.gr-cdn.com/getresponse-Jtgjw/photos/25ee9cfa-2cf7-4e9a-aa95-2f1ee3a71b53.jpg" alt="Bartosz Nosiadek" width="56" height="56" style="display:block; width:56px; height:56px; border-radius:28px; object-fit:cover; border:0;">
          </td>
          <td style="vertical-align:middle;">
            <p style="margin:0 0 1px 0; font-size:15px; font-weight:700; color:#1A202C; font-family:Helvetica, Arial, sans-serif;">
              Bartosz Nosiadek
            </p>
            <p style="margin:0; font-size:13px; color:#718096; font-family:Helvetica, Arial, sans-serif;">
              Fibra Nieruchomości
            </p>
          </td>
        </tr>
      </tbody></table>

      <br>

      <p style="margin:0; font-size:15px; line-height:1.75; color:#718096; font-family:Helvetica, Arial, sans-serif;">
        P.S. Jak po lekturze będziesz miał pytania, po prostu odpisz na tego maila. Czytam i odpowiadam.
      </p>

    </td>
  </tr>

  <!-- STOPKA -->
  <tr>
    <td style="padding:20px 48px; border-top:1px solid #e2e8f0;">
      <p style="margin:0; font-size:11px; line-height:1.6; color:#a0aec0; font-family:Helvetica, Arial, sans-serif;">
        GRUPA FIBRA Sp. z o.o. · KRS 0000371040 · NIP 642-314-76-30<br>
        <a href="[[remove]]" style="color:#a0aec0; text-decoration:underline;">Wypisz się</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="[[update]]" style="color:#a0aec0; text-decoration:underline;">Zmień dane</a>
      </p>
    </td>
  </tr>

</tbody></table>

</td>
</tr>
</tbody></table>
```
