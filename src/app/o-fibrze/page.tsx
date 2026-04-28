import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = {
  title: "O Fibrze — Fibra Nieruchomości",
  description:
    "Fibra to deweloper, biuro nieruchomości i doradca finansowy w jednym. Działamy na Śląsku od 2006 roku — konkretnie, po ludzku, z pełną odpowiedzialnością.",
  alternates: { canonical: "/o-fibrze" },
  openGraph: {
    title: "O Fibrze — Fibra Nieruchomości",
    description:
      "Doświadczenie, któremu możesz zaufać. Działalność deweloperska, pośrednictwo w sprzedaży nieruchomości, finansowanie — od 2006 roku na Śląsku.",
    url: "/o-fibrze",
    type: "website",
    locale: "pl_PL",
  },
  twitter: {
    card: "summary_large_image",
    title: "O Fibrze — Fibra Nieruchomości",
    description:
      "Doświadczenie, któremu możesz zaufać. Działalność deweloperska, pośrednictwo w sprzedaży nieruchomości, finansowanie — od 2006 roku na Śląsku.",
  },
};

const AGENTS_BUCKET =
  "https://yrkvochsziertbvzbnol.supabase.co/storage/v1/object/public/agent-photos";

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  phone: string;
  photoUrl: string;
};

/**
 * Założyciel - osobna sekcja na górze strony zespołu (bez przycisku telefonicznego).
 * Docelowo dociągane z tabeli `agents` (np. po fladze `role = "Prezes Zarządu"`).
 */
const FOUNDER = {
  name: "Bartosz Nosiadek",
  role: "Założyciel, Prezes Zarządu",
  bio:
    "Wierzę, że w nieruchomościach – bardziej niż w jakiejkolwiek innej branży – liczy się człowiek i przejrzyste zasady. Tworząc Fibrę przyjąłem prostą dewizę: interesy robi się z ludźmi, a nie na ludziach.\n\nDziś, po 20 latach na rynku, z dumą patrzę na osiedla, które wybudowaliśmy i setki rodzin, którym pomogliśmy znaleźć ich miejsce na ziemi. Jako praktyk i autor książki „Zarabianie uczciwych pieniędzy”, dbam o to, by każdy etap naszej współpracy – od budowy, przez finansowanie, aż po zarządzanie najmem – opierał się na fundamencie zaufania.\n\nFibra to nie tylko deweloper czy biuro nieruchomości. To zespół specjalistów, którzy biorą pełną odpowiedzialność za Twój komfort i bezpieczeństwo finansowe. Zapraszam Cię do poznania nas bliżej — chociażby przez pryzmat naszych wideo-prezentacji.",
  photoUrl: `${AGENTS_BUCKET}/Bartosz%20Nosiadek.jpg`,
} as const;

/** Zespół - karty równych rozmiarów, każda z telefonem CTA. */
const TEAM: TeamMember[] = [
  {
    name: "Justyna Polok",
    role: "Licencjonowany Pośrednik i Ekspert Kredytowy",
    bio:
      "Z branżą nieruchomości i finansów jestem związana od 15 lat. Jako licencjonowany pośrednik i ekspert od kredytów hipotecznych, przeprowadzam moich klientów przez cały proces zakupu i finansowania – bez stresu i „drobnego druczku”. Na Osiedlu Zamysłów dbam o bezpieczeństwo wynajmu i spokój właścicieli, zarządzając mieszkaniami od strony formalnej i technicznej. Stawiam na konkret, uczciwość i relacje, bo wierzę, że profesjonalna współpraca nie musi być wyłącznie formalna.\n\nZapraszam do kontaktu.",
    phone: "795 133 380",
    photoUrl: `${AGENTS_BUCKET}/Justyna%20Polok.png`,
  },
  {
    name: "Arkadiusz Jezusek",
    role: "Agent Nieruchomości | Specjalista ds. Inwestycji",
    bio:
      "Od 9 lat skutecznie łączę świat sprzedaży, najmu i inwestycji. Jako agent 360° nie tylko znajduję nieruchomości, ale pomagam zamieniać metry kwadratowe w realny, stabilny dochód dla moich klientów.\n\nNa Osiedlu Zamysłów odpowiadam za cały cykl życia nieruchomości: od doradztwa przy zakupie mieszkania, po jego późniejszy wynajem i pełną obsługę najemców. Wspieram inwestorów w budowaniu zyskownych portfeli, stawiając na relacje i umiejętność słuchania potrzeb. Moim celem jest Twój zysk i bezpieczeństwo – od kawalerek po hale i magazyny.\n\nZapraszam do współpracy.",
    phone: "881 431 800",
    photoUrl: `${AGENTS_BUCKET}/Arkadiusz%20Jezusek.png`,
  },
];

const PILLARS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Działalność\ndeweloperska",
    body:
      "Realizujemy własne inwestycje mieszkaniowe w regionie rybnickim. Prowadzimy je od etapu projektu, przez budowę, aż po sprzedaż gotowych lokali.",
  },
  {
    n: "02",
    title: "Pośrednictwo w sprzedaży\nnieruchomości",
    body:
      "Pomagamy w sprzedaży, zakupie i wynajmie nieruchomości. Wspieramy klientów na każdym etapie i dbamy o to, żeby cały proces był dobrze zorganizowany.",
  },
  {
    n: "03",
    title: "Pomoc w\nfinansowaniu",
    body:
      "Pomagamy w uzyskaniu kredytu hipotecznego dopasowanego do konkretnej sytuacji. Klient nie ponosi kosztu naszej obsługi, ponieważ wynagrodzenie doradcy pokrywa bank.",
  },
];

function formatPhoneHref(phone: string) {
  return `tel:+48${phone.replace(/\D/g, "")}`;
}

export default function OFibrzePage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        {/* 1 - Hero (kompaktowy, wycentrowany) */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  O Fibrze
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h1
                  className="font-display text-ink-950 leading-[1.05] tracking-tight text-balance"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
                >
                  Doświadczenie, któremu możesz zaufać.
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-5 md:mt-8 text-[16px] md:text-[19px] leading-[1.55] text-ink-600 text-pretty">
                  Fibra to zespół, który łączy doświadczenie w budowie mieszkań, obrocie nieruchomościami i
                  finansowaniu zakupu. Działamy na Śląsku od 2006 roku, koncentrując się przede wszystkim na rynku
                  lokalnym i na tym, żeby dobrze przeprowadzić klienta przez cały proces.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 2 - Co robimy: trzy filary */}
        <section className="relative py-20 md:py-32 bg-ink-950 text-ink-100 overflow-hidden">
          <div className="absolute inset-0 grad-radial-brand opacity-50" aria-hidden />
          <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
          <div className="container-xl relative">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6 text-ink-300">
                  <span className="inline-block w-6 sm:w-8 h-px bg-accent-400" />
                  Co robimy
                  <span className="inline-block w-6 sm:w-8 h-px bg-accent-400" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-white tracking-tight leading-[1.05] text-balance"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                >
                  Trzy obszary, które dobrze się uzupełniają.
                </h2>
              </Reveal>
            </div>
            <div className="mt-12 md:mt-20 grid md:grid-cols-3 gap-10 md:gap-0 md:divide-x md:divide-white/10">
              {PILLARS.map((p, i) => (
                <Reveal
                  key={p.n}
                  delay={i * 90}
                  className={
                    i === 0
                      ? "md:pr-10 lg:pr-14"
                      : i === PILLARS.length - 1
                        ? "md:pl-10 lg:pl-14"
                        : "md:px-10 lg:px-14"
                  }
                >
                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/15 bg-white/[0.04] text-[11px] font-semibold tracking-wide text-accent-400">
                    {p.n}
                  </span>
                  <h3 className="font-display text-white text-[1.55rem] md:text-[1.85rem] leading-tight tracking-tight mt-5 md:mt-6 mb-4 md:mb-5 whitespace-pre-line min-h-[2.5em]">
                    {p.title}
                  </h3>
                  <p className="text-ink-400 text-[15.5px] md:text-[17px] leading-[1.65] max-w-md">
                    {p.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 3 - Założyciel (pełna szerokość, 2 kolumny) */}
        <section className="relative py-20 md:py-32 bg-paper-warm border-t border-ink-200/60">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.85rem, 4vw, 3rem)" }}
                >
                  Ludzie Fibry
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <p className="mt-5 md:mt-6 text-[16px] md:text-[18px] text-ink-600 leading-relaxed text-pretty">
                  Za każdą ofertą, transakcją i rozmową stoi konkretna osoba.
                </p>
              </Reveal>
              <Reveal delay={160}>
                <p className="eyebrow inline-flex items-center gap-3 mt-10 md:mt-14">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Założyciel
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
            </div>

            <div className="mt-10 md:mt-14 grid gap-10 md:gap-14 lg:gap-20 lg:grid-cols-12 lg:items-center">
              <Reveal className="lg:col-span-5">
                <div className="relative aspect-[3/4] w-full max-w-sm md:max-w-md lg:max-w-none mx-auto overflow-hidden rounded-[var(--radius-lg)] ring-1 ring-ink-200/70 shadow-[var(--shadow-cinematic)] bg-gradient-to-br from-brand-500/10 to-accent-400/10">
                  <Image
                    src={FOUNDER.photoUrl}
                    alt={`${FOUNDER.name} — ${FOUNDER.role}`}
                    fill
                    sizes="(min-width: 1024px) 40vw, (min-width: 768px) 448px, 384px"
                    className="object-cover"
                    style={{
                      objectPosition: "center 28%",
                      transform: "scale(1.12)",
                      transformOrigin: "center 40%",
                    }}
                    quality={82}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink-950/25 via-transparent to-transparent"
                  />
                </div>
              </Reveal>

              <Reveal delay={120} className="lg:col-span-7">
                <h3
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-center lg:text-left"
                  style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.75rem)" }}
                >
                  {FOUNDER.name}
                </h3>
                <p className="mt-3 text-[11px] md:text-[12px] uppercase tracking-[0.18em] text-brand-500 font-medium text-center lg:text-left">
                  {FOUNDER.role}
                </p>
                <p className="mt-6 md:mt-8 mx-auto lg:mx-0 max-w-2xl text-[16px] md:text-[17.5px] text-ink-700 leading-[1.7] text-pretty whitespace-pre-line">
                  {FOUNDER.bio}
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 3b - Nasz zespół (dwie karty) */}
        <section className="relative py-20 md:py-32 bg-paper-warm border-b border-ink-200/60">
          <div className="container-xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6">
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                  Zespół
                  <span className="inline-block w-6 sm:w-8 h-px bg-brand-500" />
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2
                  className="font-display text-ink-950 tracking-tight leading-[1.05]"
                  style={{ fontSize: "clamp(1.85rem, 4vw, 3rem)" }}
                >
                  Nasz zespół
                </h2>
              </Reveal>
            </div>

            {/* TODO: docelowo karty zespołu z tabeli agents */}
            <div className="mt-12 md:mt-18 grid gap-6 sm:gap-8 md:gap-10 sm:grid-cols-2 mx-auto max-w-5xl">
              {TEAM.map((member, i) => (
                <Reveal key={member.name} delay={i * 90}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] bg-paper ring-1 ring-ink-200/80 shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-cinematic)]">
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-brand-500/10 to-accent-400/10">
                      <Image
                        src={member.photoUrl}
                        alt={`${member.name} — ${member.role}`}
                        fill
                        sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
                        quality={78}
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-ink-950/30 via-transparent to-transparent"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6 sm:p-7 md:p-8">
                      <h3 className="font-display text-[1.4rem] sm:text-[1.5rem] md:text-[1.65rem] text-ink-950 leading-tight tracking-tight">
                        {member.name}
                      </h3>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-brand-500">
                        {member.role}
                      </p>
                      <p className="mt-4 sm:mt-5 text-[15px] md:text-[15.5px] text-ink-600 leading-[1.6] flex-1 whitespace-pre-line">
                        {member.bio}
                      </p>
                      {/* TODO: video autoprezentacja agenta */}
                      <a
                        href={formatPhoneHref(member.phone)}
                        className="mt-6 sm:mt-7 inline-flex items-center gap-2 self-start rounded-full bg-ink-950 px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-brand-500 active:scale-[0.98]"
                        aria-label={`Zadzwoń do ${member.name}, ${member.phone}`}
                      >
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                          <path
                            d="M11.5 9.8v1.4a1.2 1.2 0 0 1-1.3 1.2 11.8 11.8 0 0 1-5.1-1.8 11.6 11.6 0 0 1-3.6-3.6 11.8 11.8 0 0 1-1.8-5.2 1.2 1.2 0 0 1 1.2-1.3h1.4a1.2 1.2 0 0 1 1.2 1 7.8 7.8 0 0 0 .4 1.8 1.2 1.2 0 0 1-.3 1.2l-.6.6a9.6 9.6 0 0 0 3.6 3.6l.6-.6a1.2 1.2 0 0 1 1.2-.3 7.8 7.8 0 0 0 1.8.4 1.2 1.2 0 0 1 1 1.2Z"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="tabular-nums">{member.phone}</span>
                      </a>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 4 - Motto */}
        <section className="relative py-20 md:py-40 bg-ink-950 text-ink-100 overflow-hidden">
          <div className="absolute inset-0 grad-radial-brand opacity-40" aria-hidden />
          <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
          <div className="container-xl relative mx-auto max-w-4xl text-center">
            <Reveal>
              <p
                className="font-display italic text-white leading-[1.12] tracking-tight text-balance"
                style={{ fontSize: "clamp(1.65rem, 5vw, 3.5rem)" }}
              >
                „Interesy robimy z ludźmi, a nie na ludziach.”
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-8 md:mt-12 mx-auto max-w-2xl text-[16px] md:text-[18px] text-ink-400 leading-[1.65] text-pretty">
                To nie slogan. To zasada, według której prowadzimy każdą rozmowę, każdą transakcję
                i każdą inwestycję od ponad dekady.
              </p>
            </Reveal>
          </div>
        </section>

        {/* 5 - CTA */}
        <section className="relative py-20 md:py-32">
          <div className="container-xl text-center max-w-3xl mx-auto">
            <Reveal>
              <h2
                className="font-display text-ink-950 tracking-tight leading-[1.02]"
                style={{ fontSize: "clamp(1.85rem, 4.5vw, 3.25rem)" }}
              >
                Chcesz porozmawiać?
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-7 md:mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[16px] md:text-[18px] text-ink-700">
                <a
                  href="tel:+48510777200"
                  className="font-display text-[22px] md:text-[24px] text-brand-600 hover:text-brand-500 tabular-nums transition-colors"
                >
                  510 777 200
                </a>
                <span aria-hidden className="hidden sm:inline text-ink-300">
                  ·
                </span>
                <a
                  href="mailto:biuro@grupafibra.pl"
                  className="hover:text-brand-600 transition-colors break-all sm:break-normal"
                >
                  biuro@grupafibra.pl
                </a>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-10 md:mt-14">
                <Link
                  href="/kontakt"
                  className="inline-flex items-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white px-8 sm:px-10 py-4 text-[15px] md:text-[16px] font-medium transition-colors active:scale-[0.98]"
                >
                  Umów rozmowę
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M3 7h8M7 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
