import "server-only";
import { getPanelRouteUser } from "@/lib/supabase/route-handler-auth";

// Wspólna autoryzacja dla endpointów wołanych przez cron Vercela ORAZ ręcznie z panelu.
//
// DLACZEGO dwa sekrety:
// Vercel Cron, jeśli ustawiony jest env CRON_SECRET, sam dokłada nagłówek
// `Authorization: Bearer ${CRON_SECRET}` do każdego zaplanowanego żądania.
// My historycznie chroniliśmy te endpointy własnym IMPORT_SECRET (ręczne wywołania,
// panel). Jeśli IMPORT_SECRET != CRON_SECRET, cron dostaje 401 i NIC nie importuje
// (dokładnie ten objaw: GET /api/import → 401, User-Agent vercel-cron/1.0).
//
// Zamiast wymuszać równość env-ów, akceptujemy Bearer pasujący do KTÓREGOKOLWIEK
// z dwóch sekretów - dzięki temu działa i cron (CRON_SECRET), i ręczne/panelowe
// wywołania (IMPORT_SECRET), niezależnie od tego, czy ktoś je zrówna.
export async function isCronOrAdminAuthorized(req: Request): Promise<boolean> {
  const importSecret = process.env.IMPORT_SECRET?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  const validBearers = [importSecret, cronSecret].filter(
    (s): s is string => !!s && s.length > 0,
  );

  if (validBearers.length > 0) {
    const auth = req.headers.get("authorization")?.trim() || "";
    if (auth.startsWith("Bearer ")) {
      const token = auth.slice(7).trim();
      if (validBearers.includes(token)) return true;
    }
    // Alternatywny nagłówek dla ręcznych wywołań (np. z naszego panelu / skryptów).
    const xHeader = req.headers.get("x-import-secret")?.trim();
    if (xHeader && importSecret && xHeader === importSecret) return true;
  }

  // Drugi wariant: zalogowany admin z panelu (ręczny przycisk "Zaimportuj teraz").
  const user = await getPanelRouteUser();
  return !!user;
}
