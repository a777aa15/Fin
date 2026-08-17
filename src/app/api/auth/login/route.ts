import { z } from "zod";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";
import { findUserByEmail } from "@/lib/repo";

const schema = z.object({
  email: z.email("Некорректный e-mail"),
  password: z.string().min(1, "Введите пароль"),
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
  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "Неверный e-mail или пароль" }, { status: 401 });
  }

  const token = await signSession({ id: user.id, email: user.email, name: user.name });
  await setSessionCookie(token);

  return Response.json({ user: { id: user.id, email: user.email, name: user.name } });
}
