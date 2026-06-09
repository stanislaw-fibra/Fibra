"use client";

import { useState } from "react";
import { submitLead } from "@/lib/leads-client";

type Status = "idle" | "sending" | "done" | "error";

/** Zapis do newslettera wewnątrz portalu kursu: audiobook książki + streszczenie
    rysunkowe za zapis. Korzysta z tego samego API leadów co reszta strony
    (source newsletter_footer, zgoda na newsletter). Po sukcesie pokazuje
    potwierdzenie zamiast cicho czyścić pole. */
export function NewsletterCourseBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      await submitLead({
        source: "newsletter_footer",
        email,
        newsletter_consent: true,
        full_name: null,
        phone: null,
        message: "Zapis z portalu kursu - audiobook + streszczenie",
      });
      setEmail("");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-brand-400/40 bg-brand-400/10 px-6 py-5">
        <p className="font-display text-[1.4rem] leading-tight text-white">
          Gotowe, dziękuję za zapis.
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-200">
          Audiobook i streszczenie rysunkowe wyślę na Twój adres. Zajrzyj do
          skrzynki (sprawdź też folder ofert lub spam).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Twój e-mail"
          className="flex-1 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-[14px] text-white placeholder:text-ink-400 transition-colors focus:border-accent-400 focus:bg-white/10 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className={[
            "shrink-0 rounded-full px-6 py-3 text-[14px] font-medium text-ink-950 transition-colors",
            status === "sending"
              ? "cursor-wait bg-accent-400/70"
              : "bg-accent-400 hover:bg-accent-500",
          ].join(" ")}
        >
          {status === "sending" ? "Zapisuję..." : "Zapisz się"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-[13px] text-accent-300">
          Coś nie zadziałało. Spróbuj ponownie za chwilę.
        </p>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-ink-400">
        Zero spamu. W każdej chwili możesz się wypisać jednym kliknięciem.
      </p>
    </form>
  );
}
