import { z } from "zod";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/repo";

const schema = z.object({
  email: z.email("Некорректный e-mail"),
  password: z.string().min(6, "Пароль минимум 6 символов"),
  name: z.string().trim().max(80).optional(),
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
  const { email, password, name } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return Response.json({ error: "Пользователь с таким e-mail уже существует" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash, name ?? null);
  const token = await signSession({ id: user.id, email: user.email, name: user.name });
  await setSessionCookie(token);

  return Response.json({ user: { id: user.id, email: user.email, name: user.name } });
}
