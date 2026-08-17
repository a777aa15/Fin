import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { trackVisitor } from "@/lib/repo";

export const VISITOR_COOKIE = "fa_visitor";
const YEAR = 60 * 60 * 24 * 365;

// Беакон посетителя: выдаёт cookie-идентификатор и учитывает уникальный визит.
export async function POST() {
  const store = await cookies();
  let vid = store.get(VISITOR_COOKIE)?.value;
  if (!vid) {
    vid = randomUUID();
    store.set(VISITOR_COOKIE, vid, { httpOnly: true, sameSite: "lax", path: "/", maxAge: YEAR });
  }
  await trackVisitor(vid);
  return Response.json({ ok: true });
}
