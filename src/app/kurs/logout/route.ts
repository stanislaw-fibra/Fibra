import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { KURS_ACCESS_COOKIE } from "@/lib/kurs-access";

export const runtime = "nodejs";

/** Wylogowanie z portalu kursu: czyści cookie dostępu i wraca na bramkę. */
export async function GET(request: Request) {
  const store = await cookies();
  store.delete(KURS_ACCESS_COOKIE);
  return NextResponse.redirect(new URL("/kurs/login", request.url));
}
