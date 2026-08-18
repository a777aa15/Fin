import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { getValidReset, updateUserPassword, consumeReset } from "@/lib/repo";

// Установка нового пароля по токену-ссылке.
const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(6, "Пароль минимум 6 символов"),
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

  const reset = await getValidReset(parsed.data.token);
  if (!reset) {
    return Response.json({ error: "Ссылка недействительна или устарела" }, { status: 400 });
  }

  const hash = await hashPassword(parsed.data.password);
  await updateUserPassword(reset.userId, hash);
  await consumeReset(parsed.data.token);
  return Response.json({ ok: true });
}
