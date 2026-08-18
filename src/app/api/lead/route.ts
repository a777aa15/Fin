import { z } from "zod";
import { cookies } from "next/headers";
import { createLead, markVisitorConverted } from "@/lib/repo";
import { VISITOR_COOKIE } from "@/app/api/track/route";

// Приём заявки с формы записи (лендинг/модалка). Публичный роут.
const schema = z
  .object({
    name: z.string().trim().max(120).optional(),
    email: z.string().trim().max(160).optional(),
    contact: z.string().trim().max(160).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((d) => (d.email && d.email.length > 0) || (d.contact && d.contact.length > 0), {
    message: "Укажите контакт",
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  let { email } = parsed.data;
  const { name, contact, note } = parsed.data;
  // Если e-mail не задан, а контакт похож на e-mail — используем его как e-mail (для дедупа).
  if ((!email || email.length === 0) && contact && EMAIL_RE.test(contact)) {
    email = contact;
  }

  const { duplicate } = await createLead({
    name: name ?? null,
    email: email ?? null,
    contact: contact ?? null,
    note: note ?? null,
  });

  // отметить посетителя как «оставил заявку» (для конверсии)
  const vid = (await cookies()).get(VISITOR_COOKIE)?.value;
  if (vid) await markVisitorConverted(vid);

  return Response.json({ ok: true, duplicate });
}
