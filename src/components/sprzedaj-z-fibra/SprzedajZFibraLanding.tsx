import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

/** Hero – grafika z `/public`. */
const HERO_IMAGE = "/Sprzedaj_z_fibra.webp";

/** Sekcja spacerów 3D – grafika z `/public`; podpis źródła pod obrazem. */
const MATTERPORT_IMAGE = "/matterport.webp";

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Wycena i strategia",
    body: "Oglądamy nieruchomość, analizujemy lokalny rynek i pomagamy ustalić cenę, która ma uzasadnienie w realiach rynku. To ważny etap, bo dobrze ustawiona oferta daje lepszy start całemu procesowi sprzedaży.",
  },
  {
    n: "02",
    title: "Filmy i spacer 3D",
    body: "Przygotowujemy filmy oraz wirtualny spacer 3D Matterport, dzięki którym kupujący mogą lepiej poznać nieruchomość jeszcze przed wizytą. To ułatwia podjęcie decyzji o kontakcie i pozwala lepiej zaprezentować układ oraz charakter wnętrza.",
  },
  {
    n: "03",
    title: "Oferta, która jest dopracowana",
    body: "Tworzymy profesjonalne materiały sprzedażowe: zdjęcia, opis, rzuty 2D i 3D oraz kartę oferty PDF. Dbamy o to, żeby całość była spójna, estetyczna i czytelna dla osoby, która realnie rozważa zakup.",
  },
  {
    n: "04",
    title: "Promocja oferty",
    body: "Oprócz tradycyjnych miejsc publikacji (portale ogłoszeniowe) oferta jest eksponowana na innowacyjnej wideostronie www oraz odpłatnie — z naszych środków — reklamowana w mediach społecznościowych.",
  },
  {
    n: "05",
    title: "Finalizacja transakcji",
    body: "Organizujemy komplet dokumentów z urzędów, sprawdzamy Księgi Wieczyste i pomagamy w uzyskaniu najlepszego kredytu, prowadząc klienta aż po spotkanie u notariusza i zamknięcie transakcji.",
  },
];

const CLIENT_QUOTES: { quote: string; name: string; context: string }[] = [
  {
    quote:
      "Pomogli w sprzedaży mieszkania. Temat był niełatwy ze względu na sytuację rodzinną, ale transakcja przebiegła bezproblemowo. Zawsze byli na wyciągnięciu ręki i podchodzili do tematu z empatią.",
    name: "Asia M.",
    context: "Sprzedaż mieszkania",
  },
  {
    quote:
      "Już po pierwszej rozmowie telefonicznej narodziło się we mnie zaufanie, a po spotkaniu i omówieniu mojej zawiłej sytuacji nabrałem przekonania - ta pani to załatwi.",
    name: "Viktor B.",
    context: "Sprzedaż domu",
  },
];

const COMPARE: { left: string; right: string }[] = [
  { left: "Standardowa galeria zdjęć", right: "Profesjonalne zdjęcia, filmy i spacer 3D" },
  { left: "Krótki, schematyczny opis", right: "Dopracowana prezentacja oferty" },
  { left: "Samo ogłoszenie na portalu", right: "Szersze przygotowanie i promocja oferty" },
  { left: "Kontakt dopiero po publikacji", right: "Proces zaplanowany od początku" },
  { left: "Podstawowe informacje", right: "Zdjęcia, rzuty 2D i 3D, karta PDF i prezentacja 3D" },
  { left: "Orientacyjna wycena", right: "Cena oparta na analizie rynku" },
];

function IconX({ className }: { className?: string }) {
  return (
    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/12 text-red-600 ${className ?? ""}`} aria-hidden>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500/15 text-accent-500 ${className ?? ""}`} aria-hidden>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
        <path d="M1.5 6l4.5 4L14.5 1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function SprzedajZFibraLanding({
  filmEmbedSrc,
  filmPosterSrc,
}: {
  filmEmbedSrc: string | null;
  filmPosterSrc: string | null;
}) {
  const filmSrc =
    filmEmbedSrc &&
    `${filmEmbedSrc}${filmEmbedSrc.includes("?") ? "&" : "?"}muted=true&autoplay=true&loop=true&controls=true&preload=metadata`;

  return (
    <>
      {/* 1 - Hero */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center pt-[calc(72px+1.75rem)] md:pt-[calc(72px+2.5rem)] lg:pt-[calc(72px+3rem)] pb-16 md:pb-24 bg-ink-950 text-ink-100 overflow-hidden">
        <div className="absolute inset-0 grad-radial-brand opacity-70" aria-hidden />
        <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
        <div className="container-xl relative w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 xl:gap-14 items-center">
            <div className="lg:col-span-6 xl:col-span-5">
              <h1 className="font-display text-white tracking-tight leading-[0.98]" style={{ fontSize: "clamp(2.35rem, 6.2vw, 4.75rem)" }}>
                <Reveal as="span" className="block" delay={0}>
                  Twoja nieruchomość
                </Reveal>
                <Reveal as="span" className="block" delay={90}>
                  zasługuje na
                </Reveal>
                <Reveal as="span" className="block" delay={180}>
                  <span className="text-accent-400 italic">więcej niż tylko ogłoszenie.</span>
                </Reveal>
              </h1>
              <Reveal delay={260} className="mt-8 md:mt-10 max-w-xl">
                <p className="text-lg md:text-xl text-ink-400 leading-relaxed">
                  W Fibrze dbamy o to, żeby oferta była dobrze przygotowana, atrakcyjnie pokazana i trafiała do właściwych osób.
                  Łączymy doświadczenie w nieruchomościach z nowoczesną prezentacją, dzięki czemu sprzedaż jest lepiej zaplanowana od samego początku.
                </p>
              </Reveal>
              <Reveal delay={340} className="mt-10 md:mt-12 flex flex-col sm:flex-row flex-wrap gap-4">
                <Link
                  href="/kontakt"
                  className="inline-flex w-full sm:w-auto min-h-[52px] items-center justify-center gap-2 rounded-full bg-accent-500 px-8 py-3.5 text-[15px] font-medium text-white hover:bg-accent-400 transition-colors"
                >
                  Porozmawiajmy →
                </Link>
                <a
                  href="#jak-dzialamy"
                  className="inline-flex w-full sm:w-auto min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/35 px-8 py-3.5 text-[15px] font-medium text-white/95 hover:bg-white/10 transition-colors"
                >
                  Zobacz, jak działamy →
                </a>
              </Reveal>
            </div>
            <Reveal delay={120} className="lg:col-span-6 xl:col-span-7">
              <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none lg:ml-auto aspect-[4/5] max-h-[min(72vh,620px)] rounded-[var(--radius-lg)] overflow-hidden border border-white/[0.12] shadow-[0_40px_100px_-28px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06]">
                <Image
                  src={HERO_IMAGE}
                  alt="Sprzedaj z Fibrą - profesjonalna prezentacja nieruchomości"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 40vw, (min-width: 1024px) 50vw, 100vw"
                  priority
                  quality={78}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-ink-950/20 pointer-events-none" aria-hidden />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 2 - Problem */}
      <section className="relative py-24 md:py-32 bg-paper-warm" aria-labelledby="sprzedaj-problem-heading">
        <div className="container-xl">
          <h2 id="sprzedaj-problem-heading" className="eyebrow mb-14 md:mb-20 max-w-3xl">
            DLACZEGO SAMO OGŁOSZENIE CZĘSTO NIE WYSTARCZA
          </h2>
          <div className="grid md:grid-cols-3 gap-12 md:gap-0 md:divide-x md:divide-ink-200/80">
            <Reveal className="md:pr-10 lg:pr-14" delay={0}>
              <p className="font-display text-ink-950 text-2xl md:text-[1.65rem] leading-snug tracking-tight mb-4">
                Brak uwagi klienta
              </p>
              <p className="text-ink-600 text-[17px] leading-relaxed max-w-md">
                Wiele ofert wygląda bardzo podobnie. Kupujący przeglądają dziesiątki ogłoszeń i często zatrzymują się tylko przy tych,
                które od razu przyciągają uwagę. Nawet dobra nieruchomość może zostać pominięta, jeśli nie zostanie odpowiednio pokazana.
              </p>
            </Reveal>
            <Reveal className="md:px-10 lg:px-14" delay={100}>
              <p className="font-display text-ink-950 text-2xl md:text-[1.65rem] leading-snug tracking-tight mb-4">
                Publikacja bez konkretnego planu
              </p>
              <p className="text-ink-600 text-[17px] leading-relaxed max-w-md">
                Samo dodanie ogłoszenia to dopiero początek. Liczy się także to, do kogo oferta ma trafić, jak ją zaprezentować i jak
                poprowadzić cały proces, żeby zwiększyć szansę na sprawną sprzedaż.
              </p>
            </Reveal>
            <Reveal className="md:pl-10 lg:pl-14" delay={200}>
              <p className="font-display text-ink-950 text-2xl md:text-[1.65rem] leading-snug tracking-tight mb-4">
                Długi czas sprzedaży i presja na obniżki
              </p>
              <p className="text-ink-600 text-[17px] leading-relaxed max-w-md">
                Kiedy nieruchomość długo pozostaje na rynku, kupujący zaczynają zadawać sobie pytanie, z czego to wynika. Dlatego tak
                ważne jest dobre przygotowanie oferty już na starcie.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3 - Jak działa Fibra */}
      <section id="jak-dzialamy" className="relative py-24 md:py-32 bg-ink-950 text-ink-100 overflow-hidden scroll-mt-[88px]">
        <div className="absolute inset-0 grad-radial-brand opacity-50" aria-hidden />
        <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
        <div className="container-xl relative">
          <div className="grid lg:grid-cols-12 gap-14 lg:gap-20">
            <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <h2 className="font-display text-white tracking-tight leading-[0.98]" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
                  Nie zaczynamy od publikacji,
                  <br />
                  tylko od przygotowania oferty.
                </h2>
              </Reveal>
              <Reveal delay={80} className="mt-6">
                <p className="text-ink-400 text-lg md:text-xl leading-relaxed max-w-md">
                  Każdą nieruchomość prowadzimy według uporządkowanego procesu. Dzięki temu oferta od początku jest przemyślana, spójna i
                  gotowa do pokazania kupującym w najlepszy możliwy sposób.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-7">
              <ol className="space-y-0">
                {STEPS.map((step, i) => {
                  const isLast = i === STEPS.length - 1;
                  return (
                    <Reveal key={step.n} as="li" delay={i * 60} className="flex gap-5 md:gap-7 list-none pb-12 md:pb-14 last:pb-0">
                      <div className="relative flex w-11 shrink-0 flex-col items-center pt-0.5">
                        <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-ink-950 text-[11px] font-semibold tracking-wide text-accent-400 shadow-[0_0_0_4px_rgba(7,9,12,0.85)]">
                          {step.n}
                        </span>
                        {!isLast ? (
                          <div
                            className="absolute left-1/2 top-8 bottom-0 w-px -translate-x-1/2 bg-white/12"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="font-display text-xl md:text-2xl text-white tracking-tight mb-3">{step.title}</p>
                        <p className="text-ink-400 text-[16px] md:text-[17px] leading-relaxed max-w-2xl">{step.body}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* 4 - Wirtualny spacer */}
      <section className="relative py-24 md:py-32 bg-paper-warm border-y border-ink-200/50">
        <div className="container-xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <Reveal>
                <h2 className="font-display text-ink-950 tracking-tight leading-[0.98] max-w-[18ch]" style={{ fontSize: "clamp(2rem, 4vw, 3.15rem)" }}>
                  Wirtualny spacer 3D
                  <br />
                  to u nas ważny element
                  <br />
                  prezentacji oferty.
                </h2>
              </Reveal>
              <Reveal delay={90} className="mt-8 space-y-5 text-ink-600 text-[17px] md:text-lg leading-relaxed max-w-xl">
                <p>
                  Dzięki spacerowi 3D kupujący mogą zobaczyć układ nieruchomości jeszcze przed wizytą na miejscu. To wygodna forma
                  prezentacji, która pozwala lepiej zrozumieć przestrzeń i ocenić, czy dana oferta rzeczywiście odpowiada ich potrzebom.
                </p>
                <p>
                  W praktyce oznacza to lepiej przygotowane zapytania i bardziej świadome wizyty.
                </p>
              </Reveal>
            </div>
            <Reveal delay={80}>
              <div className="space-y-3">
                <div className="relative aspect-[4/3] lg:aspect-[5/4] w-full overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/80 shadow-[var(--shadow-cinematic)] ring-1 ring-ink-200/40">
                  <Image
                    src={MATTERPORT_IMAGE}
                    alt="Wirtualny spacer 3D Matterport - przykład prezentacji nieruchomości"
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    quality={78}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-ink-950/25 via-transparent to-transparent pointer-events-none" aria-hidden />
                </div>
                <p className="text-[12px] text-ink-500 leading-relaxed lg:text-right">
                  Źródło zdjęcia: Matterport.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5 - Film */}
      <section className="relative py-24 md:py-32 bg-ink-950 text-ink-100 overflow-x-clip">
        <div className="absolute inset-0 grad-radial-brand opacity-45" aria-hidden />
        <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
        <div className="container-xl relative max-w-full">
          <div className="flex w-full max-w-full flex-col gap-10 md:gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8 xl:gap-10">
            <div className="min-w-0 w-full max-w-xl shrink lg:pr-2">
              <Reveal>
                <h2 className="font-display text-white tracking-tight leading-[0.98] break-words" style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}>
                  Krótki film
                  <br />
                  potrafi pokazać więcej
                  <br />
                  niż sama galeria zdjęć.
                </h2>
              </Reveal>
              <Reveal delay={90} className="mt-8 space-y-5 text-ink-400 text-[17px] md:text-lg leading-relaxed">
                <p>
                  Dlatego do prezentacji nieruchomości przygotowujemy również krótkie wideo. Taki materiał pomaga pokazać przestrzeń,
                  światło i ogólny charakter wnętrza w sposób, którego same zdjęcia często nie oddają.
                </p>
                <p>
                  Dla kupującego to szybki i wygodny sposób, żeby lepiej poczuć nieruchomość jeszcze przed kontaktem.
                </p>
              </Reveal>
            </div>
            <div className="flex w-full shrink-0 justify-center lg:w-[clamp(300px,32vw,420px)] lg:justify-end">
              <Reveal delay={60} className="block w-full max-w-[300px] sm:max-w-[320px] lg:max-w-none lg:w-full">
                <div className="relative mx-auto w-full rounded-[2.5rem] border-[10px] border-ink-700 bg-ink-900 p-2 shadow-[0_40px_100px_-24px_rgba(0,0,0,0.75)] ring-1 ring-white/10 lg:mx-0">
                  <div className="relative aspect-[9/16] w-full min-h-[240px] overflow-hidden rounded-[1.65rem] bg-ink-800">
                    {filmSrc ? (
                      <iframe
                        title="Przykładowy film z oferty Fibry"
                        src={filmSrc}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    ) : filmPosterSrc ? (
                      <>
                        <Image
                          src={filmPosterSrc}
                          alt="Klatka z przykładowego filmu oferty Fibry"
                          fill
                          className="object-cover"
                          sizes="(max-width: 1023px) 90vw, 400px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent pointer-events-none" aria-hidden />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
                          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/92 text-ink-950 shadow-lg ring-4 ring-black/15">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </div>
                        <p className="absolute bottom-3 left-2 right-2 text-center text-[11px] leading-snug text-white/85 drop-shadow-sm">
                          Klatka z demo oferty. Pełny odtwarzacz po ustawieniu{" "}
                          <span className="whitespace-nowrap">NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE</span>.
                        </p>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-800 p-6 text-center">
                        <span className="text-white/90 text-sm font-medium">Brak podglądu filmu</span>
                        <span className="text-ink-400 text-xs leading-relaxed">Skonfiguruj zmienne Stream lub identyfikator demo.</span>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 6 - Liczby: <SprzedajZFibraStats /> - wyłączone do czasu potwierdzenia liczb z klientem */}

      {/* 7 - Porównanie */}
      <section className="relative py-24 md:py-32 bg-paper-warm" aria-labelledby="sprzedaj-compare-heading">
        <div className="container-xl max-w-4xl">
          <Reveal>
            <h2 id="sprzedaj-compare-heading" className="font-display text-ink-950 tracking-tight" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Widzisz różnicę?
            </h2>
          </Reveal>
          <ul className="mt-14 md:mt-16 divide-y divide-ink-200/90">
            {COMPARE.map((row, i) => (
              <Reveal key={row.left} delay={i * 45} as="li" className="list-none py-6 md:py-7">
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-8 sm:items-stretch">
                  <div className="flex gap-4 items-center rounded-lg px-3.5 py-3.5 sm:px-0 sm:py-0">
                    <IconX />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500 mb-1.5">Zwykłe biuro</p>
                      <p className="text-ink-800 text-[16px] leading-snug">{row.left}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center rounded-lg bg-emerald-50/30 px-3.5 py-3.5 sm:px-5 sm:py-3.5">
                    <IconCheck className="!bg-emerald-500/12 !text-emerald-700" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-800/85 mb-1.5">Fibra</p>
                      <p className="text-ink-900 text-[16px] font-medium leading-snug">{row.right}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 8 - Klienci */}
      <section className="relative py-28 md:py-36 bg-ink-950 text-ink-100 overflow-hidden" aria-labelledby="sprzedaj-clients-heading">
        <div className="absolute inset-0 grad-radial-brand opacity-40" aria-hidden />
        <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
        <div className="container-xl relative px-4">
          <Reveal>
            <h2 id="sprzedaj-clients-heading" className="font-display text-white text-center tracking-tight mb-14 md:mb-16" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.35rem)" }}>
              Głos klientów
            </h2>
          </Reveal>
          <div className="mx-auto grid max-w-5xl gap-10 md:gap-12 lg:grid-cols-2 lg:gap-10 xl:gap-12">
            {CLIENT_QUOTES.map((item, i) => (
              <Reveal key={item.name} delay={i * 80} className="h-full">
                <figure className="flex h-full flex-col rounded-[var(--radius-lg)] border border-white/[0.1] bg-white/[0.04] p-8 md:p-9 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.55)] backdrop-blur-sm">
                  <blockquote className="font-display text-white/95 italic leading-[1.35] tracking-tight text-[1.2rem] md:text-[1.35rem] grow">
                    „{item.quote}”
                  </blockquote>
                  <figcaption className="mt-8 pt-6 border-t border-white/[0.08]">
                    <p className="text-[15px] md:text-base font-medium text-white">{item.name}</p>
                    <p className="mt-1 text-[13px] md:text-sm text-ink-400">{item.context}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 9 - CTA końcowe */}
      <section className="relative min-h-[85dvh] flex flex-col justify-center py-24 md:py-32 bg-ink-950 text-ink-100 overflow-hidden border-t border-white/[0.06]">
        <div className="absolute inset-0 grad-radial-brand opacity-55" aria-hidden />
        <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
        <div className="container-xl relative text-center max-w-3xl mx-auto">
          <Reveal>
            <h2 className="font-display text-white tracking-tight leading-[0.98]" style={{ fontSize: "clamp(2.25rem, 6vw, 4.25rem)" }}>
              Zacznijmy od rozmowy.
              <br />
              Bez zobowiązań, bez kosztów.
            </h2>
          </Reveal>
          <Reveal delay={100} className="mt-8">
            <p className="text-ink-400 text-lg md:text-xl leading-relaxed">
              Opowiedz nam o swojej nieruchomości. Powiemy Ci, jak widzimy jej potencjał, jak możemy ją pokazać i jak wyglądałby cały
              proces sprzedaży. Jeśli uznasz, że to dobre rozwiązanie, przejdziemy do kolejnych kroków.
            </p>
          </Reveal>
          <Reveal delay={180} className="mt-12 md:mt-14 flex flex-col sm:flex-row flex-wrap justify-center gap-4">
            <Link
              href="/kontakt"
              className="inline-flex w-full sm:w-auto min-h-[56px] items-center justify-center gap-2 rounded-full bg-accent-500 px-10 py-4 text-[16px] font-medium text-white hover:bg-accent-400 transition-colors"
            >
              Umów rozmowę →
            </Link>
            <a
              href="tel:+48510777200"
              className="inline-flex w-full sm:w-auto min-h-[56px] items-center justify-center gap-2 rounded-full border border-white/35 px-10 py-4 text-[16px] font-medium text-white/95 hover:bg-white/10 transition-colors"
            >
              Zadzwoń: 510 777 200
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
