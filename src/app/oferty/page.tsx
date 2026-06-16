import { redirect } from "next/navigation";

// Katalog przeniesiony na stronę główną (/). /oferty przekierowuje na / z
// zachowaniem parametrów (np. ?agent=, ?view=, ?category=), żeby stare linki,
// filtry agenta i deep-linki dalej działały.
type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OfertyRedirect({ searchParams }: Props) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const q = qs.toString();
  redirect(q ? `/?${q}` : "/");
}
