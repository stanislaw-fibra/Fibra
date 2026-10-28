/**
 * Treść artykułu „Czy inwestycja w mieszkanie jest dla mnie?".
 *
 * Źródła: kurs „20 Lekcji Inwestora" (transkrypcje 20 lekcji Bartosza Nosiadka),
 * newslettery Bartosza i ustalenia z klientem w mailach (lipiec-październik 2026).
 * Twarde zasady, których pilnujemy w każdym zdaniu:
 * - żadnych gwarancji zysku ani wynajmu, rentowność zawsze jako szacunek,
 * - żadnych kwot czynszu ani wyliczeń, które ktoś mógłby wziąć za ofertę -
 *   rachunek dla konkretnego mieszkania robi specjalista (Arek),
 * - ostrożnie z kredytem: bez rat i bez „czynsz spłaci ratę",
 * - zero wzmianek o miejscach postojowych i garażach,
 * - Rybnik to centrum subregionu, nie „małe miasto",
 * - termin: odbiór budynku w maju 2028 r., klucze do dwóch miesięcy później,
 * - liczby rynkowe tylko z nazwanym źródłem i rokiem,
 * - krótko: jedna myśl na akapit, akapit najwyżej trzy zdania.
 */

import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Briefcase,
  CalendarClock,
  ChartLine,
  Clock,
  DoorOpen,
  FileSearch,
  Hourglass,
  Landmark,
  PiggyBank,
  Receipt,
  Ruler,
  Scale,
  Search,
  ShieldCheck,
  Sofa,
  TrendingUp,
  UserX,
  Wallet,
  Wrench,
} from "lucide-react";

export type IconItem = { icon: LucideIcon; title: string; body: string };

export const SUMMARY = [
  "Najem to inwestycja na kilkanaście lat.",
  "Inwestuje się nadwyżkę. Po zakupie powinna zostać rezerwa.",
  "Największe ryzyka to pustostan i najemca, który nie płaci. Oba da się ograniczyć.",
  "Zysk z najmu liczy się po kosztach i podatku, zawsze dla konkretnego mieszkania.",
];

export const FIT_YES: IconItem[] = [
  { icon: Clock, title: "Planujesz na 10 lat i dłużej", body: "Mieszkanie zarabia powoli i najwięcej daje temu, kto trzyma je długo." },
  { icon: PiggyBank, title: "Po zakupie zostaje Ci rezerwa", body: "Masz odłożone pieniądze na kilka miesięcy życia i nieprzewidziane wydatki." },
  { icon: Search, title: "Chcesz wiedzieć, w co inwestujesz", body: "Mieszkanie możesz obejrzeć, sprawdzić w księdze wieczystej i policzyć." },
  { icon: Banknote, title: "Wolisz regularny dochód od szybkiego zysku", body: "Czynsz wpływa co miesiąc, a mieszkania nie da się dodrukować." },
];

export const FIT_NO: IconItem[] = [
  { icon: Wallet, title: "Co miesiąc nic Ci nie zostaje", body: "Najpierw uporządkuj dochody i wydatki. Inwestować warto wtedy, gdy co miesiąc coś zostaje." },
  { icon: Hourglass, title: "Pieniądze mogą być potrzebne za rok lub dwa", body: "Sprzedaż mieszkania trwa tygodnie, czasem miesiące." },
  { icon: Scale, title: "Plan opiera się na kredycie bez zapasu", body: "Wyższa rata albo dwa puste miesiące i dokładasz z własnej kieszeni." },
  { icon: TrendingUp, title: "Liczysz na szybką odsprzedaż z zyskiem", body: "W krótkim okresie ceny potrafią stać w miejscu." },
];

/** Każda liczba ma źródło i rok - tak, jak podawał je Bartosz w lekcjach 1-6. */
export const MARKET_FIGURES = [
  { value: "12,7%", label: "gospodarstw domowych w Polsce wynajmuje mieszkanie. W UE średnio około 30%.", source: "PIE, Eurostat" },
  { value: "392", label: "mieszkania na 1000 osób w Polsce, o 26% mniej niż średnio w UE.", source: "OPMiR, 2023" },
  { value: "2,7%", label: "bezrobocia w Polsce, drugi najniższy wynik w Unii.", source: "BAEL, 2025" },
  { value: "+160%", label: "podaży pieniądza w latach 2015-2025. Ceny mieszkań w dużych miastach mniej więcej się podwoiły.", source: "NBP" },
];

export type Risk = { icon: LucideIcon; title: string; risk: string; help: string };

export const RISKS: Risk[] = [
  {
    icon: UserX,
    title: "Najemca, który nie płaci",
    risk: "Sprawa o eksmisję w sądzie trwa zwykle od półtora roku do trzech lat. Przy mieszkaniu na kredyt strata potrafi przekroczyć 200\u00a0000\u00a0zł.",
    help: "Najem okazjonalny z poddaniem się egzekucji u notariusza, sprawdzenie najemcy w bazach dłużników i kaucja w wysokości dwóch czynszów.",
  },
  {
    icon: DoorOpen,
    title: "Pustostan",
    risk: "Puste mieszkanie nie zarabia, a opłaty do wspólnoty trzeba płacić dalej.",
    help: "Ogłoszenie na pierwszej stronie portalu, profesjonalne zdjęcia, cena dopasowana do rynku i niskie rachunki za ogrzewanie. Do wyliczeń przyjmujemy około 5% pustostanu w roku.",
  },
  {
    icon: Clock,
    title: "Twój czas",
    risk: "Telefon o 21:30 w sprawie rachunku za ogrzewanie, zalane mieszkanie piętro niżej, skarga sąsiada. Przy kilku mieszkaniach robi się z tego drugi etat.",
    help: "Zarządzanie najmem za procent od czynszu. Bartosz Nosiadek swoje mieszkania też oddaje w zarządzanie naszej firmie.",
  },
  {
    icon: Wrench,
    title: "Zużycie i naprawy",
    risk: "Sprzęt się psuje, ściany trzeba odmalować, po kilku latach wymienić część wyposażenia.",
    help: "Stała rezerwa odkładana z każdego czynszu.",
  },
  {
    icon: Hourglass,
    title: "Płynność",
    risk: "Mieszkania nie sprzedasz w jeden dzień, a sprzedaż w pośpiechu zwykle oznacza niższą cenę.",
    help: "Lokuj w najem tylko pieniądze, których nie potrzebujesz przez lata.",
  },
  {
    icon: ChartLine,
    title: "Ceny mieszkań",
    risk: "W długim okresie rosły, ale bywały lata, w których stały albo lekko spadały.",
    help: "Licz najem tak, żeby bronił się bez zakładania wzrostu cen.",
  },
  {
    icon: Landmark,
    title: "Kredyt",
    risk: "Kredyt zwiększa zysk, gdy wszystko idzie dobrze, i kłopot, gdy coś pójdzie źle. Rata nie poczeka na nowego najemcę.",
    help: "Policz wariant z dwoma pustymi miesiącami i wyższym oprocentowaniem. Nie planuj na styk.",
  },
  {
    icon: Receipt,
    title: "Podatek",
    risk: "Ryczałt wynosi 8,5% do 100\u00a0000\u00a0zł przychodu w roku, powyżej 12,5%. Liczy się go od czynszu, bez odliczania kosztów.",
    help: "Przy kilku mieszkaniach albo wspólności majątkowej porozmawiaj z księgowym.",
  },
  {
    icon: CalendarClock,
    title: "Czekanie na klucze",
    risk: "Przy zakupie na etapie budowy czynsz zaczyna wpływać dopiero po odbiorze i pierwszym wynajęciu.",
    help: "Wpłaty rozkładają się na transze według postępu budowy.",
  },
];

/** Grafika rachunku: bez kwot, sam porządek odejmowania. Szerokość paska w %. */
export const CALC_STEPS = [
  { sign: "+", label: "Czynsz za 12 miesięcy", width: 100 },
  { sign: "−", label: "Miesiące bez najemcy", width: 95 },
  { sign: "−", label: "Zarządzanie najmem", width: 86 },
  { sign: "−", label: "Podatek", width: 78 },
  { sign: "−", label: "Rezerwa na naprawy", width: 73 },
];

export const CHOICE: IconItem[] = [
  { icon: Briefcase, title: "Praca w okolicy", body: "Ludzie idą za pracą. Najlepiej, gdy w okolicy zatrudnia wiele firm, bo zamknięcie jednego zakładu nie zabiera wtedy wszystkich najemców." },
  { icon: Sofa, title: "Wygoda", body: "Wygrywa mieszkanie, w którym od razu da się zamieszkać: gotowa łazienka, klimatyzacja, niskie rachunki." },
  { icon: Ruler, title: "Metraż", body: "Kawalerka daje zwykle wyższy procent, większe mieszkanie stabilniejszych najemców. Jeśli możesz, miej w portfelu oba typy." },
  { icon: FileSearch, title: "Stan prawny", body: "Przeczytaj całą księgę wieczystą i prospekt informacyjny. Sprawdź hipoteki, roszczenia i rachunek powierniczy." },
  { icon: ShieldCheck, title: "Stan techniczny", body: "Zapytaj o ściany, izolację, ogrzewanie i armaturę. Dobra armatura kosztuje więcej, ale jest raz zapłacona i z głowy." },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Ile pieniędzy trzeba mieć na start?",
    a: "Przy zakupie od dewelopera nie płacisz całej kwoty od razu. Po rezerwacji podpisujesz umowę deweloperską, a wpłaty rozkładają się na transze według postępu budowy.",
  },
  {
    q: "Czy mogę kupić mieszkanie na kredyt?",
    a: "Możesz, ale podchodzimy do tego ostrożnie. Policz wariant z pustym mieszkaniem i wyższą ratą. Za pośrednictwo finansowe nie pobieramy od klienta prowizji.",
  },
  {
    q: "Czy muszę sam zajmować się najmem?",
    a: "Nie. Możemy szukać najemcy, podpisać umowę najmu okazjonalnego, pilnować płatności i usterek. Za miesiąc, w którym mieszkanie stoi puste, nie płacisz.",
  },
  {
    q: "Czy gwarantujecie wynajęcie mieszkania?",
    a: "Nie, nikt uczciwie nie może tego zagwarantować. Możemy pokazać, jak wynajmują się mieszkania, którymi już zarządzamy.",
  },
  {
    q: "Jaka jest stopa zwrotu?",
    a: "Szacowana rentowność brutto mieszkań na Osiedlu Zamysłów wynosi 5,7-6,9% rocznie. To szacunek, a nie gwarancja zysku. Wyliczenie dla konkretnego mieszkania przygotuje nasz specjalista.",
  },
  {
    q: "Dlaczego Rybnik, a nie duże miasto?",
    a: "W dużych miastach cena zakupu jest znacznie wyższa, więc procent z najmu zwykle wychodzi niższy. Rybnik jest centrum subregionu z setkami tysięcy mieszkańców.",
  },
  {
    q: "Kiedy mogę dostać klucze?",
    a: "Odbiór nowego budynku na Osiedlu Zamysłów planujemy na maj 2028 roku. Klucze wydajemy do dwóch miesięcy później, po indywidualnych aktach notarialnych.",
  },
  {
    q: "Co z lokatą albo obligacjami?",
    a: "Są prostsze i łatwiej z nich wypłacić pieniądze. Mieszkanie daje czynsz i majątek, który można zobaczyć. Wiele osób dzieli kapitał: część trzyma na lokacie albo w obligacjach, a część w mieszkaniu.",
  },
];
