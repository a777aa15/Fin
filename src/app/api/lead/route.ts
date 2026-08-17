import { z } from "zod";
import { createLead } from "@/lib/repo";

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
  return Response.json({ ok: true });
}
