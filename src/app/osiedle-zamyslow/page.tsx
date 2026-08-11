import type { Metadata } from "next";
import { ZamyslowFooter } from "@/components/investments/zamyslow/ZamyslowFooter";
import { ZamyslowNav } from "@/components/investments/zamyslow/ZamyslowNav";
import { ZamyslowExperience } from "@/components/investments/zamyslow/ZamyslowExperience";

export const metadata: Metadata = {
  title: "Osiedle Zamysłów - Inwestycja premium | Fibra Nieruchomości",
  description:
    "Poznaj Osiedle Zamysłów: interaktywny podgląd pięter, rzuty mieszkań i aktualne statusy lokali.",
  alternates: { canonical: "/osiedle-zamyslow" },
};

export default function OsiedleZamyslowPage() {
  return (
    <>
      <ZamyslowNav experience="osiedle" />
      <main className="flex-1 pt-[72px]">
        <ZamyslowExperience />
      </main>
      <ZamyslowFooter experience="osiedle" />
    </>
  );
}
