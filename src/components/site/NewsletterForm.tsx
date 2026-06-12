"use client";

import { useState } from "react";
import { submitLead } from "@/lib/leads-client";
import { EMAIL_ERROR_MESSAGE, isValidEmail } from "@/lib/email-validation";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="max-w-sm">
      <form
        className="flex gap-2"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (sending) return;
          if (!isValidEmail(email)) {
            setError(EMAIL_ERROR_MESSAGE);
            return;
          }
          setError(null);
          setSending(true);
          try {
            await submitLead({
              source: "newsletter_footer",
              email,
              newsletter_consent: true,
              message: null,
              phone: null,
              full_name: null,
            });
            setEmail("");
          } finally {
            setSending(false);
          }
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Twój e-mail"
          className="flex-1 bg-white/5 border border-white/10 focus:border-accent-400 focus:bg-white/10 rounded-full px-5 py-3 text-[14px] text-white placeholder:text-ink-500 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={sending}
          className={[
            "px-5 py-3 text-ink-950 text-[13px] font-medium rounded-full transition-colors",
            sending ? "bg-accent-400/70 cursor-wait" : "bg-accent-400 hover:bg-accent-500",
          ].join(" ")}
        >
          Zapisz się
        </button>
      </form>
      {error ? <p className="mt-2 text-[13px] text-accent-300">{error}</p> : null}
    </div>
  );
}
