/** Treść polityki prywatności - źródło: FIBRA_PRAWNE_COOKIES_CURSOR.md */
import {
  LegalBulletItem,
  LegalBulletList,
  LegalCallout,
  LegalPageHeader,
  LegalSection,
  LegalSubBlock,
} from "./LegalPagePrimitives";

export const LEGAL_LAST_UPDATED = "17 kwietnia 2026 r.";

export function PrivacyPolicyContent() {
  return (
    <>
      <LegalPageHeader eyebrow="Ochrona danych" title="Polityka prywatności" updated={LEGAL_LAST_UPDATED} />

      <div className="space-y-10 md:space-y-14">
        <LegalSection id="administrator" title="1. Administrator danych">
          <p>Administratorem danych osobowych zbieranych za pośrednictwem serwisu fibranieruchomosci.pl jest:</p>
          <LegalCallout>
            <p className="font-semibold text-ink-950">GRUPA FIBRA Sp. z o.o.</p>
            <p className="mt-3 text-ink-700">
              ul. Józefa Rymera 177, 44-310 Radlin
              <br />
              E-mail:{" "}
              <a href="mailto:biuro@grupafibra.pl" className="font-medium">
                biuro@grupafibra.pl
              </a>
              <br />
              Telefon:{" "}
              <a href="tel:+48510777200" className="font-medium">
                510 777 200
              </a>
            </p>
          </LegalCallout>
        </LegalSection>

        <LegalSection id="jakie-dane" title="2. Jakie dane zbieramy i dlaczego">
          <p>
            Zbieramy dane osobowe wyłącznie w zakresie niezbędnym do świadczenia naszych usług. Poniżej wskazujemy
            kategorie danych, cele i podstawy prawne przetwarzania.
          </p>
          <div className="space-y-4">
            <LegalSubBlock label="a) Formularz kontaktowy i zapytania o oferty">
              <p>
                <span className="text-ink-500">Zakres:</span> imię, telefon lub adres e-mail, treść wiadomości,
                opcjonalnie informacja o rodzaju zapytania (sprzedaż, kupno, wynajem).
              </p>
              <p>
                <span className="text-ink-500">Cel:</span> odpowiedź na zapytanie, kontakt zwrotny, przedstawienie
                oferty.
              </p>
              <p>
                <span className="text-ink-500">Podstawa prawna:</span> art. 6 ust. 1 lit. b) RODO (podjęcie działań na
                żądanie osoby przed zawarciem umowy) oraz art. 6 ust. 1 lit. f) RODO (prawnie uzasadniony interes
                administratora - obsługa zapytań).
              </p>
            </LegalSubBlock>
            <LegalSubBlock label="b) Przeglądanie ofert i korzystanie z serwisu">
              <p>
                <span className="text-ink-500">Zakres:</span> adres IP, typ przeglądarki, system operacyjny, dane o
                sposobie korzystania z serwisu (strony odwiedzone, czas wizyty).
              </p>
              <p>
                <span className="text-ink-500">Cel:</span> zapewnienie prawidłowego działania serwisu, analiza ruchu,
                optymalizacja treści.
              </p>
              <p>
                <span className="text-ink-500">Podstawa prawna:</span> art. 6 ust. 1 lit. f) RODO (prawnie uzasadniony
                interes - utrzymanie i rozwój serwisu).
              </p>
            </LegalSubBlock>
            <LegalSubBlock label="c) Newsletter">
              <p>
                <span className="text-ink-500">Zakres:</span> adres e-mail.
              </p>
              <p>
                <span className="text-ink-500">Cel:</span> wysyłka newslettera z ofertami i informacjami o rynku
                nieruchomości.
              </p>
              <p>
                <span className="text-ink-500">Podstawa prawna:</span> art. 6 ust. 1 lit. a) RODO (zgoda). Zgodę można
                wycofać w każdej chwili - link do rezygnacji znajduje się w każdym e-mailu.
              </p>
            </LegalSubBlock>
            <LegalSubBlock label="d) Panel administracyjny (agenci)">
              <p>
                <span className="text-ink-500">Zakres:</span> adres e-mail, hasło (zaszyfrowane).
              </p>
              <p>
                <span className="text-ink-500">Cel:</span> dostęp do panelu zarządzania ofertami.
              </p>
              <p>
                <span className="text-ink-500">Podstawa prawna:</span> art. 6 ust. 1 lit. b) RODO (wykonanie umowy /
                świadczenie usługi).
              </p>
            </LegalSubBlock>
          </div>
        </LegalSection>

        <LegalSection id="odbiorcy" title="3. Komu przekazujemy dane">
          <p>Dane osobowe mogą być przekazywane następującym kategoriom odbiorców:</p>
          <LegalBulletList>
            <LegalBulletItem>
              <strong className="text-ink-900">Supabase Inc.</strong> (baza danych i uwierzytelnianie) - serwery w Unii
              Europejskiej (region EU West, Irlandia). Supabase przetwarza dane na podstawie standardowych klauzul
              umownych.
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">Vercel Inc.</strong> (hosting serwisu) - serwery na terenie UE i USA.
              Vercel przetwarza dane na podstawie Data Processing Addendum zgodnego z RODO.
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">Cloudflare Inc.</strong> (hosting i dostarczanie materiałów wideo) -
              globalna sieć CDN. Cloudflare przetwarza dane na podstawie standardowych klauzul umownych.
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">GetResponse S.A.</strong> (obsługa newslettera) - siedziba w Polsce, dane
              przetwarzane na terenie EOG.
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">Google LLC</strong> (Google Analytics - analiza ruchu) - dane
              zanonimizowane, przetwarzane na podstawie zgody użytkownika.
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">Meta Platforms Inc.</strong> (Facebook Pixel - analiza kampanii
              reklamowych) - dane zanonimizowane, przetwarzane na podstawie zgody użytkownika.
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">Organy administracji publicznej</strong> - w zakresie wynikającym z
              obowiązujących przepisów prawa.
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">Podmioty świadczące usługi księgowe i prawne</strong> na rzecz
              Administratora - na podstawie odrębnych umów powierzenia przetwarzania danych.
            </LegalBulletItem>
          </LegalBulletList>
          <p>
            Dane osobowe nie są przekazywane do państw trzecich spoza Europejskiego Obszaru Gospodarczego, z wyjątkiem
            przypadków wskazanych powyżej (Vercel, Cloudflare, Google, Meta), gdzie transfer odbywa się na podstawie
            standardowych klauzul umownych lub decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony.
          </p>
        </LegalSection>

        <LegalSection id="retencja" title="4. Jak długo przechowujemy dane">
          <LegalBulletList>
            <LegalBulletItem>
              Dane z formularzy kontaktowych: do czasu zakończenia obsługi zapytania, a następnie przez okres
              przedawnienia roszczeń (3 lata).
            </LegalBulletItem>
            <LegalBulletItem>Dane z newslettera: do momentu wycofania zgody.</LegalBulletItem>
            <LegalBulletItem>
              Dane analityczne (Google Analytics): zgodnie z polityką retencji Google (standardowo 14 miesięcy).
            </LegalBulletItem>
            <LegalBulletItem>Dane w panelu administracyjnym: przez okres korzystania z konta.</LegalBulletItem>
          </LegalBulletList>
        </LegalSection>

        <LegalSection id="prawa" title="5. Twoje prawa">
          <p>Przysługuje Ci prawo do:</p>
          <LegalBulletList>
            <LegalBulletItem>
              <strong className="text-ink-900">dostępu</strong> do swoich danych osobowych,
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">sprostowania</strong> nieprawidłowych danych,
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">usunięcia</strong> danych (&quot;prawo do bycia zapomnianym&quot;),
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">ograniczenia</strong> przetwarzania,
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">przenoszenia</strong> danych,
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">sprzeciwu</strong> wobec przetwarzania opartego na prawnie uzasadnionym
              interesie,
            </LegalBulletItem>
            <LegalBulletItem>
              <strong className="text-ink-900">wycofania zgody</strong> w dowolnym momencie (bez wpływu na zgodność z
              prawem przetwarzania przed wycofaniem).
            </LegalBulletItem>
          </LegalBulletList>
          <p>
            Aby skorzystać z powyższych praw, skontaktuj się z nami:{" "}
            <a href="mailto:biuro@grupafibra.pl" className="font-medium">
              biuro@grupafibra.pl
            </a>
          </p>
          <p>
            Masz również prawo wniesienia skargi do organu nadzorczego - Prezesa Urzędu Ochrony Danych Osobowych (ul.
            Stawki 2, 00-193 Warszawa).
          </p>
        </LegalSection>

        <LegalSection id="bezpieczenstwo" title="6. Bezpieczeństwo danych">
          <p>Stosujemy odpowiednie środki techniczne i organizacyjne, w tym:</p>
          <LegalBulletList>
            <LegalBulletItem>szyfrowanie połączeń (certyfikat SSL/TLS),</LegalBulletItem>
            <LegalBulletItem>kontrolę dostępu do danych (uwierzytelnianie, role użytkowników),</LegalBulletItem>
            <LegalBulletItem>regularne kopie zapasowe bazy danych,</LegalBulletItem>
            <LegalBulletItem>polityki bezpieczeństwa zgodne z RODO.</LegalBulletItem>
          </LegalBulletList>
        </LegalSection>

        <LegalSection id="zmiany" title="7. Zmiany polityki prywatności">
          <p>
            Zastrzegamy sobie prawo do aktualizacji niniejszej polityki prywatności. O istotnych zmianach poinformujemy za
            pośrednictwem serwisu. Aktualna wersja jest zawsze dostępna pod adresem fibranieruchomosci.pl/polityka-prywatnosci.
          </p>
        </LegalSection>

        <LegalSection id="kontakt" title="8. Kontakt">
          <p>We wszelkich sprawach dotyczących ochrony danych osobowych prosimy o kontakt:</p>
          <LegalCallout>
            <p className="font-semibold text-ink-950">GRUPA FIBRA Sp. z o.o.</p>
            <p className="mt-3 text-ink-700">
              ul. Józefa Rymera 177, 44-310 Radlin
              <br />
              E-mail:{" "}
              <a href="mailto:biuro@grupafibra.pl" className="font-medium">
                biuro@grupafibra.pl
              </a>
              <br />
              Telefon:{" "}
              <a href="tel:+48510777200" className="font-medium">
                510 777 200
              </a>
            </p>
          </LegalCallout>
        </LegalSection>
      </div>
    </>
  );
}
