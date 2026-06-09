/**
 * Lekcje kursu "20 Lekcji Inwestora".
 * `videoId` to UID z Cloudflare Stream. Tytuły uporządkowane z nazw plików.
 *
 * UWAGA: docelowo lista lekcji powinna jechać z Supabase (panel), żeby Bartek
 * dodawał kolejne bez deploya. Na start trzymamy ją tu - komplet 20 lekcji jest
 * już nagrany i podpięty.
 */
export type Lesson = {
  /** Numer lekcji w kursie (1-20). */
  n: number;
  title: string;
  /** Krótki opis - co widz wyniesie z lekcji. */
  blurb: string;
  /**
   * Cloudflare Stream UID. Dla lekcji osadzonej z YouTube (patrz `youtubeId`)
   * pozostaje pusty, ale i tak musi być unikalny - używamy go jako klucza/identyfikatora
   * lekcji w całym portalu (postęp, zapisane pozycje). Dla YT podajemy tu wartość
   * w formacie `yt-<id>`.
   */
  videoId: string;
  /**
   * Gdy lekcja jest filmem z YouTube (np. wywiad), podajemy tu samo ID wideo
   * (część po `v=`). Player osadza wtedy odtwarzacz YouTube zamiast Cloudflare
   * Stream. SDK Cloudflare (wznawianie, auto-„obejrzane") nie działa dla YT -
   * zostaje ręczne oznaczanie jako obejrzane.
   */
  youtubeId?: string;
  /** Do którego modułu należy lekcja (patrz MODULES). */
  module: number;
  /** Długość filmu w sekundach (pobrane z Cloudflare Stream API). */
  durationSec: number;
  /**
   * Opcjonalna własna okładka/miniatura (ścieżka w /public, np.
   * "/kurs/lekcje/lekcja-01.jpg"). Format 16:9, 1920×1080. Gdy puste - portal
   * używa klatki z Cloudflare Stream jako fallbacku.
   */
  poster?: string;
  /**
   * Lekcja-teaser dostępna za darmo (pokazujemy ją na landing page jako próbkę
   * kursu). Tylko jedna lekcja powinna mieć `free: true`.
   */
  free?: boolean;
};

export type CourseModule = {
  id: number;
  title: string;
  /** Jedno zdanie: co daje ten moduł. */
  summary: string;
};

/**
 * Moduły kursu - grupują lekcje w sekcje (jak rozdziały). Pięć modułów spójnych
 * z landing page (/kurs-20-lekcji-inwestora): ten sam podział i ta sama
 * kolejność tematów, żeby kupujący zobaczył w portalu to, co obiecaliśmy.
 */
export const MODULES: CourseModule[] = [
  {
    id: 1,
    title: "Rynek i trendy",
    summary: "Jak naprawdę działa popyt, podaż i ceny na rynku najmu.",
  },
  {
    id: 2,
    title: "Ceny i rentowność",
    summary: "Co pcha ceny w górę i jak liczyć opłacalność najmu.",
  },
  {
    id: 3,
    title: "Jak wybrać i sprawdzić nieruchomość",
    summary: "Stan prawny, lokalizacja i stan techniczny przed zakupem.",
  },
  {
    id: 4,
    title: "Najem w praktyce",
    summary: "Bezpieczna umowa, mniej pustostanów i spokojne zarządzanie.",
  },
  {
    id: 5,
    title: "Za kulisami",
    summary: "Jak budujemy i wykańczamy mieszkania pod najem - szczerze o naszej pracy.",
  },
];

export const LESSONS: Lesson[] = [
  {
    n: 1,
    title: "Rynek najmu",
    blurb: "Od czego zacząć i jak naprawdę wygląda rynek najmu w Polsce.",
    videoId: "d9a8cd744fadab95cbe4f6a95acec108",
    module: 1,
    durationSec: 241,
    poster: "/kurs/lekcje/lekcja-01.jpg",
  },
  {
    n: 2,
    title: "Fundusze mieszkań na wynajem",
    blurb: "Kto dziś skupuje mieszkania pod najem i co to znaczy dla Ciebie.",
    videoId: "82d6fc385d8ce18fbe6b99ec2e0665ab",
    module: 1,
    durationSec: 409,
    poster: "/kurs/lekcje/lekcja-02.jpg",
  },
  {
    n: 3,
    title: "Głód mieszkaniowy",
    blurb: "Skąd bierze się popyt, który napędza ceny i czynsze.",
    videoId: "b8fc622c6d4f1ffcd99f9aa9a1527485",
    module: 1,
    durationSec: 554,
    poster: "/kurs/lekcje/lekcja-03.jpg",
  },
  {
    n: 4,
    title: "Ludzie podążają za pracą",
    blurb: "Jak migracje za pracą wyznaczają lokalizacje, które się wynajmą.",
    videoId: "2142f5fce4cd01ec052a08bf16686bbb",
    module: 1,
    durationSec: 525,
    poster: "/kurs/lekcje/lekcja-04.jpg",
  },
  {
    n: 5,
    title: "Wygoda wygrywa",
    blurb: "Dlaczego wygoda najemcy decyduje o tym, co się wynajmuje, a co stoi.",
    videoId: "9dd2a95009e2fdd57c9ccc25faff9ebc",
    module: 1,
    durationSec: 728,
    poster: "/kurs/lekcje/lekcja-05.jpg",
  },
  {
    n: 6,
    title: "Czy mamy bańkę na rynku nieruchomości",
    blurb: "Jak czytać ryzyko bańki bez popadania w panikę.",
    videoId: "0bcc0c73f5397db3b4a3a4e720101f47",
    module: 1,
    durationSec: 1120,
    poster: "/kurs/lekcje/lekcja-06.jpg",
  },
  {
    n: 7,
    title: "Aktualizacja z budowy",
    blurb: "Z placu budowy: jak w praktyce powstaje mieszkanie pod najem.",
    videoId: "48b80c5c88902f66f692cf048a7cd0f0",
    module: 5,
    durationSec: 552,
    poster: "/kurs/lekcje/lekcja-07.jpg",
  },
  {
    n: 8,
    title: "Dlaczego nieruchomości drożeją",
    blurb: "Co realnie pcha ceny w górę w dłuższym horyzoncie.",
    videoId: "a5d90f16f4d582a8ff02b228274f405c",
    module: 2,
    durationSec: 894,
    poster: "/kurs/lekcje/lekcja-08.jpg",
  },
  {
    n: 9,
    title: "Jak poradzić sobie z uciekającą ceną",
    blurb: "Co robić, gdy ceny rosną szybciej, niż zdążasz kupić.",
    videoId: "a52074c3607ae08360d9fee83d8e3727",
    module: 2,
    durationSec: 730,
    poster: "/kurs/lekcje/lekcja-09.jpg",
    free: true,
  },
  {
    n: 10,
    title: "Jak sprawdzić stan prawny przed zakupem",
    blurb: "Czego nie wolno pominąć w księdze wieczystej i dokumentach.",
    videoId: "ef68ed2a9625c2801099d2550d41a540",
    module: 3,
    durationSec: 941,
    poster: "/kurs/lekcje/lekcja-10.jpg",
  },
  {
    n: 11,
    title: "Jak wykańczamy mieszkania",
    blurb: "Kolejna aktualizacja z budowy: wykończenie pod wynajem krok po kroku.",
    videoId: "ddca34fb25914db07d83d63c17a4fa64",
    module: 5,
    durationSec: 372,
    poster: "/kurs/lekcje/lekcja-11.jpg",
  },
  {
    n: 12,
    title: "Lokalizacja, która się wynajmie",
    blurb: "Na co patrzeć przy wyborze miejsca, żeby mieszkanie nie stało puste.",
    videoId: "30d92c24f959de23f5e5d76e71d78790",
    module: 3,
    durationSec: 680,
    poster: "/kurs/lekcje/lekcja-12.jpg",
  },
  {
    n: 13,
    title: "Analiza stanu technicznego",
    blurb: "Co sprawdzić w mieszkaniu i budynku, zanim podpiszesz umowę.",
    videoId: "87a0f0bd60532b2328803d7dbaf91487",
    module: 3,
    durationSec: 909,
    poster: "/kurs/lekcje/lekcja-13.jpg",
  },
  {
    n: 14,
    title: "Czy deweloper może być uczciwy - rozmowa",
    blurb: "Szczera rozmowa o tym, jak wygląda nasza praca od środka. Gość: Bartosz Nosiadek.",
    videoId: "yt-hlfh_xXY4kY",
    youtubeId: "hlfh_xXY4kY",
    module: 5,
    durationSec: 3761,
  },
  {
    n: 15,
    title: "Jak dajemy więcej, niż obiecujemy",
    blurb: "Na przykładzie naszego osiedla: gdzie dokładamy ponad standard i dlaczego.",
    videoId: "35f0e18003c24710b4bf7221567050dc",
    module: 5,
    durationSec: 438,
    poster: "/kurs/lekcje/lekcja-15.jpg",
  },
  {
    n: 16,
    title: "Jak ograniczać pustostany",
    blurb: "Co robić, żeby mieszkanie wynajmowało się szybko i stało puste jak najkrócej.",
    videoId: "bdf17db28b9d0f324691a4d7a807557c",
    module: 4,
    durationSec: 446,
    poster: "/kurs/lekcje/lekcja-16.jpg",
  },
  {
    n: 17,
    title: "Kawalerka czy M4",
    blurb: "Co bardziej opłaca się na wynajem i kiedy większy metraż ma sens.",
    videoId: "5f1a0c6f385aa42810715974960accf7",
    module: 2,
    durationSec: 234,
    poster: "/kurs/lekcje/lekcja-17.jpg",
  },
  {
    n: 18,
    title: "Jak bezpiecznie wynająć mieszkanie",
    blurb: "Najem okazjonalny i umowa, która chroni Cię, gdy coś pójdzie nie tak.",
    videoId: "c7226d94ec9d5aafb6f1cb0899f1272d",
    module: 4,
    durationSec: 1186,
    poster: "/kurs/lekcje/lekcja-18.jpg",
  },
  {
    n: 19,
    title: "Co daje zarządzanie najmem",
    blurb: "Kiedy warto oddać najem w zarządzanie i co z tego masz.",
    videoId: "41b5b473b4f359868e3bd9769bc6af85",
    module: 4,
    durationSec: 657,
    poster: "/kurs/lekcje/lekcja-19.jpg",
  },
  {
    n: 20,
    title: "Podsumowanie kursu",
    blurb: "Najważniejsze wnioski z całego kursu zebrane w jednym miejscu.",
    videoId: "c723d49acf2cd92282979f05b728ccf1",
    module: 5,
    durationSec: 359,
    poster: "/kurs/lekcje/lekcja-20.jpg",
  },
];

/** Ile lekcji liczy docelowo cały kurs (do paska postępu / komunikatu). */
export const TOTAL_LESSONS = 20;

/** Darmowa lekcja-teaser (do pokazania na landing page). null, gdy żadnej nie oznaczono. */
export function getFreeLesson(): Lesson | null {
  return LESSONS.find((l) => l.free) ?? null;
}

/** Krótki czas lekcji, np. „4 min" (zaokrąglone w górę do pełnej minuty). */
export function formatLessonLength(sec: number): string {
  const min = Math.max(1, Math.round(sec / 60));
  return `${min} min`;
}

/** Łączny czas zbioru lekcji, np. „1 h 58 min" lub „48 min". */
export function formatTotalLength(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
