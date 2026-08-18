import { z } from "zod";
import { findUserByEmail, createPasswordReset } from "@/lib/repo";

// Запрос на сброс пароля. Создаёт токен; ссылку админ передаёт пользователю.
// Ответ всегда одинаковый — не раскрываем, существует ли аккаунт.
const schema = z.object({ email: z.string().trim().email("Некорректный e-mail") });

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
  const user = await findUserByEmail(parsed.data.email);
  if (user) await createPasswordReset(user.id);
  return Response.json({ ok: true });
}
