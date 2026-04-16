"use client";

export function NewsletterForm() {
  return (
    <form className="flex gap-2 max-w-sm" onSubmit={(e) => e.preventDefault()}>
      <input
        type="email"
        required
        placeholder="Twój e-mail"
        className="flex-1 bg-white/5 border border-white/10 focus:border-accent-400 focus:bg-white/10 rounded-full px-5 py-3 text-[14px] text-white placeholder:text-ink-500 focus:outline-none transition-colors"
      />
      <button
        type="submit"
        className="px-5 py-3 bg-accent-400 hover:bg-accent-500 text-ink-950 text-[13px] font-medium rounded-full transition-colors"
      >
        Zapisz się
      </button>
    </form>
  );
}
