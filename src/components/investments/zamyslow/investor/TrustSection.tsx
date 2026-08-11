"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { TeamMemberMedia } from "@/components/team/TeamMemberMedia";
import { ZAMYSLOW_PHONE } from "@/lib/investments/zamyslow-data";

const ease = [0.22, 1, 0.36, 1] as const;

/** Założyciel z autoprezentacją - dane lecą z Supabase (`agents`) przez stronę. */
export type TrustFounder = {
  name: string;
  role: string;
  /** Cloudflare Stream ID. Bez niego blok z filmem się nie renderuje. */
  videoId: string;
  /** Portret z bazy - jest zarazem miniaturą filmu (patrz TeamMemberMedia). */
  photoUrl?: string;
};

/**
 * Opiekun inwestycji (Arek) - osoba, z którą kupujący faktycznie rozmawia.
 * `videoId` opcjonalne: gdy w bazie pojawi się autoprezentacja wideo, blok
 * sam podmieni portret na odtwarzacz - bez zmian w kodzie.
 */
export type TrustAgent = {
  name: string;
  role: string;
  photoUrl?: string;
  videoId?: string;
  /** Krótka autoprezentacja (1. akapit bio z bazy). */
  bio?: string;
};

// Punkty zaufania oparte na sposobie działania (proces, jawność), a nie na
// deklaracjach typu "najlepsi". Twarde liczby (lata na rynku, mieszkania
// w zarządzaniu, liczba inwestorów) żyją osobno w `zamyslow-proof.ts` i lądują
// w pasku nad tą sekcją - najmocniej działa konkret, nie przymiotnik.
const pillars = [
  {
    title: "Deweloper z 20-letnim doświadczeniem",
    body: "Inwestycję prowadzi Grupa Fibra Sp. z o.o. - z biurem, zespołem i konkretnymi osobami, z którymi będziesz w kontakcie przed i po zakupie mieszkania.",
  },
  {
    // Bez czynszu i rentowności przy lokalach: klient nie publikuje tych liczb
    // na stronie, wylicza je indywidualnie specjalista.
    title: "Pełna przejrzystość oferty",
    body: "Nie każemy niczego wyliczać. Przy każdym mieszkaniu znajdziesz cenę, metraż i dostępność. Szacowaną rentowność oraz przewidywany czynsz obliczy dla Ciebie nasz specjalista, zapraszamy do kontaktu.",
  },
  {
    title: "Mamy własny dział zarządzania najmem",
    body: "Najmem mieszkań na naszym osiedlu zajmujemy się od lat. Dzięki temu wiemy, jak wygląda rzeczywistość: ile trwa znalezienie najemców i czego oni oczekują.",
  },
  {
    title: "Nie trać czasu na infolinię",
    body: "Od pierwszej rozmowy aż po odbiór mieszkania będzie towarzyszył Ci dedykowany specjalista, z którym będziesz miał bezpośredni kontakt.",
  },
];

export function TrustSection({
  founder,
  agent,
}: {
  founder?: TrustFounder | null;
  agent?: TrustAgent | null;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-paper py-24 md:py-32">
      <div className="container-xl">
        <div className="grid gap-x-14 gap-y-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="eyebrow flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-brand-500" />
              Czy mogę zaufać?
            </p>
            <h2 className="mt-6 font-display fluid-h2 text-ink-950">
              Kiedy inwestujesz pieniądze,{" "}
              <em className="italic text-brand-600">warto wiedzieć, komu je powierzasz.</em>
            </h2>
          </div>
          <p className="max-w-[48ch] text-[17px] leading-relaxed text-ink-600 lg:pb-1.5">
            Zakup mieszkania inwestycyjnego to decyzja na lata. Dlatego
            pokazujemy nie tylko ofertę, ale również ludzi, doświadczenie
            i liczby, na których możesz się oprzeć.
          </p>
        </div>

        {/* Autoprezentacja założyciela - najmocniejszy dowód w sekcji o zaufaniu,
            więc idzie przed kafelkami. Bez filmu w bazie blok znika i sekcja
            wygląda jak wcześniej. */}
        {founder ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
            className="mt-14 overflow-hidden rounded-[var(--radius-lg)] bg-ink-950 text-white shadow-[var(--shadow-cinematic)]"
          >
            <div className="grid items-center gap-9 p-6 sm:p-8 md:gap-14 md:p-10 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
              {/* Jak hero kursu: statyczna miniatura z twarzą + Play, film startuje
                  dopiero po kliknięciu (z dźwiękiem) - bez autoodtwarzania,
                  które pokazywało puste pierwsze sekundy nagrania. */}
              <TeamMemberMedia
                videoId={founder.videoId}
                photoUrl={founder.photoUrl}
                autoplay={false}
                name={founder.name}
                className="mx-auto w-full max-w-[19rem]"
              />
              <div>
                <p className="eyebrow eyebrow-on-dark flex items-center gap-3">
                  <span className="inline-block h-px w-8 bg-accent-400" />
                  Poznaj założyciela
                </p>
                <p className="mt-6 font-display text-[26px] leading-tight text-white md:text-[30px]">
                  {founder.name}
                </p>
                <p className="mt-1.5 text-[14px] text-white/50">{founder.role}</p>
                <p className="mt-6 max-w-[52ch] text-[16px] leading-relaxed text-white/70">
                  Zanim zdecydujesz, komu powierzasz pieniądze, posłuchaj, jak
                  pracujemy i czego możesz od nas oczekiwać przed zakupem
                  mieszkania oraz po nim.
                </p>
                <a
                  href="#kontakt"
                  className="group mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/20 px-6 py-3 text-[14px] font-medium text-white transition-colors duration-300 hover:border-accent-400 hover:bg-accent-400 hover:text-ink-950"
                >
                  Porozmawiajmy o inwestycji
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Opiekun inwestycji - to z nim kupujący faktycznie rozmawia, więc
            dostaje twarz i nazwisko zaraz po założycielu. Jasna karta jako
            para do granatowej - te same proporcje, odwrócony ciężar. */}
        {agent ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
            className="mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/70 bg-white shadow-[var(--shadow-card)]"
          >
            <div className="grid items-center gap-9 p-6 sm:p-8 md:gap-14 md:p-10 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
              {agent.videoId ? (
                <TeamMemberMedia
                  videoId={agent.videoId}
                  photoUrl={agent.photoUrl}
                  autoplay={false}
                  name={agent.name}
                  className="mx-auto w-full max-w-[15rem]"
                />
              ) : agent.photoUrl ? (
                <div className="relative mx-auto aspect-[4/5] w-full max-w-[15rem] overflow-hidden rounded-[var(--radius-md)] bg-paper-warm">
                  <Image
                    src={agent.photoUrl}
                    alt={`Zdjęcie - ${agent.name}`}
                    fill
                    sizes="240px"
                    className="object-cover object-top"
                    quality={82}
                  />
                </div>
              ) : null}
              <div>
                <p className="eyebrow flex items-center gap-3">
                  <span className="inline-block h-px w-8 bg-brand-500" />
                  Twój opiekun inwestycji
                </p>
                <p className="mt-6 font-display text-[26px] leading-tight text-ink-950 md:text-[30px]">
                  {agent.name}
                </p>
                <p className="mt-1.5 text-[14px] text-ink-500">{agent.role}</p>
                {agent.bio ? (
                  <p className="mt-6 max-w-[52ch] text-[16px] leading-relaxed text-ink-600">
                    {agent.bio}
                  </p>
                ) : null}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href={`tel:${ZAMYSLOW_PHONE.tel}`}
                    className="inline-flex items-center gap-2.5 rounded-full bg-ink-900 px-6 py-3 text-[14px] font-medium text-white transition-colors duration-300 hover:bg-brand-500"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.07 2H7a2 2 0 0 1 2 1.72c.13.9.35 1.78.66 2.62a2 2 0 0 1-.45 2.11L7.9 9.77a16 16 0 0 0 6 6l1.32-1.32a2 2 0 0 1 2.11-.45c.84.3 1.72.53 2.62.66A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {ZAMYSLOW_PHONE.display}
                  </a>
                  <a
                    href="#kontakt"
                    className="inline-flex items-center gap-2 rounded-full border border-ink-950/15 px-6 py-3 text-[14px] font-medium text-ink-800 transition-colors hover:border-ink-950/40"
                  >
                    Umów rozmowę
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}

        <div className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-ink-200/70 bg-ink-200/70 sm:grid-cols-2">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease, delay: i * 0.08 }}
              className="bg-white p-8 md:p-10"
            >
              <h3 className="font-display text-[20px] text-ink-950">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
