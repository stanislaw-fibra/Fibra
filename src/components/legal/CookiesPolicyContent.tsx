import type { ReactNode } from "react";
import { LEGAL_LAST_UPDATED } from "./PrivacyPolicyContent";
import {
  LegalBulletItem,
  LegalBulletList,
  LegalCallout,
  LegalPageHeader,
  LegalSection,
  LegalSubBlock,
  LegalTableWrap,
} from "./LegalPagePrimitives";

function CookieTable({
  rows,
}: {
  rows: { name: ReactNode; vendor: string; purpose: string; retention: string }[];
}) {
  return (
    <LegalTableWrap>
      <table className="w-full min-w-[32rem] border-collapse text-left text-[13px] sm:min-w-0 sm:text-[14px]">
        <thead>
          <tr className="bg-ink-950 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/95">
            <th className="px-3 py-3.5 sm:px-4">Nazwa</th>
            <th className="px-3 py-3.5 sm:px-4">Dostawca</th>
            <th className="px-3 py-3.5 sm:px-4">Cel</th>
            <th className="px-3 py-3.5 sm:px-4">Czas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 bg-white text-ink-800">
          {rows.map((r, i) => (
            <tr key={i} className="transition-colors hover:bg-ink-50/80">
              <td className="px-3 py-3.5 align-top font-medium text-ink-900 sm:px-4">{r.name}</td>
              <td className="px-3 py-3.5 align-top text-ink-600 sm:px-4">{r.vendor}</td>
              <td className="px-3 py-3.5 align-top sm:px-4">{r.purpose}</td>
              <td className="px-3 py-3.5 align-top whitespace-nowrap text-ink-600 sm:px-4">{r.retention}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </LegalTableWrap>
  );
}

export function CookiesPolicyContent() {
  return (
    <>
      <LegalPageHeader eyebrow="Przeglądarka" title="Polityka cookies" updated={LEGAL_LAST_UPDATED} />

      <div className="space-y-10 md:space-y-14">
        <LegalSection id="czym" title="1. Czym są pliki cookies">
          <p>
            Pliki cookies (ciasteczka) to niewielkie pliki tekstowe zapisywane na Twoim urządzeniu (komputerze, telefonie,
            tablecie) podczas korzystania z naszego serwisu. Pozwalają nam zapamiętać Twoje preferencje i analizować
            sposób korzystania ze strony.
          </p>
        </LegalSection>

        <LegalSection id="jakich" title="2. Jakich cookies używamy">
          <LegalSubBlock label="a) Niezbędne (zawsze aktywne)">
            <p>Te cookies są konieczne do prawidłowego działania serwisu. Bez nich strona nie mogłaby funkcjonować poprawnie.</p>
          </LegalSubBlock>
          <CookieTable
            rows={[
              {
                name: (
                  <>
                    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px] text-ink-900">fibra_consent</code>
                  </>
                ),
                vendor: "fibranieruchomosci.pl",
                purpose: "Zapamiętanie Twojej decyzji o cookies",
                retention: "1 rok",
              },
              {
                name: (
                  <>
                    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px] text-ink-900">sb-access-token</code>
                    {", "}
                    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px] text-ink-900">sb-refresh-token</code>
                  </>
                ),
                vendor: "Supabase",
                purpose: "Uwierzytelnianie w panelu administracyjnym",
                retention: "Sesja / 7 dni",
              },
            ]}
          />

          <LegalSubBlock label="b) Analityczne (wymagają zgody)">
            <p>
              Pomagają nam zrozumieć, jak odwiedzający korzystają z serwisu - które strony są popularne, skąd przychodzą
              użytkownicy, jak długo zostają.
            </p>
          </LegalSubBlock>
          <CookieTable
            rows={[
              {
                name: (
                  <>
                    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px] text-ink-900">_ga</code>
                    {", "}
                    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px] text-ink-900">_ga_*</code>
                  </>
                ),
                vendor: "Google Analytics",
                purpose: "Analiza ruchu na stronie",
                retention: "14 mies.",
              },
            ]}
          />

          <LegalSubBlock label="c) Marketingowe (wymagają zgody)">
            <p>Służą do śledzenia skuteczności naszych kampanii reklamowych.</p>
          </LegalSubBlock>
          <CookieTable
            rows={[
              {
                name: (
                  <>
                    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px] text-ink-900">_fbp</code>
                    {", "}
                    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px] text-ink-900">_fbc</code>
                  </>
                ),
                vendor: "Meta (Facebook Pixel)",
                purpose: "Pomiar kampanii reklamowych",
                retention: "90 dni",
              },
            ]}
          />
        </LegalSection>

        <LegalSection id="zarzadzanie" title="3. Jak zarządzać cookies">
          <p>
            <strong className="text-ink-900">Na naszej stronie:</strong> przy pierwszej wizycie zobaczysz baner z
            możliwością wyboru: &quot;Akceptuję&quot; (wszystkie cookies) lub &quot;Tylko niezbędne&quot; (bez
            analitycznych i marketingowych).
          </p>
          <p>
            <strong className="text-ink-900">W przeglądarce:</strong> możesz w każdej chwili zmienić ustawienia cookies
            w swojej przeglądarce:
          </p>
          <LegalBulletList>
            <LegalBulletItem>Chrome: chrome://settings/cookies</LegalBulletItem>
            <LegalBulletItem>Firefox: about:preferences#privacy</LegalBulletItem>
            <LegalBulletItem>Safari: Preferencje, zakładka Prywatność</LegalBulletItem>
            <LegalBulletItem>Edge: edge://settings/privacy</LegalBulletItem>
          </LegalBulletList>
          <p>Wyłączenie cookies analitycznych i marketingowych nie wpływa na działanie serwisu.</p>
        </LegalSection>

        <LegalSection id="uslugi" title="4. Usługi zewnętrzne">
          <div className="space-y-5">
            <LegalCallout>
              <p className="font-semibold text-ink-950">Google Analytics</p>
              <p className="mt-2 text-[14px] leading-relaxed">
                Usługa analizy ruchu dostarczana przez Google LLC. Dane są anonimizowane (maskowanie IP).{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  Więcej informacji
                </a>
              </p>
            </LegalCallout>
            <LegalCallout>
              <p className="font-semibold text-ink-950">Facebook Pixel</p>
              <p className="mt-2 text-[14px] leading-relaxed">
                Usługa pomiaru kampanii reklamowych dostarczana przez Meta Platforms Inc.{" "}
                <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">
                  Więcej informacji
                </a>
              </p>
            </LegalCallout>
            <LegalCallout>
              <p className="font-semibold text-ink-950">Cloudflare Stream</p>
              <p className="mt-2 text-[14px] leading-relaxed">
                Dostarczanie materiałów wideo. Cloudflare może zapisywać cookies techniczne niezbędne do odtwarzania
                filmów.{" "}
                <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
                  Więcej informacji
                </a>
              </p>
            </LegalCallout>
            <LegalCallout>
              <p className="font-semibold text-ink-950">Supabase</p>
              <p className="mt-2 text-[14px] leading-relaxed">
                Baza danych i uwierzytelnianie. Cookies sesyjne służą wyłącznie do obsługi logowania w panelu
                administracyjnym.{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                  Więcej informacji
                </a>
              </p>
            </LegalCallout>
            <LegalCallout>
              <p className="font-semibold text-ink-950">Vercel</p>
              <p className="mt-2 text-[14px] leading-relaxed">
                Hosting serwisu. Vercel może używać cookies technicznych do routingu i optymalizacji.{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Więcej informacji
                </a>
              </p>
            </LegalCallout>
          </div>
        </LegalSection>

        <LegalSection id="zmiany" title="5. Zmiany">
          <p>
            Zastrzegamy sobie prawo do aktualizacji polityki cookies. Aktualna wersja jest dostępna pod adresem
            fibranieruchomosci.pl/cookies.
          </p>
        </LegalSection>

        <LegalSection id="kontakt" title="6. Kontakt">
          <LegalCallout>
            <p className="font-semibold text-ink-950">GRUPA FIBRA Sp. z o.o.</p>
            <p className="mt-3 text-ink-700">
              ul. Józefa Rymera 177, 44-310 Radlin
              <br />
              E-mail:{" "}
              <a href="mailto:biuro@grupafibra.pl" className="font-medium">
                biuro@grupafibra.pl
              </a>
            </p>
          </LegalCallout>
        </LegalSection>
      </div>
    </>
  );
}
