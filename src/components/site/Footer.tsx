import Link from "next/link";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="relative bg-ink-950 text-ink-200 mt-auto overflow-hidden">
      <div className="absolute inset-0 grad-radial-brand opacity-40 pointer-events-none" />

      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

      <div className="container-xl relative py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16">
          <div className="md:col-span-5">
            <Logo variant="paper" />
            <p className="mt-10 font-display fluid-h2 text-white max-w-[14ch]">
              Doświadczenie, któremu możesz zaufać.
            </p>
            <div className="mt-12 flex flex-col gap-1.5 text-[15px]">
              <a href="tel:+48510777200" className="text-white hover:text-accent-400 transition-colors">
                510 777 200
              </a>
              <a href="mailto:biuro@grupafibra.pl" className="text-white hover:text-accent-400 transition-colors">
                biuro@grupafibra.pl
              </a>
              <span className="text-ink-500 mt-2 text-[13px]">
                Grupa Fibra Sp. z o.o. · ul. Rymera 177, 44-310 Radlin · Pon.–Pt. 8:00–16:00
              </span>
            </div>
          </div>

          <div className="md:col-span-3">
            <p className="eyebrow eyebrow-on-dark mb-5">Nawigacja</p>
            <ul className="flex flex-col gap-3 text-[15px]">
              {[
                ["/", "Strona główna"],
                ["/oferty", "Oferty"],
                ["/sprzedaj-z-fibra", "Sprzedaj z Fibrą"],
                ["/o-fibrze", "O Fibrze"],
                ["/kontakt", "Kontakt"],
              ].map(([h, l]) => (
                <li key={h}>
                  <Link href={h} className="text-ink-300 hover:text-accent-400 transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="eyebrow eyebrow-on-dark mb-5">Newsletter Fibry</p>
            <p className="text-[15px] text-ink-400 mb-5">
              Raz w miesiącu krótki list z najciekawszymi ofertami premium, prosto na Twoją skrzynkę.
            </p>
            <NewsletterForm />
            <div className="mt-8 flex gap-4">
              {["Instagram", "YouTube", "LinkedIn"].map((s) => (
                <a key={s} href="#" className="text-[13px] text-ink-400 hover:text-white transition-colors">
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 hairline-dark-t flex flex-col md:flex-row justify-between gap-4 text-[12px] text-ink-500">
          <p>&copy; {new Date().getFullYear()} Fibra Nieruchomości. Wszelkie prawa zastrzeżone.</p>
          <div className="flex gap-6">
            <Link href="/polityka-prywatnosci" className="hover:text-white transition-colors">
              Polityka prywatności
            </Link>
            <Link href="/regulamin" className="hover:text-white transition-colors">
              Regulamin
            </Link>
            <Link href="/cookies" className="hover:text-white transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
