<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Fibra — backend i oferty

- Kontekst Supabase / panel / schemat: `FIBRA_SUPABASE_PANEL_CONTEXT.md`
- Publiczna lista ofert: `getAllOffers()` / `getOfferBySlug()` w `src/lib/offers-query.ts` (anon + RLS); przy błędzie lub pustej bazie — fallback do `src/lib/offers.ts`.
