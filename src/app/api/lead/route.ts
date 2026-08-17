import { z } from "zod";
import { cookies } from "next/headers";
import { createLead, markVisitorConverted } from "@/lib/repo";
import { VISITOR_COOKIE } from "@/app/api/track/route";

// Приём заявки с формы записи (лендинг). Публичный роут.
const schema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.email("Некорректный e-mail"),
  contact: z.string().trim().max(160).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Ошибка данных" }, { status: 400 });
  }
  const { name, email, contact } = parsed.data;
  await createLead({ name: name ?? null, email, contact: contact ?? null });

  // отметить посетителя как «оставил заявку» (для конверсии)
  const vid = (await cookies()).get(VISITOR_COOKIE)?.value;
  if (vid) await markVisitorConverted(vid);

  return Response.json({ ok: true });
}
