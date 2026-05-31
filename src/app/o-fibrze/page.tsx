import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { TeamMemberMedia } from "@/components/team/TeamMemberMedia";
import { getPublicTeamMembers, type TeamMember } from "@/lib/team-query";

export const revalidate = 60;

export const metadata = {
  title: "O Fibrze - Fibra Nieruchomości",
  description:
    "Fibra to deweloper, biuro nieruchomości i doradca finansowy w jednym. Działamy na Śląsku od 2006 roku - konkretnie, po ludzku, z pełną odpowiedzialnością.",
  alternates: { canonical: "/o-fibrze" },
  openGraph: {
    title: "O Fibrze - Fibra Nieruchomości",
    description:
      "Doświadczenie, któremu możesz zaufać. Działalność deweloperska, pośrednictwo w sprzedaży nieruchomości, finansowanie - od 2006 roku na Śląsku.",
    url: "/o-fibrze",
    type: "website",
    locale: "pl_PL",
  },
  twitter: {
    card: "summary_large_image",
    title: "O Fibrze - Fibra Nieruchomości",
    description:
      "Doświadczenie, któremu możesz zaufać. Działalność deweloperska, pośrednictwo w sprzedaży nieruchomości, finansowanie - od 2006 roku na Śląsku.",
  },
};

const AGENTS_BUCKET =
  "https://yrkvochsziertbvzbnol.supabase.co/storage/v1/object/public/agent-photos";

/**
 * Fallback hardcoded - używany dopóki migracja `agents` z polami
 * `bio_long` / `team_role` / `team_order` / `is_team_visible` / `cloudflare_video_id`
 * nie zostanie uruchomiona w środowisku produkcyjnym i zespół nie zostanie wpisany
 * przez panel admina. Po wpięciu danych w bazie publiczna strona automatycznie
 * przejdzie na DB-driven layout (z fallbackiem video → zdjęcie).
 */
const FALLBACK_FOUNDER: TeamMember = {
  id: "fallback-bartosz",
  name: "Bartosz Nosiadek",
  role: "Założyciel, Prezes Zarządu",
  bio:
    "Wierzę, że w nieruchomościach – bardziej niż w jakiejkolwiek innej branży – liczy się człowiek i przejrzyste zasady. Tworząc Fibrę przyjąłem prostą dewizę: interesy robi się z ludźmi, a nie na ludziach.\n\nDziś, po 20 latach na rynku, z dumą patrzę na osiedla, które wybudowaliśmy i setki rodzin, którym pomogliśmy znaleźć ich miejsce na ziemi. Jako praktyk i autor książki „Zarabianie uczciwych pieniędzy”, dbam o to, by każdy etap naszej współpracy – od budowy, przez finansowanie, aż po zarządzanie najmem – opierał się na fundamencie zaufania.\n\nFibra to nie tylko deweloper czy biuro nieruchomości. To zespół specjalistów, którzy biorą pełną odpowiedzialność za Twój komfort i bezpieczeństwo finansowe. Zapraszam Cię do poznania nas bliżej - chociażby przez pryzmat naszych wideo-prezentacji.",
  photoUrl: `${AGENTS_BUCKET}/Bartosz%20Nosiadek.jpg`,
  kind: "founder",
  order: 0,
  isVisible: true,
};

const FALLBACK_TEAM: TeamMember[] = [
  {
    id: "fallback-justyna",
    name: "Justyna Polok",
    role: "Licencjonowany Pośrednik i Ekspert Kredytowy",
    bio:
      "Z branżą nieruchomości i finansów jestem związana od 15 lat. Jako licencjonowany pośrednik i ekspert od kredytów hipotecznych, przeprowadzam moich klientów przez cały proces zakupu i finansowania – bez stresu i „drobnego druczku”. Na Osiedlu Zamysłów dbam o bezpieczeństwo wynajmu i spokój właścicieli, zarządzając mieszkaniami od strony formalnej i technicznej. Stawiam na konkret, uczciwość i relacje, bo wierzę, że profesjonalna współpraca nie musi być wyłącznie formalna.\n\nZapraszam do kontaktu.",
    phone: "795 133 380",
    photoUrl: `${AGENTS_BUCKET}/Justyna%20Polok.png`,
    kind: "member",
    order: 10,
    isVisible: true,
  },
  {
    id: "fallback-arek",
    name: "Arkadiusz Jezusek",
    role: "Agent Nieruchomości | Specjalista ds. Inwestycji",
    bio:
      "Od 9 lat skutecznie łączę świat sprzedaży, najmu i inwestycji. Jako agent 360° nie tylko znajduję nieruchomości, ale pomagam zamieniać metry kwadratowe w realny, stabilny dochód dla moich klientów.\n\nNa Osiedlu Zamysłów odpowiadam za cały cykl życia nieruchomości: od doradztwa przy zakupie mieszkania, po jego późniejszy wynajem i pełną obsługę najemców. Wspieram inwestorów w budowaniu zyskownych portfeli, stawiając na relacje i umiejętność słuchania potrzeb. Moim celem jest Twój zysk i bezpieczeństwo – od kawalerek po hale i magazyny.\n\nZapraszam do współpracy.",
    phone: "881 431 800",
    photoUrl: `${AGENTS_BUCKET}/Arkadiusz%20Jezusek.png`,
    kind: "member",
    order: 20,
    isVisible: true,
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

export default async function OFibrzePage() {
  // Najpierw próbujemy z bazy. Jeżeli baza pusta (migracja nie pojechała / admin nic nie wpisał),
  // pokazujemy hardcoded fallback z PIM-em - żeby strona nigdy nie była pusta.
  const dbMembers = await getPublicTeamMembers();
  const founder = dbMembers.find((m) => m.kind === "founder") ?? FALLBACK_FOUNDER;
  const team = dbMembers.filter((m) => m.kind === "member");
  const teamMembers = team.length > 0 ? team : FALLBACK_TEAM;

  return (
    <>
      <Nav />
      <main className="flex-1 pt-[72px]">
        {/* 1 - Hero */}
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
                <p className="mt-5 md:mt-8 text-[16px] md:text-[19px] leading-[1.55] text-ink-700 text-pretty">
                  Fibra to zespół, który łączy doświadczenie w budowie mieszkań, obrocie nieruchomościami i
                  finansowaniu zakupu. Działamy na Śląsku od 2006 roku, koncentrując się przede wszystkim na rynku
                  lokalnym i na tym, żeby dobrze przeprowadzić klienta przez cały proces.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 2 - Co robimy */}
        <section className="relative py-20 md:py-32 bg-ink-950 text-ink-100 overflow-hidden">
          <div className="absolute inset-0 grad-radial-brand opacity-50" aria-hidden />
          <div className="absolute inset-0 grain grain-on-dark" aria-hidden />
          <div className="container-xl relative">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="eyebrow inline-flex items-center gap-3 mb-6 text-ink-200">
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
                  <p className="text-ink-200 text-[15.5px] md:text-[17px] leading-[1.65] max-w-md">
                    {p.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 3 - Założyciel */}
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
                <p className="mt-5 md:mt-6 text-[16px] md:text-[18px] text-ink-700 leading-relaxed text-pretty">
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

            {/* Wideo (lub portret) wycentrowane pionowo względem opisu - bez wyrównywania
                do góry tekstu zostaje mniej pustej przestrzeni przy długich biogramach.
                Max-width ograniczony, bo natywne 9:16 przy pełnej szerokości kolumny dawałoby
                ~700-800 px wysokości - za dużo nawet dla bogatego biogramu założyciela. */}
            <div className="mt-10 md:mt-14 grid gap-10 md:gap-14 lg:gap-16 lg:grid-cols-12 lg:items-center">
              <Reveal className="lg:col-span-5">
                <div className="mx-auto max-w-[280px] md:max-w-[320px] lg:max-w-[360px] lg:mx-0">
                  <TeamMemberMedia
                    videoId={founder.cloudflareVideoId}
                    photoUrl={founder.photoUrl}
                    name={founder.name}
                    variant="founder"
                  />
                </div>
              </Reveal>

              <Reveal delay={120} className="lg:col-span-7">
                <h3
                  className="font-display text-ink-950 tracking-tight leading-[1.05] text-center lg:text-left"
                  style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.75rem)" }}
                >
                  {founder.name}
                </h3>
                <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-700 text-center lg:text-left">
                  {founder.role}
                </p>
                <div className="mt-6 md:mt-8 mx-auto lg:mx-0 max-w-2xl text-[16px] md:text-[17.5px] text-ink-800 leading-[1.7] text-pretty">
                  {founder.bio.split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="mb-4 last:mb-0 whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 3b - Zespół */}
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

            {/* Layout: video pionowe po lewej (~ 5/12), tekst + telefon po prawej (~ 7/12). */}
            <div className="mt-12 md:mt-18 mx-auto max-w-6xl space-y-14 md:space-y-20">
              {teamMembers.map((member, i) => (
                <Reveal key={member.id} delay={i * 100}>
                  {/* Wideo w pełnym formacie pionowym (9:16) - żeby reels/shorts grał w naturalnym
                      kadrze bez czarnych pasków po bokach. Wideo zajmuje wąską kolumnę (5/12),
                      tekst po prawej (7/12) jest wyrównany do góry. Max-width na wideo ogranicza
                      jego wysokość, dzięki czemu tekst po prawej nie wygląda na chudy nawet
                      przy krótszych biogramach. */}
                  <article className="grid gap-8 md:gap-10 lg:gap-14 lg:grid-cols-12 lg:items-start">
                    <div className="lg:col-span-5">
                      <div className="mx-auto max-w-[240px] md:max-w-[260px] lg:max-w-[280px] lg:mx-0">
                        <TeamMemberMedia
                          videoId={member.cloudflareVideoId}
                          photoUrl={member.photoUrl}
                          name={member.name}
                          variant="member"
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-7">
                      <h3 className="font-display text-[clamp(1.5rem,3vw,2.1rem)] text-ink-950 leading-tight tracking-tight">
                        {member.name}
                      </h3>
                      <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                        {member.role}
                      </p>
                      <div className="mt-5 text-[15.5px] md:text-[16px] text-ink-800 leading-[1.7] text-pretty">
                        {member.bio.split(/\n{2,}/).map((para, j) => (
                          <p key={j} className="mb-3 last:mb-0 whitespace-pre-line">
                            {para}
                          </p>
                        ))}
                      </div>
                      {member.phone ? (
                        <a
                          href={formatPhoneHref(member.phone)}
                          className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-ink-950 px-6 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-brand-500 active:scale-[0.98]"
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
                      ) : null}
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
              <p className="mt-8 md:mt-12 mx-auto max-w-2xl text-[16px] md:text-[18px] text-ink-200 leading-[1.65] text-pretty">
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
              <div className="mt-7 md:mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[16px] md:text-[18px] text-ink-800">
                <a
                  href="tel:+48510777200"
                  className="font-display text-[22px] md:text-[24px] text-brand-700 hover:text-brand-500 tabular-nums transition-colors"
                >
                  510 777 200
                </a>
                <span aria-hidden className="hidden sm:inline text-ink-300">
                  ·
                </span>
                <a
                  href="mailto:biuro@grupafibra.pl"
                  className="hover:text-brand-700 transition-colors break-all sm:break-normal"
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
