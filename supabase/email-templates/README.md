# Reset hasła do panelu — konfiguracja Supabase

Reset hasła ma trzy elementy: ustawienia URL w Supabase (1), szablon maila (2)
i działającą trasę w aplikacji (3, już w kodzie). Punkty 1 i 2 robi się **ręcznie
w dashboardzie Supabase** — nie da się ich zmienić z kodu.

## 1. URL Configuration (naprawia „localhost:3000")

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://fibra.pl`
  (to stąd bierze się `{{ .SiteURL }}` w mailu i tu wracał link; dotąd było `http://localhost:3000`)
- **Redirect URLs** — dodaj (każdy w osobnej linii):
  - `https://fibra.pl/**`
  - `https://fibra-nieruchomosci.vercel.app/**` (preview na Vercelu, jeśli używasz)
  - `http://localhost:3000/**` (zostaw, żeby reset działał też lokalnie w dev)

## 2. Szablon maila „Reset Password"

Dashboard → **Authentication → Emails → Reset password**:

- **Subject**: `Resetowanie hasła do panelu Fibra`
- **Body** (zakładka *Source*): wklej całą zawartość pliku
  [`reset-password.html`](./reset-password.html) z tego katalogu.

Szablon celowo wygląda jak pozostałe maile Fibry (ten sam układ co `emailShell`
w `src/lib/email/render.ts`). Link w przycisku **nie** używa domyślnego
`{{ .ConfirmationURL }}` — buduje pewny adres na naszą trasę z `{{ .TokenHash }}`:

```
{{ .SiteURL }}/panel/reset-password/confirm?token_hash={{ .TokenHash }}&type=recovery
```

Dzięki temu link działa tak samo niezależnie od tego, czy reset uruchomiono
z dashboardu (Users → „Send password recovery"), czy przez „Nie pamiętasz hasła?"
na `/panel/login`.

## 3. Trasa w aplikacji (już zrobione w kodzie)

- `GET /panel/reset-password/confirm` — wymienia `token_hash` na sesję (`verifyOtp`)
  i przekierowuje do formularza.
- `/panel/reset-password/ustaw` — formularz ustawienia nowego hasła (`updateUser`).
- `/panel/reset-password` — formularz „podaj e-mail" (self-service z ekranu logowania).

Wszystkie trzy są wyłączone z wymogu sesji w `src/middleware.ts` i spod bramki
„wkrótce" (prefiks `/panel` jest open path).

## (Opcjonalnie) Spójna wysyłka przez Resend

Maile auth (w tym reset) domyślnie wychodzą z systemowego SMTP Supabase, który
ma niski limit i nadawcę spoza fibra.pl. Żeby reset wychodził z tej samej domeny
co reszta maili, w **Authentication → Emails → SMTP Settings** włącz custom SMTP
i wpisz dane SMTP Resend (host `smtp.resend.com`, port 465, user `resend`,
hasło = `RESEND_API_KEY`, nadawca na zweryfikowanej domenie `fibra.pl`).
